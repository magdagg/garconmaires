import { NextRequest, NextResponse } from "next/server";
import { sendStoreEmail } from "@/lib/store/email";
import {
  markOrderPaidFromVerifiedProvider,
  markOrderPaymentFailedOrCancelled,
  resolveOrderFromProviderReference,
} from "@/lib/store/orders";
import {
  assertPaymentWebhookMatchesPayment,
  getPaymentProviderAdapter,
} from "@/lib/store/payments";
import { trackAnalyticsEvent } from "@/lib/store/operations";
import { processPostgresPaymentWebhook } from "@/lib/store/postgres";
import {
  getConfiguredStoreStorageDriver,
  readStoreDatabase,
  updateStoreDatabase,
} from "@/lib/store/storage";
import type { PaymentProvider } from "@/lib/store/types";

export const runtime = "nodejs";

const knownProviders = new Set<PaymentProvider>(["tpay", "przelewy24", "payu"]);

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { provider: rawProvider } = await context.params;
  const provider = rawProvider as PaymentProvider;

  if (!knownProviders.has(provider)) {
    console.warn("[payment-webhook] unknown provider ignored", { provider: rawProvider });
    return NextResponse.json({ received: false }, { status: 404 });
  }

  try {
    const adapter = getPaymentProviderAdapter(provider);
    const rawBody = await request.text();
    const notification = await adapter.verifyWebhook(request, rawBody);
    let emailTaskType: "payment_confirmed" | "payment_failed" | null = null;
    let emailTaskOrderId: string | null = null;
    const storageDriver = getConfiguredStoreStorageDriver();

    console.info("[payment-webhook] received", {
      provider,
      providerEventId: notification.providerEventId,
      providerTransactionId: notification.providerTransactionId,
      orderId: notification.orderId,
      status: notification.status,
    });

    if (storageDriver === "postgres") {
      const result = await processPostgresPaymentWebhook(notification);

      if (result.duplicate) {
        console.info("[payment-webhook] duplicate ignored", {
          provider,
          providerEventId: notification.providerEventId,
        });
      }

      if (result.order) {
        emailTaskType =
          notification.status === "paid" ? "payment_confirmed" : "payment_failed";
        emailTaskOrderId = result.order.id;
      }
    } else {
      await updateStoreDatabase((database) => {
        if (database.processedWebhookEvents.includes(notification.providerEventId)) {
          console.info("[payment-webhook] duplicate ignored", {
            provider,
            providerEventId: notification.providerEventId,
          });
          return;
        }

        const order = resolveOrderFromProviderReference(database, {
          orderId: notification.orderId,
          providerTransactionId: notification.providerTransactionId,
        });

        if (!order) {
          database.processedWebhookEvents.push(notification.providerEventId);
          console.warn("[payment-webhook] order not found", {
            provider,
            providerEventId: notification.providerEventId,
          });
          return;
        }

        const payment = database.payments.find((item) => item.orderId === order.id);

        if (!payment) {
          throw new Error("Nie znaleziono płatności dla zamówienia.");
        }

        assertPaymentWebhookMatchesPayment(notification, payment);

        payment.provider = provider;
        payment.providerTransactionId =
          notification.providerTransactionId ?? payment.providerTransactionId;
        payment.providerPaymentId =
          notification.providerPaymentId ?? payment.providerPaymentId;
        payment.rawProviderPayload = notification.rawProviderPayload;

        if (notification.status === "paid") {
          markOrderPaidFromVerifiedProvider({
            database,
            orderId: order.id,
            providerTransactionId: notification.providerTransactionId,
            eventId: notification.providerEventId,
          });
          trackAnalyticsEvent(database, {
            name: "payment_success",
            orderId: order.id,
            customerEmail: order.customer.email,
            data: { provider, providerTransactionId: notification.providerTransactionId },
          });
          trackAnalyticsEvent(database, {
            name: "purchase",
            orderId: order.id,
            customerEmail: order.customer.email,
            data: { total: order.total, currency: order.currency },
          });
          emailTaskType = "payment_confirmed";
        } else {
          markOrderPaymentFailedOrCancelled(database, order.id, notification.status);
          trackAnalyticsEvent(database, {
            name: "payment_failed",
            orderId: order.id,
            customerEmail: order.customer.email,
            data: { provider, status: notification.status },
          });
          emailTaskType = "payment_failed";
        }

        database.processedWebhookEvents.push(notification.providerEventId);
        emailTaskOrderId = order.id;
      });
    }

    if (emailTaskType && emailTaskOrderId) {
      const database = await readStoreDatabase();
      const order = database.orders.find((item) => item.id === emailTaskOrderId);

      if (order) {
        await sendStoreEmail(emailTaskType, { order });
      }
    }

    return provider === "tpay"
      ? NextResponse.json({ result: true })
      : NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment webhook verification error.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
