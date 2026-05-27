export type NewsletterLanguage = "pl" | "en";

export type NewsletterPayload = {
  email?: unknown;
  source?: unknown;
  language?: unknown;
  consent?: unknown;
  website?: unknown;
};

export type NewsletterValidationResult =
  | {
      ok: true;
      value: ValidatedNewsletterPayload;
    }
  | {
      ok: false;
      error:
        | "INVALID_EMAIL"
        | "CONSENT_REQUIRED"
        | "INVALID_SOURCE"
        | "INVALID_LANGUAGE"
        | "INVALID_REQUEST";
    };

export type ValidatedNewsletterPayload = {
  email: string;
  source: string;
  language: NewsletterLanguage;
  consent: true;
  website: string;
};

export const NEWSLETTER_EMAIL_MAX_LENGTH = 254;
export const NEWSLETTER_SOURCE_MAX_LENGTH = 64;
export const NEWSLETTER_HONEYPOT_MAX_LENGTH = 128;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sourcePattern = /^[a-z0-9_-]+$/i;

export function normalizeNewsletterEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateNewsletterPayload(
  payload: NewsletterPayload | null,
): NewsletterValidationResult {
  const rawEmail = typeof payload?.email === "string" ? payload.email : "";
  const rawSource = typeof payload?.source === "string" ? payload.source : "";
  const rawLanguage = payload?.language;
  const rawWebsite = typeof payload?.website === "string" ? payload.website : "";

  const email = normalizeNewsletterEmail(rawEmail);
  const source = rawSource.trim().toLowerCase();
  const website = rawWebsite.trim();

  if (email.length === 0 || email.length > NEWSLETTER_EMAIL_MAX_LENGTH || !emailPattern.test(email)) {
    return { ok: false, error: "INVALID_EMAIL" };
  }

  if (
    source.length === 0 ||
    source.length > NEWSLETTER_SOURCE_MAX_LENGTH ||
    !sourcePattern.test(source)
  ) {
    return { ok: false, error: "INVALID_SOURCE" };
  }

  if (rawLanguage !== "pl" && rawLanguage !== "en") {
    return { ok: false, error: "INVALID_LANGUAGE" };
  }

  if (payload?.consent !== true) {
    return { ok: false, error: "CONSENT_REQUIRED" };
  }

  if (website.length > NEWSLETTER_HONEYPOT_MAX_LENGTH) {
    return { ok: false, error: "INVALID_REQUEST" };
  }

  return {
    ok: true,
    value: {
      email,
      source,
      language: rawLanguage,
      consent: true,
      website,
    },
  };
}
