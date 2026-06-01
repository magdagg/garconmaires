import {
  X509Certificate,
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

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

function getLocalePrefix(locale: "pl" | "en") {
  return locale === "en" ? "/en" : "";
}

function getTpayEnvironment() {
  return process.env.TPAY_ENV === "production" ? "production" : "sandbox";
}

function getTpayApiBaseUrl() {
  return getTpayEnvironment() === "production"
    ? "https://api.tpay.com"
    : "https://openapi.sandbox.tpay.com";
}

function getTpaySecureBaseUrl(environment = getTpayEnvironment()) {
  return environment === "production"
    ? "https://secure.tpay.com"
    : "https://secure.sandbox.tpay.com";
}

async function fetchTpayAccessToken() {
  const clientId = process.env.TPAY_API_KEY;
  const clientSecret = process.env.TPAY_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Tpay API credentials are missing.");
  }

  const response = await fetch(`${getTpayApiBaseUrl()}/oauth/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const accessToken = text(payload.access_token);

  if (!response.ok || !accessToken) {
    throw new Error("Nie udało się pobrać tokenu OAuth Tpay.");
  }

  return accessToken;
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
