import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  getCustomerAccountMode: vi.fn(),
  isCustomerAccountEnabled: vi.fn(),
  isProductionRuntime: vi.fn(),
  getAccountRateLimitDiagnostics: vi.fn(),
  getEmailConfigDiagnostics: vi.fn(),
  getPublicCatalogState: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    $queryRaw: mocks.queryRaw,
  }),
}));

vi.mock("@/lib/account/config", () => ({
  getCustomerAccountMode: mocks.getCustomerAccountMode,
  isCustomerAccountEnabled: mocks.isCustomerAccountEnabled,
  isProductionRuntime: mocks.isProductionRuntime,
}));

vi.mock("@/lib/account/security", () => ({
  getAccountRateLimitDiagnostics: mocks.getAccountRateLimitDiagnostics,
}));

vi.mock("@/lib/store/email", () => ({
  getEmailConfigDiagnostics: mocks.getEmailConfigDiagnostics,
}));

vi.mock("@/lib/store/public-catalog", () => ({
  getPublicCatalogState: mocks.getPublicCatalogState,
}));

function mockHealthyDependencies() {
  mocks.queryRaw.mockResolvedValue([{ "?column?": 1 }]);
  mocks.getCustomerAccountMode.mockReturnValue("enabled");
  mocks.isCustomerAccountEnabled.mockReturnValue(true);
  mocks.isProductionRuntime.mockReturnValue(true);
  mocks.getAccountRateLimitDiagnostics.mockReturnValue({
    storage: "upstash",
    durableConfigured: true,
    productionReady: true,
  });
  mocks.getEmailConfigDiagnostics.mockReturnValue({
    resendApiKeyPresent: true,
    resendFromEmailPresent: true,
    resendReplyToPresent: true,
    emailTestMode: false,
  });
  mocks.getPublicCatalogState.mockResolvedValue({
    storefrontLive: false,
    shopEnabled: false,
    shopMode: "PRE_LAUNCH",
    products: [],
  });
}

describe("account health endpoint", () => {
  it("returns only safe production readiness diagnostics when healthy", async () => {
    mockHealthyDependencies();
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      checks: {
        database: { ok: true },
        account: { ok: true, mode: "enabled" },
        email: {
          ok: true,
          resendApiKeyPresent: true,
          resendFromEmailPresent: true,
          resendReplyToPresent: true,
          emailTestMode: false,
        },
        rateLimit: {
          ok: true,
          storage: "upstash",
          durableConfigured: true,
          productionReady: true,
        },
        storefront: {
          ok: true,
          shopEnabled: false,
          shopMode: "PRE_LAUNCH",
          visibleProducts: 0,
          storefrontLive: false,
        },
      },
    });
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(JSON.stringify(body)).not.toContain("token");
  });

  it("fails closed when the database check fails", async () => {
    mockHealthyDependencies();
    mocks.queryRaw.mockRejectedValue(new Error("connection failed"));
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.checks.database).toEqual({ ok: false });
  });

  it("fails closed if the storefront is live or products are visible", async () => {
    mockHealthyDependencies();
    mocks.getPublicCatalogState.mockResolvedValue({
      storefrontLive: true,
      shopEnabled: true,
      shopMode: "PUBLIC_DROP",
      products: [{ id: "prod_live" }],
    });
    const { GET } = await import("./route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.checks.storefront).toMatchObject({
      ok: false,
      shopEnabled: true,
      shopMode: "PUBLIC_DROP",
      visibleProducts: 1,
      storefrontLive: true,
    });
  });
});
