import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentWebhookResult } from "@/lib/store/payments";

const mocks = vi.hoisted(() => ({
  verifyWebhook: vi.fn(),
  summarizePaymentWebhookAttempt: vi.fn(),
  processPostgresPaymentWebhook: vi.fn(),
  recordPostgresPaymentWebhookAttempt: vi.fn(),
  sendStoreEmail: vi.fn(),
  readStoreDatabase: vi.fn(),
}));

vi.mock("@/lib/store/payments", () => ({
  getPaymentProviderAdapter: () => ({ verifyWebhook: mocks.verifyWebhook }),
  assertPaymentWebhookMatchesPayment: vi.fn(),
  summarizePaymentWebhookAttempt: mocks.summarizePaymentWebhookAttempt,
}));

vi.mock("@/lib/store/postgres", () => ({
  processPostgresPaymentWebhook: mocks.processPostgresPaymentWebhook,
  recordPostgresPaymentWebhookAttempt: mocks.recordPostgresPaymentWebhookAttempt,
}));

vi.mock("@/lib/store/storage", () => ({
  getConfiguredStoreStorageDriver: () => "postgres",
  readStoreDatabase: mocks.readStoreDatabase,
  updateStoreDatabase: vi.fn(),
}));

vi.mock("@/lib/store/email", () => ({
  sendStoreEmail: mocks.sendStoreEmail,
}));

vi.mock("@/lib/store/orders", () => ({
  markOrderPaidFromVerifiedProvider: vi.fn(),
  markOrderPaymentFailedOrCancelled: vi.fn(),
  resolveOrderFromProviderReference: vi.fn(),
}));

vi.mock("@/lib/store/operations", () => ({
  trackAnalyticsEvent: vi.fn(),
}));

import { POST } from "./route";

function tpayNotification(overrides: Partial<PaymentWebhookResult> = {}): PaymentWebhookResult {
  return {
    provider: "tpay",
    providerEventId: "tpay_classic_TR-GM-TEST_ord_tpay_test_paid",
    providerTransactionId: null,
    providerPaymentId: "TR-GM-TEST",
    orderId: "ord_tpay_test",
    status: "paid",
    amount: 11900,
    currency: "PLN",
    rawProviderPayload: { format: "classic_form", md5sum: "[redacted]" },
    ...overrides,
  };
}

describe("Tpay webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readStoreDatabase.mockResolvedValue({ orders: [{ id: "ord_tpay_test" }] });
    mocks.recordPostgresPaymentWebhookAttempt.mockResolvedValue(undefined);
    mocks.summarizePaymentWebhookAttempt.mockReturnValue({
      provider: "tpay",
      providerTransactionId: null,
      providerPaymentId: null,
      orderId: null,
      status: null,
      amount: null,
      currency: null,
      rawProviderPayload: {
        result: "rejected",
        responseBody: "FALSE",
        failureReason: "Invalid Tpay notification merchant id.",
        rawBodyLength: 8,
      },
    });
  });

  it("returns plain text TRUE for an accepted Tpay notification", async () => {
    mocks.verifyWebhook.mockResolvedValue(tpayNotification());
    mocks.processPostgresPaymentWebhook.mockResolvedValue({
      duplicate: false,
      order: { id: "ord_tpay_test" },
    });

    const response = await POST(
      new Request("https://example.test/api/payments/webhook/tpay", {
        method: "POST",
        body: "id=1010",
      }) as never,
      { params: Promise.resolve({ provider: "tpay" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    await expect(response.text()).resolves.toBe("TRUE");
    expect(mocks.sendStoreEmail).toHaveBeenCalledWith(
      "payment_confirmed",
      expect.objectContaining({ order: expect.objectContaining({ id: "ord_tpay_test" }) }),
    );
  });

  it("returns plain text TRUE for a duplicate valid Tpay notification", async () => {
    mocks.verifyWebhook.mockResolvedValue(tpayNotification());
    mocks.processPostgresPaymentWebhook.mockResolvedValue({
      duplicate: true,
      order: null,
    });

    const response = await POST(
      new Request("https://example.test/api/payments/webhook/tpay", {
        method: "POST",
        body: "id=1010",
      }) as never,
      { params: Promise.resolve({ provider: "tpay" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("TRUE");
  });

  it("returns plain text FALSE for an invalid Tpay notification", async () => {
    mocks.verifyWebhook.mockRejectedValue(new Error("Invalid Tpay notification merchant id."));

    const response = await POST(
      new Request("https://example.test/api/payments/webhook/tpay", {
        method: "POST",
        body: "id=wrong",
      }) as never,
      { params: Promise.resolve({ provider: "tpay" }) },
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("text/plain");
    await expect(response.text()).resolves.toBe("FALSE");
    expect(mocks.recordPostgresPaymentWebhookAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "tpay",
        rawProviderPayload: expect.objectContaining({
          result: "rejected",
          responseBody: "FALSE",
          failureReason: "Invalid Tpay notification merchant id.",
          rawBodyLength: expect.any(Number),
        }),
      }),
    );
  });

  it("rejects a valid but unknown Tpay notification instead of returning TRUE", async () => {
    mocks.verifyWebhook.mockResolvedValue(tpayNotification({ orderId: "missing" }));
    mocks.processPostgresPaymentWebhook.mockResolvedValue({
      duplicate: false,
      order: null,
    });

    const response = await POST(
      new Request("https://example.test/api/payments/webhook/tpay", {
        method: "POST",
        body: "id=1010",
      }) as never,
      { params: Promise.resolve({ provider: "tpay" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("FALSE");
  });
});
