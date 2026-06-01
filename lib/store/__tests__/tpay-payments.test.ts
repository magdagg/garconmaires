import { createSign } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPaymentWebhookMatchesPayment,
  getPaymentProviderAdapter,
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
      parcelLockerId: null,
      parcelLockerAddress: null,
      deliveryPrice: 1900,
      trackingNumber: null,
      labelUrl: null,
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
