import type { ShippingProviderId } from "./types";

export function getShippingTrackingUrl(input: {
  provider?: ShippingProviderId | string | null;
  trackingNumber?: string | null;
}) {
  const trackingNumber = input.trackingNumber?.trim();

  if (!trackingNumber) {
    return null;
  }

  if (input.provider === "inpost") {
    return `https://inpost.pl/sledzenie-przesylek?number=${encodeURIComponent(trackingNumber)}`;
  }

  return null;
}

export function sanitizeProviderError(value: unknown) {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : JSON.stringify(value ?? "Unknown provider error");

  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/gi, "Bearer [redacted]")
    .replace(/token[=:]\s*[^,\s}]+/gi, "token=[redacted]")
    .replace(/secret[=:]\s*[^,\s}]+/gi, "secret=[redacted]")
    .slice(0, 700);
}

export function safeJson(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return "[truncated]";
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return typeof value === "string" && value.length > 500
      ? `${value.slice(0, 500)}...`
      : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => safeJson(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        /token|secret|authorization|password|credential/i.test(key)
          ? "[redacted]"
          : safeJson(item, depth + 1),
      ]),
    );
  }

  return String(value);
}
