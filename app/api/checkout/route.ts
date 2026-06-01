import { NextRequest, NextResponse } from "next/server";
import {
  getCanonicalBaseUrl,
  type CheckoutItemInput,
} from "@/lib/commerce";
import { copy, type Locale } from "@/lib/i18n";
import { addCartItem, findOrCreateCart, validateCart } from "@/lib/store/cart";
import { isAuthorizedStoreAdmin } from "@/lib/store/admin";
import { sendStoreEmail } from "@/lib/store/email";
import { createSessionId } from "@/lib/store/ids";
import {
  createOrderFromCart,
  markOrderPaymentFailedOrCancelled,
  markOrderPaymentStarted,
  type CheckoutCustomerInput,
} from "@/lib/store/orders";
import { trackAnalyticsEvent } from "@/lib/store/operations";
import { getPaymentProviderAdapter } from "@/lib/store/payments";
import {
  createPostgresCheckout,
  markPostgresPaymentStarted,
  releasePostgresOrderReservations,
} from "@/lib/store/postgres";
import { getConfiguredStoreStorageDriver, updateStoreDatabase } from "@/lib/store/storage";

type CheckoutRequestBody = {
  items?: CheckoutItemInput[];
  locale?: Locale;
} & CheckoutCustomerInput;

export async function POST(request: NextRequest) {
  let createdOrderId: string | null = null;

  try {
    const body = (await request.json()) as CheckoutRequestBody;
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    const locale = body.locale === "en" ? "en" : "pl";
    const t = copy[locale].checkout;
    const allowDisabledShop =
      process.env.CHECKOUT_TEST_MODE === "true" &&
      request.headers.get("x-checkout-test-mode") === "true" &&
      isAuthorizedStoreAdmin(request);

    if (requestedItems.length === 0) {
      return NextResponse.json(
        { error: t.emptyError },
        { status: 400 },
      );
    }

    const sessionId = request.cookies.get("gm_cart_session")?.value ?? createSessionId();
    const storageDriver = getConfiguredStoreStorageDriver();
    const checkout =
      storageDriver === "postgres"
        ? await createPostgresCheckout({
            items: requestedItems,
            sessionId,
            checkout: body,
            allowDisabledShop,
          })
        : await updateStoreDatabase((database) => {
            const cart = findOrCreateCart(database, sessionId);
            cart.items = [];

            for (const item of requestedItems) {
              addCartItem(database, {
                sessionId,
                productId: item.productId,
                size: item.size,
                quantity: item.quantity,
              });
            }

            const validation = validateCart(database, cart, { allowDisabledShop });

            if (!validation.ok) {
              throw new Error(validation.errors.join(" "));
            }

            const created = createOrderFromCart({
              database,
              cartId: cart.id,
              input: body,
            });
            createdOrderId = created.order.id;

            trackAnalyticsEvent(database, {
              name: "begin_checkout",
              sessionId,
              orderId: created.order.id,
              customerEmail: created.order.customer.email,
            });

            return created;
          });

    const { order } = checkout;
    createdOrderId = order.id;
    const baseUrl = getCanonicalBaseUrl(request.nextUrl.origin);
    const paymentAdapter = getPaymentProviderAdapter(order.provider);

    const payment = await paymentAdapter.createPayment({
      order,
      baseUrl,
      locale,
    });
    const paymentUrl = paymentAdapter.getPaymentRedirectUrl(payment);

    if (!paymentUrl) {
      throw new Error(t.sessionError);
    }

    if (storageDriver === "postgres") {
      await markPostgresPaymentStarted({
        orderId: order.id,
        payment,
        sessionId,
      });
    } else {
      await updateStoreDatabase((database) => {
        markOrderPaymentStarted(
          database,
          order.id,
          paymentUrl,
          payment.providerTransactionId,
        );
        const paymentRecord = database.payments.find((item) => item.orderId === order.id);

        if (paymentRecord) {
          paymentRecord.provider = payment.provider;
          paymentRecord.providerPaymentId = payment.providerPaymentId;
          paymentRecord.rawProviderPayload = payment.rawProviderPayload ?? null;
        }
        trackAnalyticsEvent(database, {
          name: "payment_started",
          sessionId,
          orderId: order.id,
          customerEmail: order.customer.email,
          data: { provider: order.provider },
        });
      });
    }
    await sendStoreEmail("order_created", { order, paymentUrl });

    const response = NextResponse.json({
      orderId: order.id,
      paymentUrl,
      url: paymentUrl,
    });
    response.cookies.set("gm_cart_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (error) {
    if (createdOrderId) {
      const orderIdToRelease = createdOrderId;
      const release =
        getConfiguredStoreStorageDriver() === "postgres"
          ? releasePostgresOrderReservations(orderIdToRelease, "failed")
          : updateStoreDatabase((database) => {
              markOrderPaymentFailedOrCancelled(database, orderIdToRelease, "failed");
            });

      await release.catch((releaseError) => {
        console.error("[checkout] failed to release stock after checkout error", {
          orderId: orderIdToRelease,
          error:
            releaseError instanceof Error
              ? releaseError.message
              : "Unknown release error",
        });
      });
    }

    const message =
      error instanceof Error ? error.message : copy.pl.checkout.sessionError;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
