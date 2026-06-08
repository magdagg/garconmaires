import { Resend } from "resend";
import { getPrisma } from "@/lib/prisma";
import { createDefaultStoreDatabase } from "./defaults";
import { getTrackingUrl } from "./delivery";
import { createId, nowIso } from "./ids";
import {
  getConfiguredStoreStorageDriver,
  readStoreDatabase,
  updateStoreDatabase,
} from "./storage";
import type {
  Complaint,
  EmailEvent,
  NewsletterSubscriber,
  Order,
  ReturnRequest,
  StoreEmailTemplate,
} from "./types";

export type EmailTemplate = StoreEmailTemplate;

export type EmailRenderResult = {
  template: EmailTemplate;
  subject: string;
  html: string;
  text: string;
};

export type EmailConfigDiagnostics = {
  resendApiKeyPresent: boolean;
  resendFromEmailPresent: boolean;
  resendReplyToPresent: boolean;
  emailTestMode: boolean;
  emailTestRecipientPresent: boolean;
  vercelEnv: string | null;
  nodeEnv: string | null;
  warnings: string[];
};

type EmailPayload = {
  order?: Order;
  returnRequest?: ReturnRequest;
  complaint?: Complaint;
  subscriber?: NewsletterSubscriber;
  to?: string;
  paymentUrl?: string | null;
};

const templateLabels: Record<EmailTemplate, string> = {
  order_created: "Order confirmation",
  payment_pending: "Payment pending",
  payment_confirmed: "Payment confirmed",
  payment_failed: "Payment failed",
  order_shipped: "Order shipped",
  return_requested: "Return request received",
  complaint_submitted: "Complaint request received",
  newsletter_confirmation: "Newsletter confirmation",
  early_access_invitation: "Early access invitation",
};

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getResendClient() {
  const apiKey = env("RESEND_API_KEY");

  return apiKey ? new Resend(apiKey) : null;
}

function getFrom() {
  return env("RESEND_FROM_EMAIL") || env("ORDER_EMAIL_FROM");
}

function getSupportEmail() {
  return env("RESEND_REPLY_TO") || env("ORDER_STUDIO_EMAIL") || "studio@garconmaires.com";
}

function getReplyTo() {
  return env("RESEND_REPLY_TO") || undefined;
}

function isProductionDeployment() {
  const vercelEnv = env("VERCEL_ENV");

  return vercelEnv ? vercelEnv === "production" : env("NODE_ENV") === "production";
}

function emailTestMode() {
  return env("EMAIL_TEST_MODE") === "true";
}

export function getEmailConfigDiagnostics(): EmailConfigDiagnostics {
  const warnings: string[] = [];
  const resendApiKeyPresent = Boolean(env("RESEND_API_KEY"));
  const resendFromEmailPresent = Boolean(getFrom());
  const emailTestRecipientPresent = Boolean(env("EMAIL_TEST_RECIPIENT"));

  if (!resendApiKeyPresent) {
    warnings.push("RESEND_API_KEY missing; emails will be skipped.");
  }

  if (!resendFromEmailPresent) {
    warnings.push("RESEND_FROM_EMAIL missing; emails will be skipped.");
  }

  if (isProductionDeployment() && emailTestMode() && !emailTestRecipientPresent) {
    warnings.push("EMAIL_TEST_MODE=true in production requires EMAIL_TEST_RECIPIENT.");
  }

  return {
    resendApiKeyPresent,
    resendFromEmailPresent,
    resendReplyToPresent: Boolean(getReplyTo()),
    emailTestMode: emailTestMode(),
    emailTestRecipientPresent,
    vercelEnv: env("VERCEL_ENV") || null,
    nodeEnv: env("NODE_ENV") || null,
    warnings,
  };
}

export function getAvailableEmailTemplates() {
  return (Object.keys(templateLabels) as EmailTemplate[]).map((id) => ({
    id,
    label: templateLabels[id],
  }));
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(amount: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount / 100);
}

function textLine(label: string, value: unknown) {
  const text = String(value ?? "").trim();

  return text ? `${label}: ${text}` : null;
}

function addressLines(order: Order) {
  const address = order.shippingAddress;

  return [
    `${address.firstName} ${address.lastName}`.trim(),
    address.addressLine1,
    address.addressLine2,
    `${address.postalCode} ${address.city}`.trim(),
    address.country,
  ].filter(Boolean);
}

function deliveryLines(order: Order) {
  const delivery = order.delivery;
  const lines = [
    textLine("Metoda dostawy", delivery.deliveryMethod),
    textLine("Koszt dostawy", money(delivery.deliveryPrice)),
    textLine("Paczkomat", delivery.parcelLockerName ?? delivery.parcelLockerId),
    textLine("Adres Paczkomatu", delivery.parcelLockerAddress),
    textLine("Numer śledzenia", delivery.trackingNumber),
    textLine("Link śledzenia", delivery.trackingUrl),
  ];

  if (!delivery.parcelLockerId) {
    lines.push(textLine("Adres", addressLines(order).join(", ")));
  }

  return lines.filter((line): line is string => Boolean(line));
}

function itemLines(order: Order) {
  return order.items.map(
    (item) =>
      `${item.name} / ${item.size} / ${item.quantity} x ${money(item.unitPrice)} = ${money(item.total)}`,
  );
}

function frameHtml({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; rows: string[] }[];
}) {
  const support = getSupportEmail();
  const sectionHtml = sections
    .map(
      (section) => `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #222;margin-top:28px;padding-top:18px;">
          <tr><td style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#888;padding-bottom:12px;">${escapeHtml(section.heading)}</td></tr>
          ${section.rows
            .map(
              (row) =>
                `<tr><td style="font-size:14px;line-height:1.7;color:#ddd;padding:3px 0;">${escapeHtml(row)}</td></tr>`,
            )
            .join("")}
        </table>
      `,
    )
    .join("");

  return `
<!doctype html>
<html>
  <body style="margin:0;background:#000;color:#fff;">
    <div style="background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;padding:36px 18px;">
      <div style="margin:0 auto;max-width:600px;">
        <p style="margin:0 0 28px;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#888;">Garçonmaires / Warsaw</p>
        <h1 style="margin:0 0 18px;font-size:28px;line-height:1.15;font-weight:500;color:#fff;">${escapeHtml(title)}</h1>
        <p style="margin:0;font-size:15px;line-height:1.8;color:#ddd;">${escapeHtml(intro)}</p>
        ${sectionHtml}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #222;margin-top:32px;padding-top:20px;">
          <tr><td style="font-size:12px;line-height:1.7;color:#888;">Garçonmaires Studio<br><a href="mailto:${escapeHtml(support)}" style="color:#fff;text-decoration:none;">${escapeHtml(support)}</a><br>Ta wiadomość dotyczy obsługi zamówienia lub zgłoszenia. Zachowaj ją dla własnych zapisów.</td></tr>
        </table>
      </div>
    </div>
  </body>
</html>`.trim();
}

function plainText({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; rows: string[] }[];
}) {
  return [
    "Garçonmaires / Warsaw",
    "",
    title,
    "",
    intro,
    "",
    ...sections.flatMap((section) => [
      section.heading,
      ...section.rows,
      "",
    ]),
    "Garçonmaires Studio",
    getSupportEmail(),
  ].join("\n");
}

function renderFramedEmail(input: {
  template: EmailTemplate;
  subject: string;
  title: string;
  intro: string;
  sections: { heading: string; rows: string[] }[];
}): EmailRenderResult {
  return {
    template: input.template,
    subject: input.subject,
    html: frameHtml(input),
    text: plainText(input),
  };
}

function requireOrder(template: EmailTemplate, order?: Order) {
  if (!order) {
    throw new Error(`Template ${template} requires an order.`);
  }

  return order;
}

export function renderStoreEmail(
  template: EmailTemplate,
  payload: EmailPayload,
): EmailRenderResult {
  if (template === "newsletter_confirmation" || template === "early_access_invitation") {
    const subscriber = payload.subscriber;

    if (!subscriber) {
      throw new Error(`Template ${template} requires a subscriber.`);
    }

    return renderFramedEmail({
      template,
      subject:
        template === "newsletter_confirmation"
          ? "Garçonmaires — potwierdzenie zapisu"
          : "Garçonmaires — early access",
      title:
        template === "newsletter_confirmation"
          ? "Potwierdzenie zapisu"
          : "Early access",
      intro:
        template === "newsletter_confirmation"
          ? "Adres został dodany do listy Garçonmaires. Wyślemy tylko informacje związane ze startem i kolekcjami."
          : "Twój adres znajduje się na liście wcześniejszego dostępu do Garçonmaires.",
      sections: [
        {
          heading: "Status",
          rows: [
            `Adres: ${subscriber.email}`,
            `Status: ${subscriber.status}`,
            `Early access: ${subscriber.earlyAccess ? "tak" : "nie"}`,
          ],
        },
      ],
    });
  }

  if (template === "return_requested") {
    if (!payload.returnRequest) {
      throw new Error("Template return_requested requires a return request.");
    }

    return renderFramedEmail({
      template,
      subject: `Garçonmaires — przyjęliśmy zgłoszenie zwrotu ${payload.returnRequest.orderId}`,
      title: "Przyjęliśmy zgłoszenie zwrotu",
      intro: "Zgłoszenie zostało zapisane. Wrócimy z dalszymi krokami po weryfikacji.",
      sections: [
        {
          heading: "Zgłoszenie",
          rows: [
            `Numer zgłoszenia: ${payload.returnRequest.id}`,
            `Zamówienie: ${payload.returnRequest.orderId}`,
            `Status: ${payload.returnRequest.status}`,
            `Kontakt: ${getSupportEmail()}`,
          ],
        },
      ],
    });
  }

  if (template === "complaint_submitted") {
    if (!payload.complaint) {
      throw new Error("Template complaint_submitted requires a complaint.");
    }

    return renderFramedEmail({
      template,
      subject: `Garçonmaires — przyjęliśmy reklamację ${payload.complaint.orderId}`,
      title: "Przyjęliśmy reklamację",
      intro: "Zgłoszenie zostało zapisane i zostanie rozpatrzone zgodnie z zasadami sklepu.",
      sections: [
        {
          heading: "Zgłoszenie",
          rows: [
            `Numer zgłoszenia: ${payload.complaint.id}`,
            `Zamówienie: ${payload.complaint.orderId}`,
            `Status: ${payload.complaint.status}`,
            `Preferowane rozwiązanie: ${payload.complaint.preferredSolution}`,
            `Kontakt: ${getSupportEmail()}`,
          ],
        },
      ],
    });
  }

  const order = requireOrder(template, payload.order);
  const baseSections = [
    {
      heading: "Zamówienie",
      rows: [
        `Numer: ${order.orderNumber}`,
        `Klient: ${order.customer.firstName} ${order.customer.lastName}`.trim(),
        `Status płatności: ${order.paymentStatus}`,
        `Suma brutto: ${money(order.total)}`,
      ],
    },
    { heading: "Produkty", rows: itemLines(order) },
    { heading: "Dostawa", rows: deliveryLines(order) },
  ];

  if (template === "order_created") {
    return renderFramedEmail({
      template,
      subject: `Garçonmaires — potwierdzenie zamówienia ${order.orderNumber}`,
      title: "Potwierdzenie zamówienia",
      intro:
        payload.paymentUrl
          ? "Zamówienie zostało utworzone. Płatność zostanie potwierdzona po weryfikacji operatora."
          : "Zamówienie zostało utworzone. Oczekujemy na płatność.",
      sections: baseSections,
    });
  }

  if (template === "payment_pending") {
    return renderFramedEmail({
      template,
      subject: `Garçonmaires — oczekujemy na płatność ${order.orderNumber}`,
      title: "Oczekujemy na płatność",
      intro: "Płatność nie została jeszcze potwierdzona przez operatora.",
      sections: baseSections,
    });
  }

  if (template === "payment_confirmed") {
    return renderFramedEmail({
      template,
      subject: `Garçonmaires — płatność przyjęta ${order.orderNumber}`,
      title: "Płatność przyjęta",
      intro: "Zamówienie zostało przyjęte do realizacji. Wyślemy kolejną wiadomość po nadaniu przesyłki.",
      sections: baseSections,
    });
  }

  if (template === "payment_failed") {
    return renderFramedEmail({
      template,
      subject: `Garçonmaires — płatność nie została ukończona ${order.orderNumber}`,
      title: "Płatność nie została ukończona",
      intro: "Zamówienie nie zostało opłacone. Rezerwacja produktów zostanie zwolniona automatycznie.",
      sections: baseSections,
    });
  }

  if (template === "order_shipped") {
    const trackingNumber = order.delivery.trackingNumber ?? order.trackingNumber;
    const trackingUrl =
      order.delivery.trackingUrl ??
      (trackingNumber
        ? getTrackingUrl({
            provider: order.delivery.shipmentProvider,
            trackingNumber,
          })
        : null);

    return renderFramedEmail({
      template,
      subject: `Garçonmaires — zamówienie wysłane ${order.orderNumber}`,
      title: "Zamówienie wysłane",
      intro: "Przesyłka została nadana. Szczegóły śledzenia znajdziesz poniżej.",
      sections: [
        ...baseSections,
        {
          heading: "Śledzenie",
          rows: [
            `Przewoźnik: ${order.delivery.shipmentProvider}`,
            `Numer: ${trackingNumber ?? "-"}`,
            `Link: ${trackingUrl ?? "-"}`,
          ],
        },
      ],
    });
  }

  throw new Error(`Unknown email template: ${template}`);
}

export function createSyntheticEmailPayload(template: EmailTemplate): EmailPayload {
  const database = createDefaultStoreDatabase();
  const order: Order = {
    id: "ord-email-preview",
    orderNumber: "GM-2026-0001",
    customer: {
      firstName: "Anna",
      lastName: "Nowak",
      email: "test@example.com",
      phone: "500600700",
    },
    shippingAddress: {
      firstName: "Anna",
      lastName: "Nowak",
      addressLine1: "Mokotowska 1",
      postalCode: "00-001",
      city: "Warszawa",
      country: "PL",
    },
    invoice: { wantsInvoice: false },
    delivery: {
      deliveryMethod: "inpost_locker",
      shipmentProvider: "inpost",
      parcelLockerId: "WAW01A",
      parcelLockerName: "WAW01A",
      parcelLockerAddress: "Mokotowska 1, Warszawa",
      deliveryPrice: 1499,
      trackingNumber: "1234567890",
      trackingUrl: "https://inpost.pl/sledzenie-przesylek?number=1234567890",
      labelUrl: null,
      shippedAt: null,
      adminNote: null,
      deliveryStatus: "pending",
    },
    items: [
      {
        productId: "prod-garconmaires-preview",
        variantId: "var-garconmaires-preview-m",
        sku: "GM-PREVIEW-M",
        name: "Garçonmaires Preview Piece",
        slug: "preview",
        size: "M",
        quantity: 1,
        unitPrice: 45900,
        total: 45900,
        currency: "PLN",
      },
    ],
    subtotal: 45900,
    deliveryCost: 1499,
    discount: 0,
    total: 47399,
    currency: "PLN",
    provider: "tpay",
    paymentStatus: template === "payment_confirmed" ? "paid" : "pending",
    fulfillmentStatus: template === "order_shipped" ? "shipped" : "unfulfilled",
    orderStatus: "new",
    trackingNumber: "1234567890",
    consentLog: {
      termsAcceptedAt: nowIso(),
      privacyAcceptedAt: nowIso(),
      newsletterConsentAt: null,
      marketingConsentAt: null,
      legalDocumentVersion: database.settings.legalDocumentVersion,
    },
    reservationIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  return {
    order,
    returnRequest: {
      id: "ret-email-preview",
      orderId: order.orderNumber,
      customerEmail: order.customer.email,
      selectedItems: [
        {
          productId: order.items[0].productId,
          variantId: order.items[0].variantId,
          quantity: 1,
        },
      ],
      status: "requested",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    complaint: {
      id: "cmp-email-preview",
      orderId: order.orderNumber,
      customerEmail: order.customer.email,
      productId: order.items[0].productId,
      description: "Synthetic complaint preview.",
      imageUrls: [],
      preferredSolution: "replacement",
      status: "submitted",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    subscriber: {
      id: "sub-email-preview",
      email: "test@example.com",
      consent: true,
      consentTimestamp: nowIso(),
      source: "admin_preview",
      status: "confirmed",
      earlyAccess: template === "early_access_invitation",
      tags: ["preview"],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  };
}

async function recordEmailEvent(event: Omit<EmailEvent, "id" | "createdAt">) {
  const id = createId("email");
  const createdAt = nowIso();
  const record: EmailEvent = { id, createdAt, ...event };

  if (getConfiguredStoreStorageDriver() === "postgres") {
    try {
      await getPrisma().emailEvent.create({
        data: {
          id,
          orderId: record.orderId ?? null,
          recipientEmail: record.recipientEmail,
          template: record.template,
          provider: record.provider,
          status: record.status,
          providerMessageId: record.providerMessageId ?? null,
          errorSummary: record.errorSummary ?? null,
          createdAt: new Date(record.createdAt),
          sentAt: record.sentAt ? new Date(record.sentAt) : null,
        },
      });
      return record;
    } catch (error) {
      console.warn("[store-email] event log skipped", {
        template: record.template,
        status: record.status,
        error: error instanceof Error ? error.message : "unknown",
      });
      return record;
    }
  }

  await updateStoreDatabase((database) => {
    database.emailEvents.unshift(record);
  });

  return record;
}

async function hasSentEmailForOrder(orderId: string | null | undefined, template: EmailTemplate) {
  if (!orderId) {
    return false;
  }

  if (getConfiguredStoreStorageDriver() === "postgres") {
    try {
      const count = await getPrisma().emailEvent.count({
        where: {
          orderId,
          template,
          status: { in: ["sent", "queued"] },
        },
      });

      return count > 0;
    } catch {
      return false;
    }
  }

  const database = await readStoreDatabase();

  return database.emailEvents.some(
    (event) =>
      event.orderId === orderId &&
      event.template === template &&
      (event.status === "sent" || event.status === "queued"),
  );
}

function recipientForPayload(template: EmailTemplate, payload: EmailPayload) {
  return (
    payload.to ??
    payload.order?.customer.email ??
    payload.returnRequest?.customerEmail ??
    payload.complaint?.customerEmail ??
    payload.subscriber?.email ??
    ""
  ).trim();
}

function safeErrorSummary(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown email provider error.";

  return message.slice(0, 240);
}

async function sendRenderedEmail({
  template,
  payload,
  recipient,
  rendered,
  forceTestSend = false,
}: {
  template: EmailTemplate;
  payload: EmailPayload;
  recipient: string;
  rendered: EmailRenderResult;
  forceTestSend?: boolean;
}) {
  const config = getEmailConfigDiagnostics();
  const from = getFrom();
  const resend = getResendClient();
  const orderId = payload.order?.id ?? null;

  if (!recipient) {
    await recordEmailEvent({
      orderId,
      recipientEmail: "-",
      template,
      provider: "resend",
      status: "skipped",
      errorSummary: "Missing recipient email.",
      sentAt: null,
    });
    return { status: "skipped" as const, reason: "missing_recipient" };
  }

  if (!forceTestSend && await hasSentEmailForOrder(orderId, template)) {
    await recordEmailEvent({
      orderId,
      recipientEmail: recipient,
      template,
      provider: "resend",
      status: "skipped",
      errorSummary: "Duplicate lifecycle email prevented.",
      sentAt: null,
    });
    return { status: "skipped" as const, reason: "duplicate_prevented" };
  }

  if (!resend || !from) {
    const reason = !resend
      ? "RESEND_API_KEY is not configured."
      : "RESEND_FROM_EMAIL is not configured.";
    console.info("[store-email] skipped; provider is not configured", {
      template,
      to: recipient,
      reason,
    });
    await recordEmailEvent({
      orderId,
      recipientEmail: recipient,
      template,
      provider: "resend",
      status: "skipped",
      errorSummary: reason,
      sentAt: null,
    });
    return { status: "skipped" as const, reason };
  }

  if (isProductionDeployment() && forceTestSend && (!config.emailTestMode || !env("EMAIL_TEST_RECIPIENT"))) {
    await recordEmailEvent({
      orderId,
      recipientEmail: recipient,
      template,
      provider: "resend",
      status: "skipped",
      errorSummary: "Production test send blocked without EMAIL_TEST_MODE and EMAIL_TEST_RECIPIENT.",
      sentAt: null,
    });
    return { status: "skipped" as const, reason: "production_test_send_blocked" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: recipient,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: getReplyTo(),
    });
    const providerMessageId = result.data?.id ?? null;
    const status = providerMessageId ? "sent" : "queued";

    await recordEmailEvent({
      orderId,
      recipientEmail: recipient,
      template,
      provider: "resend",
      status,
      providerMessageId,
      errorSummary: result.error?.message?.slice(0, 240) ?? null,
      sentAt: nowIso(),
    });

    return { status, providerMessageId, error: result.error?.message ?? null };
  } catch (error) {
    const errorSummary = safeErrorSummary(error);

    await recordEmailEvent({
      orderId,
      recipientEmail: recipient,
      template,
      provider: "resend",
      status: "failed",
      errorSummary,
      sentAt: null,
    });

    console.warn("[store-email] failed", { template, to: recipient, error: errorSummary });
    return { status: "failed" as const, error: errorSummary };
  }
}

export async function sendStoreEmail(template: EmailTemplate, payload: EmailPayload) {
  const rendered = renderStoreEmail(template, payload);
  const recipient = recipientForPayload(template, payload);

  return sendRenderedEmail({ template, payload, recipient, rendered });
}

export async function previewStoreEmail(template: EmailTemplate, payload?: EmailPayload) {
  return renderStoreEmail(template, payload ?? createSyntheticEmailPayload(template));
}

export async function sendStoreEmailTest(input: {
  template: EmailTemplate;
  recipient?: string | null;
  payload?: EmailPayload;
}) {
  const configuredRecipient = env("EMAIL_TEST_RECIPIENT");
  const requestedRecipient = input.recipient?.trim();
  const recipient =
    configuredRecipient ||
    (!isProductionDeployment() && requestedRecipient ? requestedRecipient : "");

  if (!recipient) {
    await recordEmailEvent({
      orderId: null,
      recipientEmail: requestedRecipient || "-",
      template: input.template,
      provider: "resend",
      status: "skipped",
      errorSummary: "No safe test recipient configured.",
      sentAt: null,
    });
    return { status: "skipped" as const, reason: "no_safe_test_recipient" };
  }

  const payload = input.payload ?? createSyntheticEmailPayload(input.template);
  const rendered = renderStoreEmail(input.template, payload);

  return sendRenderedEmail({
    template: input.template,
    payload,
    recipient,
    rendered,
    forceTestSend: true,
  });
}
