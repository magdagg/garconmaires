import { afterEach, describe, expect, it, vi } from "vitest";
import { getAccountRateLimitDiagnostics } from "@/lib/account/security";

const rateLimitEnvKeys = [
  "ACCOUNT_RATE_LIMIT_REDIS_REST_URL",
  "ACCOUNT_RATE_LIMIT_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "UPSTASH_REDIS_REST_KV_REST_API_URL",
  "UPSTASH_REDIS_REST_KV_REST_API_TOKEN",
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("account rate limit diagnostics", () => {
  it("recognizes Vercel Upstash integration REST env names", () => {
    for (const key of rateLimitEnvKeys) {
      vi.stubEnv(key, "");
    }

    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_URL", "https://example-upstash.test/");
    vi.stubEnv("UPSTASH_REDIS_REST_KV_REST_API_TOKEN", "test-token");

    expect(getAccountRateLimitDiagnostics()).toMatchObject({
      storage: "upstash",
      durableConfigured: true,
      productionReady: true,
      warnings: [],
    });
  });
});
