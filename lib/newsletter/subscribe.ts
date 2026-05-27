import { createHash } from "node:crypto";
import {
  saveNewsletterSubscriber,
  type NewsletterSubscriberRow,
} from "@/lib/newsletter/google-sheets";
import { sendNewsletterConfirmationEmail } from "@/lib/newsletter/resend";
import {
  validateNewsletterPayload,
  type NewsletterPayload,
  type ValidatedNewsletterPayload,
} from "@/lib/newsletter/validation";

type NewsletterRequestContext = {
  headers: Headers;
};

type NewsletterSubscribeResponse =
  | { ok: true; status: "subscribed" | "already_subscribed" }
  | {
      ok: false;
      error:
        | "INVALID_EMAIL"
        | "CONSENT_REQUIRED"
        | "INVALID_SOURCE"
        | "INVALID_LANGUAGE"
        | "INVALID_REQUEST"
        | "RATE_LIMITED"
        | "SERVER_ERROR";
    };

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const USER_AGENT_MAX_LENGTH = 512;

declare global {
  var __garconmairesNewsletterRateLimit: Map<string, RateLimitEntry> | undefined;
}

function getRateLimitStore() {
  if (!globalThis.__garconmairesNewsletterRateLimit) {
    globalThis.__garconmairesNewsletterRateLimit = new Map();
  }

  return globalThis.__garconmairesNewsletterRateLimit;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }

  return headers.get("x-real-ip")?.trim() ?? "";
}

function getRequestMetadata(headers: Headers) {
  const rawIp = getClientIp(headers);
  const userAgent = (headers.get("user-agent") ?? "").trim().slice(0, USER_AGENT_MAX_LENGTH);
  const ipHash = rawIp ? sha256(rawIp) : "";

  return {
    userAgent,
    ipHash,
    rateLimitKey: ipHash || sha256(`ua:${userAgent || "unknown"}`),
  };
}

function isRateLimited(key: string) {
  const store = getRateLimitStore();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  store.set(key, existing);
  return false;
}

function isHoneypotTriggered(website: string) {
  return website.length > 0;
}

function toSubscriberRow(
  payload: ValidatedNewsletterPayload,
  metadata: ReturnType<typeof getRequestMetadata>,
): NewsletterSubscriberRow {
  return {
    email: payload.email,
    source: payload.source,
    language: payload.language,
    consent: true,
    createdAt: new Date().toISOString(),
    userAgent: metadata.userAgent,
    ipHash: metadata.ipHash,
  };
}

export async function subscribeToNewsletter({
  payload,
  headers,
}: {
  payload: NewsletterPayload | null;
  headers: NewsletterRequestContext["headers"];
}): Promise<NewsletterSubscribeResponse> {
  const validation = validateNewsletterPayload(payload);

  if (!validation.ok) {
    return validation;
  }

  if (isHoneypotTriggered(validation.value.website)) {
    return { ok: true, status: "subscribed" };
  }

  const metadata = getRequestMetadata(headers);

  if (isRateLimited(metadata.rateLimitKey)) {
    return {
      ok: false,
      error: "RATE_LIMITED",
    };
  }

  try {
    const status = await saveNewsletterSubscriber(
      toSubscriberRow(validation.value, metadata),
    );

    if (status === "already_subscribed") {
      return {
        ok: true,
        status,
      };
    }

    try {
      await sendNewsletterConfirmationEmail({
        email: validation.value.email,
        language: validation.value.language,
      });
    } catch (error) {
      console.error("Failed to send newsletter confirmation email", error);
    }

    return {
      ok: true,
      status,
    };
  } catch (error) {
    console.error("Newsletter subscription failed", error);
    return {
      ok: false,
      error: "SERVER_ERROR",
    };
  }
}
