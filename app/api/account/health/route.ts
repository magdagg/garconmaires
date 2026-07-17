import { NextResponse } from "next/server";
import {
  getCustomerAccountMode,
  isCustomerAccountEnabled,
  isProductionRuntime,
} from "@/lib/account/config";
import { getAccountRateLimitDiagnostics } from "@/lib/account/security";
import { getPrisma } from "@/lib/prisma";
import { getEmailConfigDiagnostics } from "@/lib/store/email";
import { getPublicCatalogState } from "@/lib/store/public-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthCheck = {
  ok: boolean;
  [key: string]: boolean | number | string | null;
};

function noStoreJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

async function databaseHealth(): Promise<HealthCheck> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

async function storefrontHealth(): Promise<HealthCheck> {
  try {
    const catalog = await getPublicCatalogState();

    return {
      ok:
        catalog.shopEnabled === false &&
        catalog.shopMode === "PRE_LAUNCH" &&
        catalog.products.length === 0 &&
        catalog.storefrontLive === false,
      shopEnabled: catalog.shopEnabled,
      shopMode: catalog.shopMode,
      visibleProducts: catalog.products.length,
      storefrontLive: catalog.storefrontLive,
    };
  } catch {
    return { ok: false };
  }
}

export async function GET() {
  const [database, storefront] = await Promise.all([
    databaseHealth(),
    storefrontHealth(),
  ]);
  const email = getEmailConfigDiagnostics();
  const rateLimit = getAccountRateLimitDiagnostics();
  const accountMode = getCustomerAccountMode();

  const checks = {
    database,
    account: {
      ok: isCustomerAccountEnabled(),
      mode: accountMode,
    },
    email: {
      ok:
        email.resendApiKeyPresent &&
        email.resendFromEmailPresent &&
        email.resendReplyToPresent &&
        (!isProductionRuntime() || !email.emailTestMode),
      resendApiKeyPresent: email.resendApiKeyPresent,
      resendFromEmailPresent: email.resendFromEmailPresent,
      resendReplyToPresent: email.resendReplyToPresent,
      emailTestMode: email.emailTestMode,
    },
    rateLimit: {
      ok: !isProductionRuntime() || rateLimit.productionReady,
      storage: rateLimit.storage,
      durableConfigured: rateLimit.durableConfigured,
      productionReady: rateLimit.productionReady,
    },
    storefront,
  };

  const ok = Object.values(checks).every((check) => check.ok);

  return noStoreJson(
    {
      ok,
      checks,
      timestamp: new Date().toISOString(),
    },
    ok ? 200 : 503,
  );
}
