import { Resend } from "resend";
import type { NewsletterLanguage } from "@/lib/newsletter/validation";

const NEWSLETTER_SENDER = "Garçonmaires Studio <studio@garconmaires.com>";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(apiKey);
}

function getEmailCopy(language: NewsletterLanguage) {
  if (language === "pl") {
    return {
      subject: "Potwierdzenie zapisu do newslettera Garçonmaires",
      intro: "Dziękujemy za zapis do newslettera Garçonmaires.",
      body:
        "Będziemy informować Cię o premierach kolekcji, limitowanych dropach i nowościach marki.",
      footer:
        "Otrzymujesz tę wiadomość, ponieważ zapisano się do newslettera Garçonmaires.",
    };
  }

  return {
    subject: "Welcome to Garçonmaires",
    intro: "Thank you for joining Garçonmaires.",
    body:
      "You have been added to our private newsletter list. We will keep you updated about upcoming drops, limited releases and brand news.",
    footer:
      "You received this email because you subscribed to the Garçonmaires newsletter.",
  };
}

function buildHtmlEmail(language: NewsletterLanguage) {
  const copy = getEmailCopy(language);

  return `
    <div style="background:#ffffff;color:#111111;font-family:Arial,sans-serif;padding:40px 24px;">
      <div style="margin:0 auto;max-width:560px;">
        <p style="margin:0 0 24px;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#555555;">
          Garçonmaires
        </p>
        <h1 style="margin:0 0 20px;font-size:28px;line-height:1.1;font-weight:600;">
          ${copy.intro}
        </h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#222222;">
          ${copy.body}
        </p>
        <p style="margin:28px 0 0;font-size:14px;line-height:1.8;color:#111111;">
          Garçonmaires Studio<br />
          <a href="mailto:studio@garconmaires.com" style="color:#111111;text-decoration:none;">studio@garconmaires.com</a>
        </p>
        <hr style="margin:32px 0;border:none;border-top:1px solid #e5e5e5;" />
        <p style="margin:0;font-size:12px;line-height:1.7;color:#666666;">
          ${copy.footer}
        </p>
      </div>
    </div>
  `.trim();
}

function buildTextEmail(language: NewsletterLanguage) {
  const copy = getEmailCopy(language);

  return [
    copy.intro,
    "",
    copy.body,
    "",
    "Garçonmaires Studio",
    "studio@garconmaires.com",
    "",
    copy.footer,
  ].join("\n");
}

export async function sendNewsletterConfirmationEmail({
  email,
  language,
}: {
  email: string;
  language: NewsletterLanguage;
}) {
  const resend = getResendClient();
  const copy = getEmailCopy(language);

  const result = await resend.emails.send({
    from: NEWSLETTER_SENDER,
    to: email,
    subject: copy.subject,
    text: buildTextEmail(language),
    html: buildHtmlEmail(language),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}
