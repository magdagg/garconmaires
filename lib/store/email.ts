import { Resend } from "resend";
import type { Complaint, NewsletterSubscriber, Order, ReturnRequest } from "./types";

type EmailTemplate =
  | "order_created"
  | "payment_confirmed"
  | "payment_failed"
  | "order_shipped"
  | "return_requested"
  | "complaint_submitted"
  | "newsletter_confirmation"
  | "early_access_invitation";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  return apiKey ? new Resend(apiKey) : null;
}

function getFrom() {
  return process.env.ORDER_EMAIL_FROM?.trim() || "Garçonmaires Studio <studio@garconmaires.com>";
}

function getSupportEmail() {
  return process.env.ORDER_STUDIO_EMAIL?.trim() || "studio@garconmaires.com";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function frameHtml(title: string, body: string) {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeSupportEmail = escapeHtml(getSupportEmail());

  return `
    <div style="background:#000;color:#fff;font-family:Arial,sans-serif;padding:40px 24px;">
      <div style="margin:0 auto;max-width:560px;">
        <p style="margin:0 0 28px;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#888;">Garçonmaires / Warsaw</p>
        <h1 style="margin:0 0 24px;font-size:28px;line-height:1.15;font-weight:500;">${safeTitle}</h1>
        <div style="font-size:15px;line-height:1.8;color:#ddd;white-space:pre-line;">${safeBody}</div>
        <hr style="border:0;border-top:1px solid #222;margin:32px 0;" />
        <p style="margin:0;font-size:12px;line-height:1.7;color:#888;">Garçonmaires Studio<br><a href="mailto:${safeSupportEmail}" style="color:#fff;text-decoration:none;">${safeSupportEmail}</a></p>
      </div>
    </div>
  `.trim();
}

async function send({
  to,
  subject,
  title,
  body,
}: {
  to: string;
  subject: string;
  title: string;
  body: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    console.info("[store-email] skipped; RESEND_API_KEY is not configured", {
      template: subject,
      to,
    });
    return;
  }

  await resend.emails.send({
    from: getFrom(),
    to,
    subject,
    text: [title, "", body, "", "Garçonmaires Studio", getSupportEmail()].join("\n"),
    html: frameHtml(title, body),
  });
}

export async function sendStoreEmail(
  template: EmailTemplate,
  payload: {
    order?: Order;
    returnRequest?: ReturnRequest;
    complaint?: Complaint;
    subscriber?: NewsletterSubscriber;
    to?: string;
    paymentUrl?: string | null;
  },
) {
  const order = payload.order;

  if (template === "order_created" && order) {
    await send({
      to: order.customer.email,
      subject: `Zamówienie ${order.orderNumber} zostało utworzone`,
      title: "Zamówienie zostało utworzone.",
      body: `Numer zamówienia: ${order.orderNumber}\nKwota: ${(order.total / 100).toFixed(2)} PLN\n\nPłatność zostanie potwierdzona po weryfikacji operatora.`,
    });
  }

  if (template === "payment_confirmed" && order) {
    await send({
      to: order.customer.email,
      subject: `Płatność potwierdzona / ${order.orderNumber}`,
      title: "Płatność została potwierdzona.",
      body: `Przyjęliśmy zamówienie ${order.orderNumber} do realizacji. Wyślemy kolejną wiadomość po nadaniu przesyłki.`,
    });
  }

  if (template === "payment_failed" && order) {
    await send({
      to: order.customer.email,
      subject: `Płatność nie powiodła się / ${order.orderNumber}`,
      title: "Płatność nie została potwierdzona.",
      body: `Zamówienie ${order.orderNumber} nie zostało opłacone. Rezerwacja produktów zostanie zwolniona automatycznie.`,
    });
  }

  if (template === "order_shipped" && order) {
    await send({
      to: order.customer.email,
      subject: `Zamówienie wysłane / ${order.orderNumber}`,
      title: "Zamówienie zostało wysłane.",
      body: `Numer śledzenia: ${order.trackingNumber ?? order.delivery.trackingNumber ?? "-"}\nDziękujemy za zakup Garçonmaires.`,
    });
  }

  if (template === "return_requested" && payload.returnRequest) {
    await send({
      to: payload.returnRequest.customerEmail,
      subject: "Potwierdzenie zgłoszenia zwrotu",
      title: "Otrzymaliśmy zgłoszenie zwrotu.",
      body: `Numer zgłoszenia: ${payload.returnRequest.id}\nWrócimy z dalszymi krokami po weryfikacji.`,
    });
  }

  if (template === "complaint_submitted" && payload.complaint) {
    await send({
      to: payload.complaint.customerEmail,
      subject: "Potwierdzenie zgłoszenia reklamacji",
      title: "Otrzymaliśmy zgłoszenie reklamacji.",
      body: `Numer zgłoszenia: ${payload.complaint.id}\nRozpatrzymy je zgodnie z obowiązującymi zasadami sklepu.`,
    });
  }

  if (template === "newsletter_confirmation" && payload.subscriber) {
    await send({
      to: payload.subscriber.email,
      subject: "Potwierdź zapis do Garçonmaires",
      title: "Potwierdź zapis.",
      body: `Dziękujemy za dołączenie do listy. Status zapisu: ${payload.subscriber.status}.`,
    });
  }

  if (template === "early_access_invitation" && payload.subscriber) {
    await send({
      to: payload.subscriber.email,
      subject: "Garçonmaires early access",
      title: "Early access.",
      body: "Twój adres znajduje się na liście wcześniejszego dostępu do dropu Garçonmaires.",
    });
  }
}
