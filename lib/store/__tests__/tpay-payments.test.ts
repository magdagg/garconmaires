import { createHash, createSign } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPaymentWebhookMatchesPayment,
  diagnoseTpayOAuthConfig,
  getPaymentProviderAdapter,
  getSafePaymentErrorDiagnostics,
  getTpayPublicConfigDiagnostics,
  verifyTpayJwsSignature,
} from "../payments";
import type { Order, PaymentTransaction } from "../types";

const testPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCZx2xAH7IGPb1T
jKp5MXvckDnmmU9DOsX7WruQK3al1ljN/sKwunDgmcqquoM2C+k8tL8a5+AKZE/E
DcuXM1omn89NuajMTeL52wpFOWvKqcA6hlLw4bZajuwe9hpXHNhhm45yhTuHyagN
Kl07Wpq6waS8xG4TctdXBVKAox3U2D9F87qLT3l7F66lEfkdIttgqoOysZv51NxA
3Am1g7D63WtqotW/x9uwbmqbSG4h2/QMuVrkzqbbYnu7zA7SnJpNrqnLWg8uE5+m
FJa5L9SzEegEOXrlJYEmUsfvSnfBBpMiqOLC8aPwH4OKBieHP1iinSMaxAidpahI
j9k19l4JAgMBAAECggEATB171L97eABeMjkZdhRKqREQP7YZl/7C2Rd/aCxDNXGD
ki6rwhr+XQVyXZAk+v7pSr1yLAiiibI+Ex367BOkZyLJ0sB3LuzMUHydOEdkNbNQ
7QbojcdC4c8FS4vn3L9v0NxUpRWSMjNbxWx3KjY+CPtpJXAaxfCdarq9K+PRE7TS
rnvK2x90A5n55Pq1epc+tajnCg8Pn121ltJpmOhOz/9Z81ClMCpOToO425bcdYck
qAqPs70EOJh/XWM1KiOQ2lXegyACVlA4kD53x19jrsl8KeWP97QLly+6nYc/m0+W
6LSHDz2Yj+AkrVqNPXSTIHB0l5cVVZ0B7jdgNNTu2wKBgQDVDQV5cppb39Q4tdAO
AumwA/hE53PO6y2V+uPYPB7+Qfy4UK4zmKq8J94Ct+uGQVIeN6ZvSf+8oUidgVW/
v+0LbSNV9U6F1dVk4dcuGFwtvfd8Trlo74+dmBh1vbKfdqf8PKU8+1MBwy/+WiQV
B6nTuO12FavGZKCJyjsQ8IBCowKBgQC4x4pqaTrHaUTIWH2a1P2AKS1mbFVJJj1T
oUpE6s3U60wp10jQ2bPcn67ciwkYB7d7+WP4wxQkg+x3bxOa4iUklR22+UIj+6vQ
Gr0DD7Cz4QNed6Zm57ktz+rH1eodzjKNGC/uPp+qObcBmikyZrHRmQ/31ZegPqj0
JuMRtBOTYwKBgGFJw/E0kyZXLMsEw1BSpjH5bhrQ8oJPxI5Tdk4dDi4fJe9o8FOh
aH3pWqk1IXk6ROyFjxwM15pksAs0r1qTowRvvw4WqdfV0M9zjdZ/y0AcGnKKZIJ1
ushFVw4VJQdKoOU/MFmLjtkkL7tfoFB2ImgLb2xX8wvykZi6X4SZvogvAoGAPN3e
BndrWUyfz672kQ4gAxuNTPPalCH4iZfTsyf1bXGkwROddM6BpOck3pkeAcBo/HmG
KOd5tx2Nwznfp2FfAtHr2933n4rDaeWk5WFBv78bMP8Q3UzvftvCZtlcKT1HAZs6
DqyqQ5SHaAu0DlotsPFOhUDilXKOjP5SRf6fhCkCgYEA0OgPOej9OZXn4gX8dBDq
/pBmwxjcOdvN5hnZT+bmZenJnoWssjRLDCXg6cU+Nibz9pVBH26JTn6vya7rjV/Q
MOWcRn77dohJHl66fx3w9+5Ez5tV6aYstnev6kFagypVkYg0ALZiHHrfWBFQQMQc
ehbn5xXKq3swxxb4gDm9ygc=
-----END PRIVATE KEY-----`;

const testCertificate = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIUQGNprYbWRZFcgFssRb31biBoSOcwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJdHBheS10ZXN0MB4XDTI2MDUzMTIxMDEwMFoXDTM2MDUy
ODIxMDEwMFowFDESMBAGA1UEAwwJdHBheS10ZXN0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAmcdsQB+yBj29U4yqeTF73JA55plPQzrF+1q7kCt2pdZY
zf7CsLpw4JnKqrqDNgvpPLS/GufgCmRPxA3LlzNaJp/PTbmozE3i+dsKRTlryqnA
OoZS8OG2Wo7sHvYaVxzYYZuOcoU7h8moDSpdO1qausGkvMRuE3LXVwVSgKMd1Ng/
RfO6i095exeupRH5HSLbYKqDsrGb+dTcQNwJtYOw+t1raqLVv8fbsG5qm0huIdv0
DLla5M6m22J7u8wO0pyaTa6py1oPLhOfphSWuS/UsxHoBDl65SWBJlLH70p3wQaT
IqjiwvGj8B+DigYnhz9Yop0jGsQInaWoSI/ZNfZeCQIDAQABo1MwUTAdBgNVHQ4E
FgQUQc3dRIEdoB4+ZoBlUeEtsfW4VLcwHwYDVR0jBBgwFoAUQc3dRIEdoB4+ZoBl
UeEtsfW4VLcwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAkrTE
dddHuTj42WV1kgWNVP8y4XRFKtRTCPe69WmwxKJwxLxslkhpznNQUZS27cP7Qm7P
uuiTZOkHKhSbo6d6L+k9PWQW63fBv2uabg0rNgP1V+hv6PsDiKVvKL0QfRg57Uov
s0Qctv+6yU27hGwQufc/QoOmh5Vyk/ByWMCFshiEVLgudevuIQt+dW3maYF9zEtx
RZtRRFmiqAhVPIoaARkVALdZQMqaivd1OSGTpRwemJ/bfisvhHb2++s54IxgiVl9
Q4CJC+mBeFNhGFT/4AphDyYSIe0aCxH0AFka0p/HtqPS1o9LhVrRRB6sgwPJDTnJ
E9rQa9uvc9D7EaWZfw==
-----END CERTIFICATE-----`;

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signTpayBody(rawBody: string) {
  const header = base64Url(
    JSON.stringify({
      alg: "RS256",
      x5u: "https://secure.sandbox.tpay.com/x509/notifications-jws.pem",
    }),
  );
  const payload = base64Url(rawBody);
  const signer = createSign("RSA-SHA256");

  signer.update(`${header}.${payload}`);
  signer.end();

  return `${header}.${payload}.${base64Url(signer.sign(testPrivateKey))}`;
}

function signTpayClassicNotification(input: {
  merchantId: string;
  transactionTitle: string;
  amount: string;
  crc?: string;
  securityCode: string;
}) {
  return createHash("md5")
    .update(
      `${input.merchantId}${input.transactionTitle}${input.amount}${input.crc ?? ""}${input.securityCode}`,
    )
    .digest("hex");
}

function makeOrder(): Order {
  return {
    id: "ord_tpay_test",
    orderNumber: "GM-2026-0001",
    customer: {
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna@example.com",
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
      deliveryMethod: "inpost_courier",
      shipmentProvider: "inpost",
      parcelLockerId: null,
      parcelLockerName: null,
      parcelLockerAddress: null,
      deliveryPrice: 1900,
      trackingNumber: null,
      trackingUrl: null,
      labelUrl: null,
      shippedAt: null,
      adminNote: null,
      deliveryStatus: "pending",
    },
    items: [],
    subtotal: 10000,
    deliveryCost: 1900,
    discount: 0,
    total: 11900,
    currency: "PLN",
    provider: "tpay",
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    orderStatus: "new",
    trackingNumber: null,
    consentLog: {
      termsAcceptedAt: "2026-05-31T00:00:00.000Z",
      privacyAcceptedAt: "2026-05-31T00:00:00.000Z",
      newsletterConsentAt: null,
      marketingConsentAt: null,
      legalDocumentVersion: "2026-05-31",
    },
    reservationIds: [],
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Tpay adapter", () => {
  it("returns a clear setup error when PAYMENT_PROVIDER is not tpay", async () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "payu");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "client");
    vi.stubEnv("TPAY_API_SECRET", "secret");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");

    await expect(
      getPaymentProviderAdapter("tpay").createPayment({
        order: makeOrder(),
        baseUrl: "https://garconmaires.test",
        locale: "pl",
      }),
    ).rejects.toThrow("PAYMENT_PROVIDER=tpay");
  });

  it("creates a sandbox transaction and returns a payment URL", async () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "client");
    vi.stubEnv("TPAY_API_SECRET", "secret");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "oauth-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: "success",
          transactionId: "01TPAYTRANSACTION",
          title: "TR-GM-TEST",
          status: "pending",
          transactionPaymentUrl: "https://secure.sandbox.tpay.com/panel",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const payment = await getPaymentProviderAdapter("tpay").createPayment({
      order: makeOrder(),
      baseUrl: "https://garconmaires.test",
      locale: "pl",
    });

    expect(payment).toMatchObject({
      provider: "tpay",
      providerTransactionId: "01TPAYTRANSACTION",
      providerPaymentId: "TR-GM-TEST",
      paymentUrl: "https://secure.sandbox.tpay.com/panel",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://openapi.sandbox.tpay.com/oauth/auth",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://openapi.sandbox.tpay.com/transactions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("normalizes pasted Tpay env assignment values before OAuth", async () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "TPAY_API_KEY=client");
    vi.stubEnv("TPAY_API_SECRET", 'TPAY_API_SECRET="secret"');
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "oauth-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: "success",
          transactionId: "01TPAYTRANSACTION",
          title: "TR-GM-TEST",
          status: "pending",
          transactionPaymentUrl: "https://secure.sandbox.tpay.com/panel",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await getPaymentProviderAdapter("tpay").createPayment({
      order: makeOrder(),
      baseUrl: "https://garconmaires.test",
      locale: "pl",
    });

    const oauthRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const oauthBody = oauthRequest.body as URLSearchParams;

    expect(oauthBody.get("client_id")).toBe("client");
    expect(oauthBody.get("client_secret")).toBe("secret");
  });

  it("exposes safe diagnostics for Tpay OAuth failures", async () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "TPAY_API_KEY=client");
    vi.stubEnv("TPAY_API_SECRET", "secret");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          result: "failed",
          errors: [{ code: "invalid_client", message: "Invalid credentials" }],
          access_token: "must-not-leak",
          client_secret: "must-not-leak",
        }),
      }),
    );

    let caught: unknown;

    try {
      await getPaymentProviderAdapter("tpay").createPayment({
        order: makeOrder(),
        baseUrl: "https://garconmaires.test",
        locale: "pl",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Error);
    expect(caught).toMatchObject({
      message: "Nie udało się pobrać tokenu OAuth Tpay.",
    });
    expect(getSafePaymentErrorDiagnostics(caught)).toMatchObject({
      provider: "tpay",
      operation: "oauth_token",
      environment: "sandbox",
      baseUrl: "https://openapi.sandbox.tpay.com",
      endpointHost: "openapi.sandbox.tpay.com",
      endpointPath: "/oauth/auth",
      httpStatus: 401,
      apiKeyPresent: true,
      apiKeyLength: 6,
      apiKeyHadNamePrefix: true,
      apiKeyHadAnyPrefix: true,
      apiSecretPresent: true,
      apiSecretLength: 6,
      apiSecretHadNamePrefix: false,
      errorBody: {
        result: "failed",
        errors: [{ code: "invalid_client", message: "Invalid credentials" }],
        access_token: "[redacted]",
        client_secret: "[redacted]",
      },
    });
  });

  it("reports sandbox Open API endpoint selection in public diagnostics", () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "client");
    vi.stubEnv("TPAY_API_SECRET", "secret");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");

    const diagnostics = getTpayPublicConfigDiagnostics();

    expect(diagnostics.selectedEnvironment).toBe("sandbox");
    expect(diagnostics.selectedBaseUrl).toBe("https://openapi.sandbox.tpay.com");
    expect(diagnostics.oauthEndpoint).toBe(
      "https://openapi.sandbox.tpay.com/oauth/auth",
    );
    expect(diagnostics.transactionEndpoint).toBe(
      "https://openapi.sandbox.tpay.com/transactions",
    );
    expect(diagnostics.usesSandboxBaseUrl).toBe(true);
    expect(diagnostics.usesProductionBaseUrl).toBe(false);
    expect(diagnostics.usesOriginApi).toBe(false);
  });

  it("reports production Open API selection and warns when used on Preview", () => {
    vi.stubEnv("TPAY_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "client");
    vi.stubEnv("TPAY_API_SECRET", "secret");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");

    const diagnostics = getTpayPublicConfigDiagnostics();

    expect(diagnostics.selectedEnvironment).toBe("production");
    expect(diagnostics.selectedBaseUrl).toBe("https://api.tpay.com");
    expect(diagnostics.usesProductionBaseUrl).toBe(true);
    expect(diagnostics.warnings).toContain(
      "TPAY_ENV=production must not be used on Vercel Preview.",
    );
  });

  it("detects whitespace, quotes, prefixes, placeholders and possible swaps without leaking values", () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", " TPAY_API_KEY=abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz ");
    vi.stubEnv("TPAY_API_SECRET", '"secret"');
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "placeholder");

    const diagnostics = getTpayPublicConfigDiagnostics();
    const serialized = JSON.stringify(diagnostics);

    expect(diagnostics.apiKey).toMatchObject({
      present: true,
      length: 52,
      fingerprint: expect.stringMatching(/^sha256:[a-f0-9]{8}$/),
      hasWhitespaceIssue: true,
      hasPrefixIssue: true,
      hasOwnNamePrefix: true,
    });
    expect(diagnostics.apiSecret).toMatchObject({
      present: true,
      length: 6,
      hasQuotes: true,
    });
    expect(diagnostics.webhookSecret.looksPlaceholder).toBe(true);
    expect(diagnostics.possibleCredentialSwap).toBe(true);
    expect(serialized).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(serialized).not.toContain('"secret"');
  });

  it("changes safe fingerprints when Tpay env values change", () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "client-one");
    vi.stubEnv("TPAY_API_SECRET", "secret-one");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");

    const first = getTpayPublicConfigDiagnostics();

    vi.stubEnv("TPAY_API_KEY", "client-two");
    vi.stubEnv("TPAY_API_SECRET", "secret-two");

    const second = getTpayPublicConfigDiagnostics();

    expect(first.apiKey.fingerprint).toMatch(/^sha256:[a-f0-9]{8}$/);
    expect(first.apiSecret.fingerprint).toMatch(/^sha256:[a-f0-9]{8}$/);
    expect(first.apiKey.fingerprint).not.toBe(second.apiKey.fingerprint);
    expect(first.apiSecret.fingerprint).not.toBe(second.apiSecret.fingerprint);
    expect(JSON.stringify(first)).not.toContain("client-one");
    expect(JSON.stringify(first)).not.toContain("secret-one");
  });

  it("returns sanitized OAuth diagnostics and invalid_client hints", async () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "client");
    vi.stubEnv("TPAY_API_SECRET", "secret");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: "invalid_client",
          error_description: "The client credentials are invalid",
          access_token: "must-not-leak",
          client_secret: "must-not-leak",
        }),
      });

    const result = await diagnoseTpayOAuthConfig({
      fetchImpl: fetchMock as never,
    });
    const serialized = JSON.stringify(result);

    expect(result).toMatchObject({
      ok: false,
      selectedEnvironment: "sandbox",
      baseUrl: "https://openapi.sandbox.tpay.com",
      endpointHost: "openapi.sandbox.tpay.com",
      endpointPath: "/oauth/auth",
      httpStatus: 401,
      errorCode: "invalid_client",
      errorDescription: "The client credentials are invalid",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.variants.map((variant) => variant.id)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(result.variants.slice(0, 3).every((variant) => variant.tested)).toBe(true);
    expect(result.variants[3]).toMatchObject({
      id: "D",
      tested: false,
      request: { authMethod: "scope_variant_not_tested" },
    });
    expect(result.hints.join(" ")).toContain("production Tpay panel");
    expect(serialized).not.toContain("must-not-leak");
    expect(serialized).not.toContain('"client_secret":"must-not-leak"');
    expect(serialized).not.toContain("Y2xpZW50OnNlY3JldA");
  });

  it("selects the successful OAuth variant without exposing access tokens", async () => {
    vi.stubEnv("TPAY_ENV", "sandbox");
    vi.stubEnv("PAYMENT_PROVIDER", "tpay");
    vi.stubEnv("TPAY_MERCHANT_ID", "merchant");
    vi.stubEnv("TPAY_API_KEY", "client");
    vi.stubEnv("TPAY_API_SECRET", "secret");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "invalid_client",
          access_token: "must-not-leak-a",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "must-not-leak-b",
          token_type: "Bearer",
        }),
      });

    const result = await diagnoseTpayOAuthConfig({
      fetchImpl: fetchMock as never,
    });
    const serialized = JSON.stringify(result);

    expect(result.ok).toBe(true);
    expect(result.selectedVariant).toBe("B");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.errorBody).toBeNull();
    expect(serialized).not.toContain("must-not-leak");
    expect(serialized).not.toContain("Y2xpZW50OnNlY3JldA");
  });

  it("verifies a valid Tpay JWS webhook and maps paid status", async () => {
    const rawBody = JSON.stringify({
      type: "transaction",
      data: {
        transactionId: "01TPAYTRANSACTION",
        transactionTitle: "TR-GM-TEST",
        transactionAmount: 119,
        transactionStatus: "correct",
        transactionHiddenDescription: "ord_tpay_test",
      },
    });
    const signature = signTpayBody(rawBody);

    await expect(
      verifyTpayJwsSignature(rawBody, signature, {
        environment: "sandbox",
        fetchCertificate: async () => testCertificate,
      }),
    ).resolves.toBe(true);

    const request = new Request("https://example.test", {
      headers: { "x-jws-signature": signature },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => testCertificate,
      }),
    );

    const notification = await getPaymentProviderAdapter("tpay").verifyWebhook(
      request as never,
      rawBody,
    );

    expect(notification).toMatchObject({
      provider: "tpay",
      providerEventId: "01TPAYTRANSACTION",
      providerTransactionId: "01TPAYTRANSACTION",
      providerPaymentId: "TR-GM-TEST",
      orderId: "ord_tpay_test",
      status: "paid",
      amount: 11900,
      currency: "PLN",
    });
  });

  it("rejects an invalid Tpay JWS signature", async () => {
    const rawBody = JSON.stringify({ data: { transactionId: "01TPAY" } });
    const signature = signTpayBody(rawBody).replace(/.$/, "x");

    await expect(
      verifyTpayJwsSignature(rawBody, signature, {
        environment: "sandbox",
        fetchCertificate: async () => testCertificate,
      }),
    ).rejects.toThrow("Invalid Tpay JWS signature");
  });

  it("verifies a valid Tpay classic form notification and maps paid status", async () => {
    vi.stubEnv("TPAY_MERCHANT_ID", "1010");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");
    const md5sum = signTpayClassicNotification({
      merchantId: "1010",
      transactionTitle: "TR-GM-TEST",
      amount: "119.00",
      crc: "ord_tpay_test",
      securityCode: "security-code",
    });
    const rawBody = new URLSearchParams({
      id: "1010",
      tr_id: "TR-GM-TEST",
      tr_amount: "119.00",
      tr_paid: "119.00",
      tr_crc: "ord_tpay_test",
      tr_status: "TRUE",
      md5sum,
    }).toString();
    const request = new Request("https://example.test", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });

    const notification = await getPaymentProviderAdapter("tpay").verifyWebhook(
      request as never,
      rawBody,
    );

    expect(notification).toMatchObject({
      provider: "tpay",
      providerEventId: "tpay_classic_TR-GM-TEST_ord_tpay_test_paid",
      providerTransactionId: null,
      providerPaymentId: "TR-GM-TEST",
      orderId: "ord_tpay_test",
      status: "paid",
      amount: 11900,
      currency: "PLN",
    });
    expect(notification.rawProviderPayload).toMatchObject({
      format: "classic_form",
      verification: "md5",
      id: "1010",
      tr_id: "TR-GM-TEST",
      tr_crc: "ord_tpay_test",
      md5sum: "[redacted]",
    });
    expect(JSON.stringify(notification.rawProviderPayload)).not.toContain(md5sum);
  });

  it("detects a Tpay classic form notification even without a content type", async () => {
    vi.stubEnv("TPAY_MERCHANT_ID", "1010");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");
    const md5sum = signTpayClassicNotification({
      merchantId: "1010",
      transactionTitle: "TR-GM-TEST",
      amount: "18.99",
      crc: "ord_tpay_test",
      securityCode: "security-code",
    });
    const rawBody = new URLSearchParams({
      id: "1010",
      tr_id: "TR-GM-TEST",
      tr_amount: "18.99",
      tr_paid: "18.99",
      tr_crc: "ord_tpay_test",
      tr_status: "TRUE",
      md5sum,
    }).toString();
    const request = new Request("https://example.test", {
      method: "POST",
      body: rawBody,
    });

    const notification = await getPaymentProviderAdapter("tpay").verifyWebhook(
      request as never,
      rawBody,
    );

    expect(notification).toMatchObject({
      providerPaymentId: "TR-GM-TEST",
      orderId: "ord_tpay_test",
      status: "paid",
      amount: 1899,
      currency: "PLN",
    });
  });

  it("rejects a Tpay classic form notification with the wrong security hash", async () => {
    vi.stubEnv("TPAY_MERCHANT_ID", "1010");
    vi.stubEnv("TPAY_WEBHOOK_SECRET", "security-code");
    const rawBody = new URLSearchParams({
      id: "1010",
      tr_id: "TR-GM-TEST",
      tr_amount: "119.00",
      tr_crc: "ord_tpay_test",
      tr_status: "TRUE",
      md5sum: "wrong",
    }).toString();
    const request = new Request("https://example.test", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });

    await expect(
      getPaymentProviderAdapter("tpay").verifyWebhook(request as never, rawBody),
    ).rejects.toThrow("Unverified tpay payment callback");
  });

  it("rejects wrong amount and wrong currency before payment processing", () => {
    const payment: Pick<PaymentTransaction, "amount" | "currency"> = {
      amount: 11900,
      currency: "PLN",
    };

    expect(() =>
      assertPaymentWebhookMatchesPayment(
        {
          provider: "tpay",
          providerEventId: "evt_wrong_amount",
          providerTransactionId: "01TPAY",
          providerPaymentId: null,
          orderId: "ord_tpay_test",
          status: "paid",
          amount: 12000,
          currency: "PLN",
          rawProviderPayload: {},
        },
        payment,
      ),
    ).toThrow("amount");

    expect(() =>
      assertPaymentWebhookMatchesPayment(
        {
          provider: "tpay",
          providerEventId: "evt_wrong_currency",
          providerTransactionId: "01TPAY",
          providerPaymentId: null,
          orderId: "ord_tpay_test",
          status: "paid",
          amount: 11900,
          currency: null,
          rawProviderPayload: {},
        },
        payment,
      ),
    ).toThrow("currency");
  });
});
