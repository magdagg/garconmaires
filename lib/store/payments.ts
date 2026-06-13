import {
  X509Certificate,
  createHash,
  createHmac,
  createVerify,
  timingSafeEqual,
} from "node:crypto";
import type { NextRequest } from "next/server";
import type {
  Order,
  PaymentProvider,
  PaymentStatus,
  PaymentTransaction,
} from "./types";

export function getDefaultPaymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();

  if (
    configured === "przelewy24" ||
    configured === "payu" ||
    configured === "tpay"
  ) {
    return configured;
  }

  return "tpay";
}

export function assertWebhookVerified(provider: PaymentProvider, verified: boolean) {
  if (!verified) {
    throw new Error(`Unverified ${provider} payment callback.`);
  }
}

export type PaymentCreation = {
  provider: PaymentProvider;
  providerTransactionId: string;
  providerPaymentId: string | null;
  paymentUrl: string;
  rawProviderPayload?: Record<string, unknown>;
};

export type PaymentWebhookResult = {
  provider: PaymentProvider;
  providerEventId: string;
  providerTransactionId: string | null;
  providerPaymentId: string | null;
  orderId: string | null;
  status: Extract<PaymentStatus, "paid" | "failed" | "cancelled" | "expired">;
  amount: number | null;
  currency: "PLN" | null;
  rawProviderPayload: Record<string, unknown>;
};

export type PaymentProviderAdapter = {
  provider: PaymentProvider;
  displayName: string;
  requiredEnv: string[];
  createPayment: (input: {
    order: Order;
    baseUrl: string;
    locale: "pl" | "en";
  }) => Promise<PaymentCreation>;
  verifyWebhook: (request: NextRequest, rawBody: string) => Promise<PaymentWebhookResult>;
  getPaymentRedirectUrl: (payment: PaymentCreation) => string;
  refundPayment?: (input: { providerTransactionId: string; amount: number }) => Promise<void>;
};

type SafePaymentProviderDiagnostics = {
  provider: PaymentProvider;
  operation: string;
  environment?: "sandbox" | "production";
  baseUrl?: string;
  endpointHost: string;
  endpointPath: string;
  httpStatus: number | null;
  apiKeyPresent: boolean;
  apiKeyLength: number;
  apiKeyHadNamePrefix: boolean;
  apiKeyHadAnyPrefix?: boolean;
  apiKeyHadQuotes?: boolean;
  apiKeyHadWhitespace?: boolean;
  apiKeyHadNewline?: boolean;
  apiKeyLooksPlaceholder?: boolean;
  apiSecretPresent: boolean;
  apiSecretLength: number;
  apiSecretHadNamePrefix: boolean;
  apiSecretHadAnyPrefix?: boolean;
  apiSecretHadQuotes?: boolean;
  apiSecretHadWhitespace?: boolean;
  apiSecretHadNewline?: boolean;
  apiSecretLooksPlaceholder?: boolean;
  errorBody: unknown;
};

export type TpayEnvValueDiagnostics = {
  name: string;
  present: boolean;
  length: number;
  rawLength: number;
  fingerprint: string | null;
  hasWhitespaceIssue: boolean;
  hasPrefixIssue: boolean;
  hasOwnNamePrefix: boolean;
  hasAnyAssignmentPrefix: boolean;
  hasQuotes: boolean;
  hasNewline: boolean;
  looksPlaceholder: boolean;
};

export type TpayPublicConfigDiagnostics = {
  provider: "tpay";
  selectedEnvironment: "sandbox" | "production";
  selectedBaseUrl: string;
  oauthEndpoint: string;
  transactionEndpoint: string;
  usesSandboxBaseUrl: boolean;
  usesProductionBaseUrl: boolean;
  usesOriginApi: boolean;
  paymentProvider: {
    present: boolean;
    value: string | null;
    valid: boolean;
  };
  tpayEnv: {
    present: boolean;
    value: string | null;
    valid: boolean;
  };
  merchantId: TpayEnvValueDiagnostics;
  apiKey: TpayEnvValueDiagnostics;
  apiSecret: TpayEnvValueDiagnostics;
  webhookSecret: TpayEnvValueDiagnostics;
  possibleCredentialSwap: boolean;
  warnings: string[];
};

export type TpayOAuthDiagnosticResult = {
  ok: boolean;
  provider: "tpay";
  operation: "oauth_token";
  selectedVariant: string | null;
  selectedEnvironment: "sandbox" | "production";
  baseUrl: string;
  endpointHost: string;
  endpointPath: string;
  httpStatus: number | null;
  request: {
    method: "POST";
    contentType: "application/x-www-form-urlencoded";
    authMethod:
      | "client_id_client_secret_body"
      | "basic_auth_client_credentials"
      | "client_id_client_secret_body_with_grant_type"
      | "scope_variant_not_tested";
    includesGrantType: boolean;
    includesScope: boolean;
  };
  credentials: {
    apiKeyPresent: boolean;
    apiKeyLength: number;
    apiKeyHadNamePrefix: boolean;
    apiKeyHadAnyPrefix: boolean;
    apiKeyHadQuotes: boolean;
    apiKeyHadWhitespace: boolean;
    apiKeyHadNewline: boolean;
    apiKeyLooksPlaceholder: boolean;
    apiSecretPresent: boolean;
    apiSecretLength: number;
    apiSecretHadNamePrefix: boolean;
    apiSecretHadAnyPrefix: boolean;
    apiSecretHadQuotes: boolean;
    apiSecretHadWhitespace: boolean;
    apiSecretHadNewline: boolean;
    apiSecretLooksPlaceholder: boolean;
    possibleCredentialSwap: boolean;
  };
  errorCode: string | null;
  errorDescription: string | null;
  errorBody: unknown;
  hints: string[];
  variants: TpayOAuthVariantResult[];
};

export type TpayOAuthVariantResult = {
  id: "A" | "B" | "C" | "D";
  label: string;
  tested: boolean;
  ok: boolean;
  httpStatus: number | null;
  errorCode: string | null;
  errorDescription: string | null;
  errorBody: unknown;
  request: {
    method: "POST";
    contentType: "application/x-www-form-urlencoded";
    authMethod:
      | "client_id_client_secret_body"
      | "basic_auth_client_credentials"
      | "client_id_client_secret_body_with_grant_type"
      | "scope_variant_not_tested";
    includesGrantType: boolean;
    includesScope: boolean;
  };
  skippedReason: string | null;
};

class PaymentProviderRequestError extends Error {
  constructor(
    message: string,
    public readonly diagnostics: SafePaymentProviderDiagnostics,
  ) {
    super(message);
    this.name = "PaymentProviderRequestError";
  }
}

export function getSafePaymentErrorDiagnostics(error: unknown) {
  return error instanceof PaymentProviderRequestError ? error.diagnostics : null;
}

export function assertPaymentWebhookMatchesPayment(
  notification: PaymentWebhookResult,
  payment: Pick<PaymentTransaction, "amount"> & { currency: string | null },
) {
  if (notification.amount !== null && notification.amount !== payment.amount) {
    throw new Error("Payment webhook amount does not match the order.");
  }

  if (notification.currency !== payment.currency) {
    throw new Error("Payment webhook currency does not match PLN.");
  }
}

function requireEnv(names: string[], providerName: string) {
  const missing = names.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `${providerName} nie jest skonfigurowany. Brakujące zmienne: ${missing.join(", ")}.`,
    );
  }
}

function validateTpayEnvironment(baseUrl: string) {
  const missing = [
    "PAYMENT_PROVIDER",
    "TPAY_MERCHANT_ID",
    "TPAY_API_KEY",
    "TPAY_API_SECRET",
    "TPAY_ENV",
  ].filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Tpay sandbox nie jest gotowy. Uzupełnij zmienne: ${missing.join(", ")}.`,
    );
  }

  if (process.env.PAYMENT_PROVIDER?.trim().toLowerCase() !== "tpay") {
    throw new Error("Dla testu Tpay ustaw PAYMENT_PROVIDER=tpay.");
  }

  if (process.env.TPAY_ENV !== "sandbox" && process.env.TPAY_ENV !== "production") {
    throw new Error("TPAY_ENV musi mieć wartość sandbox albo production.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL musi być poprawnym publicznym URL-em sklepu.");
  }

  if (process.env.NODE_ENV === "production" && parsedUrl.hostname === "localhost") {
    throw new Error("Produkcja Tpay nie może używać localhost jako URL webhooka.");
  }
}

function hmac(secret: string, rawBody: string) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

function timingSafeEqualText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

function parseWebhookBody(rawBody: string) {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error("Nieprawidłowy payload webhooka płatności.");
  }
}

function parseFormWebhookBody(rawBody: string) {
  const params = new URLSearchParams(rawBody);
  const payload: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }

  return payload;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function looksLikePlaceholder(value: string) {
  return (
    !value ||
    /^(your|change[-_ ]?me|changeme|todo|placeholder|example|test|xxx)$/i.test(
      value,
    ) ||
    /^your[-_ ].+/i.test(value) ||
    /^your[A-Z0-9_]*$/i.test(value) ||
    /^(client[_ -]?id|api[_ -]?key|secret)[-_ ]+(here|value)$/i.test(value) ||
    /\bplaceholder\b/i.test(value)
  );
}

function normalizeSecretEnvValue(name: string) {
  const rawValue = process.env[name] ?? "";
  const trimmed = rawValue.trim();
  const prefix = `${name}=`;
  const assignmentPrefix = trimmed.match(/^([A-Z0-9_]+)=/);
  const hadNamePrefix = trimmed.startsWith(prefix);
  const withoutNamePrefix = hadNamePrefix
    ? trimmed.slice(prefix.length).trim()
    : trimmed;
  const hadQuotes =
    (withoutNamePrefix.startsWith('"') && withoutNamePrefix.endsWith('"')) ||
    (withoutNamePrefix.startsWith("'") && withoutNamePrefix.endsWith("'"));
  const withoutQuotes =
    hadQuotes
      ? withoutNamePrefix.slice(1, -1).trim()
      : withoutNamePrefix;
  const hadWhitespace = rawValue !== trimmed;
  const hadNewline = /[\r\n]/.test(rawValue);

  return {
    value: withoutQuotes,
    present: withoutQuotes.length > 0,
    length: withoutQuotes.length,
    rawLength: rawValue.length,
    hadNamePrefix,
    hadAnyPrefix: Boolean(assignmentPrefix),
    assignmentPrefixName: assignmentPrefix?.[1] ?? null,
    hadQuotes,
    hadWhitespace,
    hadNewline,
    looksPlaceholder: looksLikePlaceholder(withoutQuotes),
  };
}

function shortSha256Fingerprint(value: string) {
  return value ? `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 8)}` : null;
}

function publicEnvDiagnostics(name: string): TpayEnvValueDiagnostics {
  const normalized = normalizeSecretEnvValue(name);

  return {
    name,
    present: normalized.present,
    length: normalized.length,
    rawLength: normalized.rawLength,
    fingerprint: shortSha256Fingerprint(normalized.value),
    hasWhitespaceIssue: normalized.hadWhitespace || normalized.hadNewline,
    hasPrefixIssue: normalized.hadAnyPrefix,
    hasOwnNamePrefix: normalized.hadNamePrefix,
    hasAnyAssignmentPrefix: normalized.hadAnyPrefix,
    hasQuotes: normalized.hadQuotes,
    hasNewline: normalized.hadNewline,
    looksPlaceholder: normalized.looksPlaceholder,
  };
}

function getTpayPossibleCredentialSwap() {
  const apiKey = normalizeSecretEnvValue("TPAY_API_KEY");
  const apiSecret = normalizeSecretEnvValue("TPAY_API_SECRET");

  return apiKey.length > 48 && apiSecret.length > 0 && apiSecret.length < 24;
}

export function getTpayPublicConfigDiagnostics(): TpayPublicConfigDiagnostics {
  const selectedEnvironment = getTpayEnvironment();
  const selectedBaseUrl = getTpayApiBaseUrl(selectedEnvironment);
  const oauthEndpoint = new URL("/oauth/auth", selectedBaseUrl).toString();
  const transactionEndpoint = new URL("/transactions", selectedBaseUrl).toString();
  const paymentProvider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase() ?? "";
  const tpayEnv = process.env.TPAY_ENV?.trim().toLowerCase() ?? "";
  const warnings: string[] = [];
  const merchantId = publicEnvDiagnostics("TPAY_MERCHANT_ID");
  const apiKey = publicEnvDiagnostics("TPAY_API_KEY");
  const apiSecret = publicEnvDiagnostics("TPAY_API_SECRET");
  const webhookSecret = publicEnvDiagnostics("TPAY_WEBHOOK_SECRET");
  const usesSandboxBaseUrl =
    selectedBaseUrl === "https://openapi.sandbox.tpay.com";
  const usesProductionBaseUrl = selectedBaseUrl === "https://api.tpay.com";
  const usesOriginApi = /secure|securecard|origin/i.test(selectedBaseUrl);
  const possibleCredentialSwap = getTpayPossibleCredentialSwap();

  for (const diagnostic of [merchantId, apiKey, apiSecret, webhookSecret]) {
    if (diagnostic.hasWhitespaceIssue) {
      warnings.push(`${diagnostic.name} has leading/trailing whitespace or newline characters.`);
    }
    if (diagnostic.hasPrefixIssue) {
      warnings.push(`${diagnostic.name} appears to include an env-name prefix.`);
    }
    if (diagnostic.hasQuotes) {
      warnings.push(`${diagnostic.name} appears to include wrapping quote characters.`);
    }
    if (diagnostic.looksPlaceholder) {
      warnings.push(`${diagnostic.name} looks like a placeholder value.`);
    }
  }

  if (possibleCredentialSwap) {
    warnings.push(
      "TPAY_API_KEY shape looks unusually long compared with TPAY_API_SECRET; verify Client ID and Secret were not swapped.",
    );
  }
  if (selectedEnvironment === "sandbox" && !usesSandboxBaseUrl) {
    warnings.push("TPAY_ENV=sandbox is not selecting the sandbox Open API base URL.");
  }
  if (selectedEnvironment === "production" && process.env.VERCEL_ENV === "preview") {
    warnings.push("TPAY_ENV=production must not be used on Vercel Preview.");
  }

  return {
    provider: "tpay",
    selectedEnvironment,
    selectedBaseUrl,
    oauthEndpoint,
    transactionEndpoint,
    usesSandboxBaseUrl,
    usesProductionBaseUrl,
    usesOriginApi,
    paymentProvider: {
      present: Boolean(paymentProvider),
      value: paymentProvider || null,
      valid: paymentProvider === "tpay",
    },
    tpayEnv: {
      present: Boolean(tpayEnv),
      value: tpayEnv || null,
      valid: tpayEnv === "sandbox" || tpayEnv === "production",
    },
    merchantId,
    apiKey,
    apiSecret,
    webhookSecret,
    possibleCredentialSwap,
    warnings,
  };
}

function sanitizeTpayErrorPayload(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return "[truncated]";
  }

  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeTpayErrorPayload(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (/secret|token|authorization|password|credential|client_secret/i.test(key)) {
        sanitized[key] = "[redacted]";
      } else {
        sanitized[key] = sanitizeTpayErrorPayload(item, depth + 1);
      }
    }

    return sanitized;
  }

  return String(value);
}

function numberOrNull(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeStatus(value: unknown): PaymentWebhookResult["status"] {
  const status = text(value)?.toLowerCase();

  if (status === "paid" || status === "success" || status === "completed") {
    return "paid";
  }

  if (status === "cancelled" || status === "canceled") {
    return "cancelled";
  }

  if (status === "expired") {
    return "expired";
  }

  return "failed";
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return Buffer.from(padded, "base64");
}

function centsToTpayAmount(cents: number) {
  return Number((cents / 100).toFixed(2));
}

function decimalAmountToCents(value: unknown) {
  const numeric = numberOrNull(value);

  return numeric === null ? null : Math.round(numeric * 100);
}

function isTpayClassicNotification(payload: Record<string, unknown>) {
  return Boolean(
    text(payload.id) &&
      text(payload.tr_id) &&
      text(payload.tr_amount) &&
      text(payload.tr_status) &&
      text(payload.md5sum),
  );
}

function verifyTpayClassicMd5(payload: Record<string, unknown>) {
  const merchantId = normalizeSecretEnvValue("TPAY_MERCHANT_ID").value;
  const securityCode = normalizeSecretEnvValue("TPAY_WEBHOOK_SECRET").value;
  const notificationMerchantId = text(payload.id);
  const transactionTitle = text(payload.tr_id);
  const amount = text(payload.tr_amount);
  const crc = text(payload.tr_crc) ?? "";
  const receivedHash = text(payload.md5sum)?.toLowerCase() ?? null;

  if (!merchantId || !securityCode) {
    throw new Error("Tpay webhook security code is not configured.");
  }

  if (!notificationMerchantId || notificationMerchantId !== merchantId) {
    throw new Error("Invalid Tpay notification merchant id.");
  }

  if (!transactionTitle || !amount || !receivedHash) {
    throw new Error("Invalid Tpay classic notification payload.");
  }

  const expectedHash = createHash("md5")
    .update(`${merchantId}${transactionTitle}${amount}${crc}${securityCode}`)
    .digest("hex");

  assertWebhookVerified(
    "tpay",
    timingSafeEqualText(receivedHash, expectedHash),
  );
}

function sanitizeTpayWebhookPayload(payload: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (/md5|hash|sign|signature|secret|token|authorization|password|credential/i.test(key)) {
      sanitized[key] = "[redacted]";
    } else {
      sanitized[key] = sanitizeTpayErrorPayload(value);
    }
  }

  return sanitized;
}

function mapTpayClassicNotification(payload: Record<string, unknown>): PaymentWebhookResult {
  verifyTpayClassicMd5(payload);

  const providerPaymentId = text(payload.tr_id);
  const orderId = text(payload.tr_crc);
  const rawStatus = text(payload.tr_status)?.toUpperCase();
  const status = rawStatus === "TRUE" ? "paid" : normalizeStatus(rawStatus);
  const amount = decimalAmountToCents(payload.tr_paid) ?? decimalAmountToCents(payload.tr_amount);

  return {
    provider: "tpay",
    providerEventId:
      `tpay_classic_${providerPaymentId ?? "unknown"}_${orderId ?? "no_crc"}_${status}`,
    providerTransactionId: null,
    providerPaymentId,
    orderId,
    status,
    amount,
    currency: "PLN",
    rawProviderPayload: {
      format: "classic_form",
      verification: "md5",
      ...sanitizeTpayWebhookPayload(payload),
      md5sum: "[redacted]",
    },
  };
}

function getLocalePrefix(locale: "pl" | "en") {
  return locale === "en" ? "/en" : "";
}

function getTpayEnvironment() {
  return process.env.TPAY_ENV === "production" ? "production" : "sandbox";
}

function getTpayApiBaseUrl(environment = getTpayEnvironment()) {
  return environment === "production"
    ? "https://api.tpay.com"
    : "https://openapi.sandbox.tpay.com";
}

function getTpaySecureBaseUrl(environment = getTpayEnvironment()) {
  return environment === "production"
    ? "https://secure.tpay.com"
    : "https://secure.sandbox.tpay.com";
}

function getTpayOAuthFailureHints(errorCode: string | null) {
  if (errorCode === "invalid_client") {
    return [
      "Credentials may be from the production Tpay panel but TPAY_ENV=sandbox uses openapi.sandbox.tpay.com.",
      "Credentials may be from Origin API instead of the Open API Client ID / Secret section.",
      "Sandbox account Open API access may not be registered or activated.",
      "Client ID and Secret may have been copied incorrectly or swapped.",
      "Vercel env values may include whitespace, quotes, or a TPAY_API_KEY= / TPAY_API_SECRET= prefix.",
    ];
  }

  return [
    "Verify TPAY_ENV, TPAY_API_KEY and TPAY_API_SECRET in Vercel Preview.",
    "Verify the credentials are Open API credentials for the selected Tpay environment.",
  ];
}

function getTpayErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const direct = text(record.error) ?? text(record.code);

  if (direct) {
    return direct;
  }

  const errors = Array.isArray(record.errors) ? record.errors : [];
  const firstObject = errors.find(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );

  return firstObject ? text(firstObject.code) ?? text(firstObject.error) : null;
}

function getTpayErrorDescription(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return typeof payload === "string" ? payload : null;
  }

  const record = payload as Record<string, unknown>;
  const direct =
    text(record.error_description) ??
    text(record.description) ??
    text(record.message);

  if (direct) {
    return direct;
  }

  const errors = Array.isArray(record.errors) ? record.errors : [];
  const firstObject = errors.find(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );

  return firstObject
    ? text(firstObject.message) ?? text(firstObject.description)
    : null;
}

async function fetchTpayAccessToken(options: {
  fetchImpl?: typeof fetch;
  logFailure?: boolean;
} = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const clientId = normalizeSecretEnvValue("TPAY_API_KEY");
  const clientSecret = normalizeSecretEnvValue("TPAY_API_SECRET");

  if (
    !clientId.present ||
    !clientSecret.present ||
    clientId.looksPlaceholder ||
    clientSecret.looksPlaceholder
  ) {
    throw new Error("Tpay API credentials are missing.");
  }

  const endpoint = new URL("/oauth/auth", getTpayApiBaseUrl());
  const response = await fetchImpl(endpoint.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId.value,
      client_secret: clientSecret.value,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;
  const payloadObject =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  const accessToken = text(payloadObject.access_token);

  if (!response.ok || !accessToken) {
    const diagnostics: SafePaymentProviderDiagnostics = {
      provider: "tpay",
      operation: "oauth_token",
      environment: getTpayEnvironment(),
      baseUrl: getTpayApiBaseUrl(),
      endpointHost: endpoint.host,
      endpointPath: endpoint.pathname,
      httpStatus: response.status,
      apiKeyPresent: clientId.present,
      apiKeyLength: clientId.length,
      apiKeyHadNamePrefix: clientId.hadNamePrefix,
      apiKeyHadAnyPrefix: clientId.hadAnyPrefix,
      apiKeyHadQuotes: clientId.hadQuotes,
      apiKeyHadWhitespace: clientId.hadWhitespace,
      apiKeyHadNewline: clientId.hadNewline,
      apiKeyLooksPlaceholder: clientId.looksPlaceholder,
      apiSecretPresent: clientSecret.present,
      apiSecretLength: clientSecret.length,
      apiSecretHadNamePrefix: clientSecret.hadNamePrefix,
      apiSecretHadAnyPrefix: clientSecret.hadAnyPrefix,
      apiSecretHadQuotes: clientSecret.hadQuotes,
      apiSecretHadWhitespace: clientSecret.hadWhitespace,
      apiSecretHadNewline: clientSecret.hadNewline,
      apiSecretLooksPlaceholder: clientSecret.looksPlaceholder,
      errorBody: sanitizeTpayErrorPayload(payload),
    };

    if (options.logFailure !== false) {
      console.error("[payments:tpay] OAuth token request failed", diagnostics);
    }
    throw new PaymentProviderRequestError(
      "Nie udało się pobrać tokenu OAuth Tpay.",
      diagnostics,
    );
  }

  return accessToken;
}

function getTpayOAuthVariantDefinitions(
  clientId: ReturnType<typeof normalizeSecretEnvValue>,
  clientSecret: ReturnType<typeof normalizeSecretEnvValue>,
) {
  return [
    {
      id: "A" as const,
      label: "Form body client_id + client_secret",
      tested: true,
      request: {
        method: "POST" as const,
        contentType: "application/x-www-form-urlencoded" as const,
        authMethod: "client_id_client_secret_body" as const,
        includesGrantType: false,
        includesScope: false,
      },
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: clientId.value,
          client_secret: clientSecret.value,
        }),
      } satisfies RequestInit,
    },
    {
      id: "B" as const,
      label: "HTTP Basic Auth + client_credentials grant",
      tested: true,
      request: {
        method: "POST" as const,
        contentType: "application/x-www-form-urlencoded" as const,
        authMethod: "basic_auth_client_credentials" as const,
        includesGrantType: true,
        includesScope: false,
      },
      init: {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId.value}:${clientSecret.value}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
        }),
      } satisfies RequestInit,
    },
    {
      id: "C" as const,
      label: "Form body client_id + client_secret + client_credentials grant",
      tested: true,
      request: {
        method: "POST" as const,
        contentType: "application/x-www-form-urlencoded" as const,
        authMethod: "client_id_client_secret_body_with_grant_type" as const,
        includesGrantType: true,
        includesScope: false,
      },
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: clientId.value,
          client_secret: clientSecret.value,
          grant_type: "client_credentials",
        }),
      } satisfies RequestInit,
    },
  ];
}

function skippedScopeVariant(): TpayOAuthVariantResult {
  return {
    id: "D",
    label: "Scope parameter variant",
    tested: false,
    ok: false,
    httpStatus: null,
    errorCode: null,
    errorDescription: null,
    errorBody: null,
    request: {
      method: "POST",
      contentType: "application/x-www-form-urlencoded",
      authMethod: "scope_variant_not_tested",
      includesGrantType: false,
      includesScope: false,
    },
    skippedReason:
      "Not tested because the rendered Tpay Open API sandbox documentation does not specify a required OAuth scope.",
  };
}

function resultFromOAuthPayload(input: {
  id: TpayOAuthVariantResult["id"];
  label: string;
  request: TpayOAuthVariantResult["request"];
  response: Response;
  payload: unknown;
}): TpayOAuthVariantResult {
  const payloadObject =
    typeof input.payload === "object" && input.payload !== null
      ? (input.payload as Record<string, unknown>)
      : {};
  const accessToken = text(payloadObject.access_token);
  const ok = input.response.ok && Boolean(accessToken);

  return {
    id: input.id,
    label: input.label,
    tested: true,
    ok,
    httpStatus: input.response.status,
    errorCode: ok ? null : getTpayErrorCode(input.payload),
    errorDescription: ok ? null : getTpayErrorDescription(input.payload),
    errorBody: ok ? null : sanitizeTpayErrorPayload(input.payload),
    request: input.request,
    skippedReason: null,
  };
}

export async function diagnoseTpayOAuthConfig(options: {
  fetchImpl?: typeof fetch;
} = {}): Promise<TpayOAuthDiagnosticResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const config = getTpayPublicConfigDiagnostics();
  const endpoint = new URL("/oauth/auth", config.selectedBaseUrl);
  const clientId = normalizeSecretEnvValue("TPAY_API_KEY");
  const clientSecret = normalizeSecretEnvValue("TPAY_API_SECRET");
  const baseResult = {
    provider: "tpay" as const,
    operation: "oauth_token" as const,
    selectedVariant: null as string | null,
    selectedEnvironment: config.selectedEnvironment,
    baseUrl: config.selectedBaseUrl,
    endpointHost: endpoint.host,
    endpointPath: endpoint.pathname,
    request: {
      method: "POST" as const,
      contentType: "application/x-www-form-urlencoded" as const,
      authMethod: "client_id_client_secret_body" as const,
      includesGrantType: false,
      includesScope: false,
    },
    credentials: {
      apiKeyPresent: clientId.present,
      apiKeyLength: clientId.length,
      apiKeyHadNamePrefix: clientId.hadNamePrefix,
      apiKeyHadAnyPrefix: clientId.hadAnyPrefix,
      apiKeyHadQuotes: clientId.hadQuotes,
      apiKeyHadWhitespace: clientId.hadWhitespace,
      apiKeyHadNewline: clientId.hadNewline,
      apiKeyLooksPlaceholder: clientId.looksPlaceholder,
      apiSecretPresent: clientSecret.present,
      apiSecretLength: clientSecret.length,
      apiSecretHadNamePrefix: clientSecret.hadNamePrefix,
      apiSecretHadAnyPrefix: clientSecret.hadAnyPrefix,
      apiSecretHadQuotes: clientSecret.hadQuotes,
      apiSecretHadWhitespace: clientSecret.hadWhitespace,
      apiSecretHadNewline: clientSecret.hadNewline,
      apiSecretLooksPlaceholder: clientSecret.looksPlaceholder,
      possibleCredentialSwap: config.possibleCredentialSwap,
    },
  };

  if (
    !clientId.present ||
    !clientSecret.present ||
    clientId.looksPlaceholder ||
    clientSecret.looksPlaceholder
  ) {
    const errorCode = !clientId.present || !clientSecret.present
      ? "missing_credentials"
      : "placeholder_credentials";

    return {
      ...baseResult,
      ok: false,
      httpStatus: null,
      errorCode,
      errorDescription:
        errorCode === "missing_credentials"
          ? "TPAY_API_KEY or TPAY_API_SECRET is missing."
          : "TPAY_API_KEY or TPAY_API_SECRET looks like a placeholder.",
      errorBody: null,
      hints: getTpayOAuthFailureHints(errorCode),
      variants: [skippedScopeVariant()],
    };
  }

  const variants: TpayOAuthVariantResult[] = [];

  for (const variant of getTpayOAuthVariantDefinitions(clientId, clientSecret)) {
    const response = await fetchImpl(endpoint.toString(), variant.init as RequestInit);
    const payload = (await response.json().catch(() => ({}))) as unknown;
    const result = resultFromOAuthPayload({
      id: variant.id,
      label: variant.label,
      request: variant.request,
      response,
      payload,
    });

    variants.push(result);

    if (result.ok) {
      break;
    }
  }

  variants.push(skippedScopeVariant());

  const selected = variants.find((variant) => variant.ok) ?? variants[0];
  const errorCode = selected?.errorCode ?? null;
  const errorDescription = selected?.errorDescription ?? null;

  return {
    ...baseResult,
    selectedVariant: selected?.ok ? selected.id : null,
    ok: Boolean(selected?.ok),
    httpStatus: selected?.httpStatus ?? null,
    request: selected?.request ?? baseResult.request,
    errorCode: selected?.ok ? null : errorCode,
    errorDescription: selected?.ok ? null : errorDescription,
    errorBody: selected?.ok ? null : (selected?.errorBody ?? null),
    hints: selected?.ok ? [] : getTpayOAuthFailureHints(errorCode),
    variants,
  };
}

async function createTpayTransaction(input: {
  order: Order;
  baseUrl: string;
  locale: "pl" | "en";
}) {
  const accessToken = await fetchTpayAccessToken();
  const localePrefix = getLocalePrefix(input.locale);
  const body = {
    amount: centsToTpayAmount(input.order.total),
    description: `Garconmaires ${input.order.orderNumber}`,
    hiddenDescription: input.order.id,
    payer: {
      email: input.order.customer.email,
      name: `${input.order.customer.firstName} ${input.order.customer.lastName}`.trim(),
      phone: input.order.customer.phone,
      address: input.order.shippingAddress.addressLine1,
      city: input.order.shippingAddress.city,
      country: "PL",
      postalCode: input.order.shippingAddress.postalCode,
    },
    callbacks: {
      notification: {
        url: `${input.baseUrl}/api/payments/webhook/tpay`,
      },
      payerUrls: {
        success: `${input.baseUrl}${localePrefix}/checkout/success?order_id=${encodeURIComponent(input.order.id)}`,
        error: `${input.baseUrl}${localePrefix}/cart?checkout=failed`,
      },
    },
  };

  const response = await fetch(`${getTpayApiBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const transactionId = text(payload.transactionId);
  const title = text(payload.title);
  const paymentUrl = text(payload.transactionPaymentUrl);

  if (!response.ok || !transactionId || !paymentUrl) {
    throw new Error("Nie udało się utworzyć transakcji Tpay.");
  }

  return {
    transactionId,
    title,
    paymentUrl,
    payload,
  };
}

async function fetchText(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to fetch Tpay certificate from ${url}.`);
  }

  return response.text();
}

export async function verifyTpayJwsSignature(
  rawBody: string,
  jws: string | null,
  options: {
    environment?: "sandbox" | "production";
    fetchCertificate?: (url: string) => Promise<string>;
  } = {},
) {
  if (!jws) {
    throw new Error("Missing Tpay X-JWS-Signature header.");
  }

  const [encodedHeader, , encodedSignature] = jws.split(".");

  if (!encodedHeader || !encodedSignature) {
    throw new Error("Invalid Tpay JWS signature format.");
  }

  const header = JSON.parse(decodeBase64Url(encodedHeader).toString("utf8")) as {
    x5u?: string;
    alg?: string;
  };
  const environment = options.environment ?? getTpayEnvironment();
  const secureBaseUrl = getTpaySecureBaseUrl(environment);
  const secureOrigin = new URL(secureBaseUrl).origin;
  let certificateUrl: URL | null = null;

  try {
    certificateUrl = header.x5u ? new URL(header.x5u) : null;
  } catch {
    certificateUrl = null;
  }

  if (!certificateUrl || certificateUrl.origin !== secureOrigin) {
    throw new Error("Invalid Tpay JWS certificate URL.");
  }

  if (header.alg && header.alg !== "RS256") {
    throw new Error("Unsupported Tpay JWS algorithm.");
  }

  const certificateFetcher = options.fetchCertificate ?? fetchText;
  const [certificatePem, rootPem] = await Promise.all([
    certificateFetcher(certificateUrl.toString()),
    certificateFetcher(`${secureBaseUrl}/x509/tpay-jws-root.pem`),
  ]);
  const certificate = new X509Certificate(certificatePem);
  const rootCertificate = new X509Certificate(rootPem);

  if (!certificate.verify(rootCertificate.publicKey)) {
    throw new Error("Tpay JWS certificate is not signed by the trusted root.");
  }

  const signingPayload = `${encodedHeader}.${base64Url(rawBody)}`;
  const verifier = createVerify("RSA-SHA256");

  verifier.update(signingPayload);
  verifier.end();

  if (!verifier.verify(certificate.publicKey, decodeBase64Url(encodedSignature))) {
    throw new Error("Invalid Tpay JWS signature.");
  }

  return true;
}

function createPlaceholderPayment(input: {
  provider: PaymentProvider;
  order: Order;
  baseUrl: string;
}) {
  const providerTransactionId = `${input.provider}_${input.order.id}`;
  const paymentUrl = `${input.baseUrl}/api/payments/placeholder/${input.provider}?orderId=${encodeURIComponent(input.order.id)}`;

  return {
    provider: input.provider,
    providerTransactionId,
    providerPaymentId: null,
    paymentUrl,
    rawProviderPayload: {
      mode: "placeholder",
      provider: input.provider,
      amount: input.order.total,
      currency: input.order.currency,
    },
  } satisfies PaymentCreation;
}

function createWebhookVerifier(input: {
  provider: PaymentProvider;
  secretEnv: string;
  signatureHeaders: string[];
}) {
  return async (request: NextRequest, rawBody: string): Promise<PaymentWebhookResult> => {
    const secret = process.env[input.secretEnv];

    if (!secret) {
      throw new Error(`${input.provider} webhook secret is not configured.`);
    }

    const receivedSignature = input.signatureHeaders
      .map((header) => request.headers.get(header))
      .find(Boolean);

    if (!receivedSignature) {
      throw new Error(`Missing ${input.provider} payment webhook signature.`);
    }

    const expectedSignature = hmac(secret, rawBody);

    assertWebhookVerified(
      input.provider,
      timingSafeEqualText(receivedSignature, expectedSignature),
    );

    const payload = parseWebhookBody(rawBody);
    const providerEventId =
      text(payload.providerEventId) ??
      text(payload.eventId) ??
      text(payload.notificationId) ??
      `${input.provider}_${text(payload.providerTransactionId) ?? text(payload.orderId) ?? Date.now()}`;

    return {
      provider: input.provider,
      providerEventId,
      providerTransactionId:
        text(payload.providerTransactionId) ?? text(payload.transactionId),
      providerPaymentId: text(payload.providerPaymentId) ?? text(payload.paymentId),
      orderId: text(payload.orderId) ?? text(payload.storeOrderId),
      status: normalizeStatus(payload.status),
      amount: numberOrNull(payload.amount),
      currency: text(payload.currency) === "PLN" ? "PLN" : null,
      rawProviderPayload: payload,
    };
  };
}

function tpayAdapter(): PaymentProviderAdapter {
  const requiredEnv = [
    "TPAY_MERCHANT_ID",
    "TPAY_API_KEY",
    "TPAY_API_SECRET",
    "TPAY_WEBHOOK_SECRET",
    "TPAY_ENV",
  ];

  return {
    provider: "tpay",
    displayName: "Tpay",
    requiredEnv,
    async createPayment({ order, baseUrl, locale }) {
      requireEnv(requiredEnv, "Tpay");
      validateTpayEnvironment(baseUrl);
      const transaction = await createTpayTransaction({ order, baseUrl, locale });

      return {
        provider: "tpay",
        providerTransactionId: transaction.transactionId,
        providerPaymentId: transaction.title,
        paymentUrl: transaction.paymentUrl,
        rawProviderPayload: transaction.payload,
      };
    },
    async verifyWebhook(request, rawBody) {
      const contentType = request.headers.get("content-type") ?? "";

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formPayload = parseFormWebhookBody(rawBody);

        if (isTpayClassicNotification(formPayload)) {
          return mapTpayClassicNotification(formPayload);
        }
      }

      await verifyTpayJwsSignature(
        rawBody,
        request.headers.get("x-jws-signature"),
      );
      const payload = parseWebhookBody(rawBody);
      const data =
        typeof payload.data === "object" && payload.data !== null
          ? (payload.data as Record<string, unknown>)
          : payload;
      const providerTransactionId =
        text(data.transactionId) ?? text(payload.transactionId);
      const providerPaymentId =
        text(data.transactionTitle) ?? text(payload.tr_id) ?? text(payload.transactionTitle);
      const orderId =
        text(data.transactionHiddenDescription) ??
        text(payload.tr_crc) ??
        text(payload.orderId);
      const rawStatus =
        text(data.transactionStatus) ??
        text(payload.tr_status) ??
        text(payload.status);
      const status =
        rawStatus === "correct" || rawStatus === "true"
          ? "paid"
          : normalizeStatus(rawStatus);
      const amount =
        decimalAmountToCents(data.transactionAmount) ??
        decimalAmountToCents(payload.tr_amount) ??
        decimalAmountToCents(payload.amount);

      return {
        provider: "tpay",
        providerEventId:
          providerTransactionId ??
          providerPaymentId ??
          `tpay_${orderId ?? Date.now()}`,
        providerTransactionId,
        providerPaymentId,
        orderId,
        status,
        amount,
        currency: "PLN",
        rawProviderPayload: payload,
      };
    },
    getPaymentRedirectUrl(payment) {
      return payment.paymentUrl;
    },
  };
}

function przelewy24Adapter(): PaymentProviderAdapter {
  const requiredEnv = [
    "P24_MERCHANT_ID",
    "P24_POS_ID",
    "P24_CRC",
    "P24_API_KEY",
    "P24_ENV",
  ];

  return {
    provider: "przelewy24",
    displayName: "Przelewy24",
    requiredEnv,
    async createPayment({ order, baseUrl }) {
      requireEnv(requiredEnv, "Przelewy24");
      return createPlaceholderPayment({ provider: "przelewy24", order, baseUrl });
    },
    verifyWebhook: createWebhookVerifier({
      provider: "przelewy24",
      secretEnv: "P24_CRC",
      signatureHeaders: ["x-p24-signature", "x-p24-checksum", "x-provider-signature"],
    }),
    getPaymentRedirectUrl(payment) {
      return payment.paymentUrl;
    },
  };
}

function payuAdapter(): PaymentProviderAdapter {
  const requiredEnv = [
    "PAYU_CLIENT_ID",
    "PAYU_CLIENT_SECRET",
    "PAYU_POS_ID",
    "PAYU_SECOND_KEY",
    "PAYU_ENV",
  ];

  return {
    provider: "payu",
    displayName: "PayU",
    requiredEnv,
    async createPayment({ order, baseUrl }) {
      requireEnv(requiredEnv, "PayU");
      return createPlaceholderPayment({ provider: "payu", order, baseUrl });
    },
    verifyWebhook: createWebhookVerifier({
      provider: "payu",
      secretEnv: "PAYU_SECOND_KEY",
      signatureHeaders: ["x-openpayu-signature", "x-payu-signature", "x-provider-signature"],
    }),
    getPaymentRedirectUrl(payment) {
      return payment.paymentUrl;
    },
  };
}

export function getPaymentProviderAdapter(provider = getDefaultPaymentProvider()) {
  if (provider === "tpay") {
    return tpayAdapter();
  }

  if (provider === "przelewy24") {
    return przelewy24Adapter();
  }

  if (provider === "payu") {
    return payuAdapter();
  }

  throw new Error("Nieznany operator płatności.");
}

export function getPaymentProviderDisplayName(provider: PaymentProvider) {
  return getPaymentProviderAdapter(provider).displayName;
}
