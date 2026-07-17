import { NextRequest, NextResponse } from "next/server";
import { getAccountRateLimitDiagnostics } from "@/lib/account/security";
import { getPrisma } from "@/lib/prisma";
import { isAuthorizedStoreAdmin } from "@/lib/store/admin";
import { createId, nowIso } from "@/lib/store/ids";
import { createDiscountCode } from "@/lib/store/operations";
import { createDefaultStoreDatabase } from "@/lib/store/defaults";
import { getTrackingUrl, normalizeDeliveryMethods } from "@/lib/store/delivery";
import {
  createSyntheticEmailPayload,
  getAvailableEmailTemplates,
  getEmailConfigDiagnostics,
  previewStoreEmail,
  sendStoreEmail,
  sendStoreEmailTest,
} from "@/lib/store/email";
import {
  assertVariantStockIsSafe,
  duplicateSkuValues,
  normalizeProductImageOrder,
  setPrimaryProductImage,
} from "@/lib/store/product-admin";
import {
  getConfiguredStoreStorageDriver,
  readStoreDatabase,
  updateStoreDatabase,
} from "@/lib/store/storage";
import {
  cancelOrderShipment,
  createOrderShipment,
  generateShipmentLabel,
  getShippingProviderDiagnostics,
  refreshShipmentTracking,
} from "@/lib/store/shipping";
import {
  diagnoseTpayOAuthConfig,
  getTpayPublicConfigDiagnostics,
} from "@/lib/store/payments";
import type {
  Drop,
  DropStatus,
  StoreEmailTemplate,
  Product,
  ProductImage,
  ProductStatus,
  ProductVariant,
  StoreDatabase,
  StoreSettings,
} from "@/lib/store/types";

export const runtime = "nodejs";

const tpaySandboxProductId = "prod-tpay-sandbox-test";
const tpaySandboxVariantId = "var-tpay-sandbox-test-one-size";

type ReadinessStatus = "pass" | "warn" | "fail";

type ReadinessCheck = {
  label: string;
  status: ReadinessStatus;
  detail: string;
};

type AdminWebhookEvent = {
  id: string;
  provider: string | null;
  type: string;
  orderId: string | null;
  providerTransactionId: string | null;
  providerPaymentId: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  createdAt: Date | string | null;
};

type LegalReadinessDiagnostics = {
  sellerDataStatus: "pending";
  legalStatus: "pending";
  businessRegistrationStatus: "unregistered_activity_planned";
  readyForPublicCheckout: boolean;
  blocker: string;
  reason: string;
  requiredBusinessFormDecision: string[];
  unregisteredActivityChecks: ReadinessCheck[];
  sellerFields: ReadinessCheck[];
  legalPages: ReadinessCheck[];
};

type StoreTransactionClient = Parameters<
  Parameters<ReturnType<typeof getPrisma>["$transaction"]>[0]
>[0];

function ensureAdmin(request: NextRequest) {
  if (!isAuthorizedStoreAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function envValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function sanitizeSiteUrl(rawValue: string) {
  const trimmed = rawValue.trim();
  const prefixed = trimmed.startsWith("NEXT_PUBLIC_SITE_URL=");
  const withoutPrefix = prefixed
    ? trimmed.slice("NEXT_PUBLIC_SITE_URL=".length).trim()
    : trimmed;

  return {
    originalLength: rawValue.length,
    prefixed,
    value: withoutPrefix.replace(/\/$/, ""),
  };
}

function getAdminAuthDiagnostics() {
  const orderAdminToken = envValue("ORDER_ADMIN_TOKEN");

  return {
    orderAdminTokenPresent: Boolean(orderAdminToken),
    orderAdminTokenLength: orderAdminToken.length,
    nodeEnv: envValue("NODE_ENV") || null,
    vercelEnv: envValue("VERCEL_ENV") || null,
    vercelUrlPresent: Boolean(envValue("VERCEL_URL")),
    vercelGitCommitShaPresent: Boolean(envValue("VERCEL_GIT_COMMIT_SHA")),
    vercelGitCommitShaShort: envValue("VERCEL_GIT_COMMIT_SHA")
      ? envValue("VERCEL_GIT_COMMIT_SHA").slice(0, 8)
      : null,
    vercelGitCommitRef: envValue("VERCEL_GIT_COMMIT_REF") || null,
    vercelDeploymentIdPresent: Boolean(envValue("VERCEL_DEPLOYMENT_ID")),
    vercelDeploymentId:
      envValue("VERCEL_DEPLOYMENT_ID") ||
      envValue("VERCEL_DEPLOYMENT_ID_V2") ||
      null,
    runtimeTimestamp: new Date().toISOString(),
  };
}

function safeAdminActionError(error: unknown) {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : "Unknown admin action error.";
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : null;

  return {
    name,
    code,
    message: message.slice(0, 240),
  };
}

function latestOrderEmailPayload(
  database: StoreDatabase,
  template: StoreEmailTemplate,
) {
  const orderTemplates: StoreEmailTemplate[] = [
    "order_created",
    "payment_pending",
    "payment_confirmed",
    "payment_failed",
    "order_shipped",
  ];

  if (!orderTemplates.includes(template)) {
    return createSyntheticEmailPayload(template);
  }

  const latestPaidTestOrder =
    database.orders.find((order) => order.orderNumber === "GM-2026-0003") ??
    database.orders.find((order) => order.paymentStatus === "paid") ??
    database.orders[0];

  return latestPaidTestOrder
    ? { order: latestPaidTestOrder }
    : createSyntheticEmailPayload(template);
}

function getLegalReadinessDiagnostics(database: StoreDatabase): LegalReadinessDiagnostics {
  const requiredSellerFields: Array<[string, string]> = [
    ["sellerName", database.settings.sellerName],
    ["sellerAddress", database.settings.sellerAddress],
    ["returnAddress", database.settings.returnAddress],
  ];
  const optionalUnregisteredActivityFields: Array<[string, string]> = [
    ["nip", database.settings.nip],
    ["regon", database.settings.regon],
  ];
  const legalPages = [
    "terms/regulamin",
    "privacy policy",
    "returns and complaints",
    "delivery",
    "contact",
  ];

  return {
    sellerDataStatus: "pending",
    legalStatus: "pending",
    businessRegistrationStatus: "unregistered_activity_planned",
    readyForPublicCheckout: false,
    blocker:
      "Business model selected: działalność nierejestrowana planned. Launch remains blocked until seller identity, legal pages, return/contact data, sales limit controls and product readiness are completed.",
    reason:
      "First-drop model is planned as Polish działalność nierejestrowana. Do not invent or publish seller identity, address, return address, NIP, REGON, company name, or tax details.",
    requiredBusinessFormDecision: ["dzialalnosc nierejestrowana planned"],
    unregisteredActivityChecks: [
      readinessCheck(
        "quarterly revenue limit tracking",
        "fail",
        "required before launch; first drop must stay within the applicable działalność nierejestrowana revenue limit",
      ),
      readinessCheck(
        "simplified sales register / ewidencja sprzedaży",
        "fail",
        "required before launch; prepare a daily simplified sales register process",
      ),
      readinessCheck(
        "invoice and cost document collection",
        "warn",
        "prepare a folder/process for sales confirmations, invoices and cost documents",
      ),
      readinessCheck(
        "PIT settlement reminder",
        "warn",
        "add an operational reminder for annual PIT settlement of this income",
      ),
      readinessCheck(
        "VAT recovery",
        "warn",
        "assume no VAT recovery unless a different tax/VAT decision is made later",
      ),
    ],
    sellerFields: [
      ...requiredSellerFields.map(([label, value]) =>
        readinessCheck(label, value.trim() ? "warn" : "fail", value.trim() ? "filled but must be verified before launch" : "pending"),
      ),
      ...optionalUnregisteredActivityFields.map(([label, value]) =>
        readinessCheck(
          label,
          "warn",
          value.trim()
            ? "optional for unregistered activity; filled but must be verified before launch"
            : "optional for unregistered activity unless provided or legally required",
        ),
      ),
    ],
    legalPages: legalPages.map((label) =>
      readinessCheck(label, "warn", "draft/pending; not final legal copy"),
    ),
  };
}

function readinessCheck(
  label: string,
  status: ReadinessStatus,
  detail: string,
): ReadinessCheck {
  return { label, status, detail };
}

function envCheck(name: string, expected?: string): ReadinessCheck {
  const value = envValue(name);

  if (!value) {
    return readinessCheck(name, "fail", "missing");
  }

  if (expected && value !== expected) {
    return readinessCheck(name, "fail", `invalid, expected ${expected}`);
  }

  return readinessCheck(name, "pass", expected ? `set to ${expected}` : "present");
}

function productionDeployment() {
  const vercelEnv = envValue("VERCEL_ENV");
  const runtimeEnv = envValue("NODE_ENV");

  return vercelEnv ? vercelEnv === "production" : runtimeEnv === "production";
}

async function getDatabaseReadinessChecks(input: {
  database: StoreDatabase;
  readError: string | null;
}) {
  const checks: ReadinessCheck[] = [];
  const storageDriver = getConfiguredStoreStorageDriver();
  const product = input.database.products.find(
    (item) => item.id === tpaySandboxProductId,
  );
  const variant = input.database.variants.find(
    (item) => item.id === tpaySandboxVariantId,
  );

  if (storageDriver !== "postgres") {
    checks.push(
      readinessCheck(
        "database connection works",
        "fail",
        "STORE_STORAGE is not postgres, so staging payment readiness cannot be verified.",
      ),
    );
  } else if (input.readError) {
    checks.push(
      readinessCheck("database connection works", "fail", input.readError),
    );
  } else {
    try {
      const prisma = getPrisma();

      await prisma.$queryRaw`SELECT 1`;
      checks.push(readinessCheck("database connection works", "pass", "connected"));
    } catch (error) {
      checks.push(
        readinessCheck(
          "database connection works",
          "fail",
          error instanceof Error ? error.message : "connection failed",
        ),
      );
    }
  }

  if (storageDriver === "postgres" && !input.readError) {
    try {
      const prisma = getPrisma();
      const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
        SELECT migration_name
        FROM "_prisma_migrations"
        WHERE finished_at IS NOT NULL
        ORDER BY migration_name
      `;
      checks.push(
        readinessCheck(
          "migrations appear applied",
          migrations.some(
            (item: { migration_name: string }) =>
              item.migration_name === "0001_init",
          )
            ? "pass"
            : "fail",
          migrations.length
            ? migrations
                .map((item: { migration_name: string }) => item.migration_name)
                .join(", ")
            : "no finished migrations found",
        ),
      );
    } catch (error) {
      checks.push(
        readinessCheck(
          "migrations appear applied",
          "fail",
          error instanceof Error ? error.message : "migration check failed",
        ),
      );
    }
  } else {
    checks.push(
      readinessCheck(
        "migrations appear applied",
        "fail",
        "requires a working postgres connection",
      ),
    );
  }

  checks.push(
    readinessCheck(
      "store settings exist",
      input.readError ? "fail" : "pass",
      input.readError ? "store settings could not be read" : "loaded",
    ),
  );
  checks.push(
    readinessCheck(
      "shopEnabled=false",
      input.database.settings.shopEnabled ? "fail" : "pass",
      `shopEnabled=${String(input.database.settings.shopEnabled)}`,
    ),
  );
  checks.push(
    readinessCheck(
      "shopMode=PRE_LAUNCH",
      input.database.settings.shopMode === "PRE_LAUNCH" ? "pass" : "fail",
      `shopMode=${input.database.settings.shopMode}`,
    ),
  );
  checks.push(
    readinessCheck(
      "seeded Tpay sandbox product exists",
      product ? "pass" : "fail",
      product ? product.name : `${tpaySandboxProductId} not found`,
    ),
  );
  checks.push(
    readinessCheck(
      "test product price 1.00 PLN",
      product?.price === 100 ? "pass" : "fail",
      product ? `price=${(product.price / 100).toFixed(2)} PLN` : "product missing",
    ),
  );
  checks.push(
    readinessCheck(
      "test product currency=PLN",
      product?.currency === "PLN" ? "pass" : "fail",
      product ? `currency=${product.currency}` : "product missing",
    ),
  );
  checks.push(
    readinessCheck(
      "test product isVisible=false",
      product && !product.isVisible ? "pass" : "fail",
      product ? `isVisible=${String(product.isVisible)}` : "product missing",
    ),
  );
  checks.push(
    readinessCheck(
      "test variant stockQuantity=1",
      variant?.stockQuantity === 1 ? "pass" : "fail",
      variant ? `stockQuantity=${variant.stockQuantity}` : "variant missing",
    ),
  );
  checks.push(
    readinessCheck(
      "test variant reservedQuantity=0",
      variant?.reservedQuantity === 0 ? "pass" : "fail",
      variant ? `reservedQuantity=${variant.reservedQuantity}` : "variant missing",
    ),
  );

  return checks;
}

async function getTpaySandboxDiagnostics(input: {
  database: StoreDatabase;
  readError: string | null;
}) {
  const vercelEnv = envValue("VERCEL_ENV");
  const runtimeEnv = envValue("NODE_ENV");
  const isProductionDeployment = productionDeployment();
  const isStagingLike =
    vercelEnv === "preview" ||
    vercelEnv === "development" ||
    !isProductionDeployment;
  const envChecks = [
    envCheck("STORE_STORAGE", "postgres"),
    envCheck("DATABASE_URL"),
    envCheck("PAYMENT_PROVIDER", "tpay"),
    envCheck("TPAY_ENV", "sandbox"),
    envCheck("TPAY_MERCHANT_ID"),
    envCheck("TPAY_API_KEY"),
    envCheck("TPAY_API_SECRET"),
    envCheck("TPAY_WEBHOOK_SECRET"),
    envCheck("NEXT_PUBLIC_SITE_URL"),
    envCheck("ORDER_ADMIN_TOKEN"),
    envCheck("CHECKOUT_TEST_MODE", "true"),
  ];
  const warnings: ReadinessCheck[] = [];
  const rawSiteUrl = envValue("NEXT_PUBLIC_SITE_URL");
  const siteUrl = sanitizeSiteUrl(rawSiteUrl);
  const webhookUrl = siteUrl.value
    ? `${siteUrl.value}/api/payments/webhook/tpay`
    : null;

  if (isProductionDeployment && envValue("CHECKOUT_TEST_MODE") === "true") {
    warnings.push(
      readinessCheck(
        "critical production warning",
        "fail",
        "CHECKOUT_TEST_MODE=true is detected in production. Set it to false immediately.",
      ),
    );
  }

  if (
    input.database.settings.shopMode === "PRE_LAUNCH" &&
    input.database.settings.shopEnabled
  ) {
    warnings.push(
      readinessCheck(
        "pre-launch shop warning",
        "warn",
        "shopEnabled=true while shopMode=PRE_LAUNCH.",
      ),
    );
  }

  if (siteUrl.prefixed) {
    warnings.push(
      readinessCheck(
        "NEXT_PUBLIC_SITE_URL format warning",
        "warn",
        "NEXT_PUBLIC_SITE_URL value included a key prefix; the readiness panel sanitized it for display.",
      ),
    );
  }

  if (siteUrl.value) {
    try {
      const hostname = new URL(siteUrl.value).hostname;

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        warnings.push(
          readinessCheck(
            "webhook URL warning",
            "warn",
            "NEXT_PUBLIC_SITE_URL points to localhost. Tpay cannot reach local webhooks without a public HTTPS tunnel.",
          ),
        );
      }
    } catch {
      warnings.push(
        readinessCheck(
          "webhook URL warning",
          "fail",
          "NEXT_PUBLIC_SITE_URL is not a valid URL.",
        ),
      );
    }
  }

  if (siteUrl.value && !siteUrl.value.startsWith("https://")) {
    warnings.push(
      readinessCheck(
        "webhook URL warning",
        "warn",
        "NEXT_PUBLIC_SITE_URL should be an HTTPS staging origin for Tpay webhooks.",
      ),
    );
  }

  const databaseChecks = await getDatabaseReadinessChecks(input);
  const config = getTpayPublicConfigDiagnostics();
  const allChecks = [...envChecks, ...databaseChecks, ...warnings];
  const ready = allChecks.every((check) => check.status === "pass");

  return {
    environment: {
      nodeEnv: runtimeEnv || null,
      vercelEnv: vercelEnv || null,
      vercelUrlPresent: Boolean(envValue("VERCEL_URL")),
      vercelGitCommitShaShort: envValue("VERCEL_GIT_COMMIT_SHA")
        ? envValue("VERCEL_GIT_COMMIT_SHA").slice(0, 8)
        : null,
      vercelGitCommitRef: envValue("VERCEL_GIT_COMMIT_REF") || null,
      vercelDeploymentId:
        envValue("VERCEL_DEPLOYMENT_ID") ||
        envValue("VERCEL_DEPLOYMENT_ID_V2") ||
        null,
      runtimeTimestamp: new Date().toISOString(),
    },
    isStagingLike,
    isProductionDeployment,
    ready,
    envChecks,
    databaseChecks,
    warnings,
    missing: envChecks
      .filter((check) => check.detail === "missing")
      .map((check) => check.label),
    invalid: allChecks
      .filter((check) => check.status !== "pass" && check.detail !== "missing")
      .map((check) => `${check.label}: ${check.detail}`),
    webhookPath: "/api/payments/webhook/tpay",
    webhookUrl,
    siteUrl: {
      present: Boolean(rawSiteUrl),
      originalLength: siteUrl.originalLength,
      sanitized: siteUrl.value || null,
      strippedKeyPrefix: siteUrl.prefixed,
    },
    oauth: {
      selectedEnvironment: config.selectedEnvironment,
      selectedBaseUrl: config.selectedBaseUrl,
      oauthEndpoint: config.oauthEndpoint,
      transactionEndpoint: config.transactionEndpoint,
      usesSandboxBaseUrl: config.usesSandboxBaseUrl,
      usesProductionBaseUrl: config.usesProductionBaseUrl,
      usesOriginApi: config.usesOriginApi,
      paymentProvider: config.paymentProvider,
      tpayEnv: config.tpayEnv,
      merchantId: config.merchantId,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      webhookSecret: config.webhookSecret,
      possibleCredentialSwap: config.possibleCredentialSwap,
      warnings: config.warnings,
    },
  };
}

function timelineEvent(
  type: string,
  status: string | null,
  at: Date | string | null | undefined,
  details?: string,
) {
  if (!at) {
    return null;
  }

  return {
    type,
    status,
    at: at instanceof Date ? at.toISOString() : at,
    details: details ?? null,
  };
}

function parseStringRecord(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      String(entry ?? ""),
    ]),
  );
}

function parseSizeGuide(value: unknown): Product["sizeGuide"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const guide = value as Product["sizeGuide"];

  return {
    apparel: Array.isArray(guide?.apparel)
      ? guide.apparel.map((row) => ({
          size: String(row.size ?? ""),
          chestWidth: String(row.chestWidth ?? ""),
          length: String(row.length ?? ""),
          sleeveLength: row.sleeveLength ? String(row.sleeveLength) : "",
          shoulderWidth: row.shoulderWidth ? String(row.shoulderWidth) : "",
        }))
      : undefined,
    eyewear: guide?.eyewear
      ? {
          lensWidth: String(guide.eyewear.lensWidth ?? ""),
          bridgeWidth: String(guide.eyewear.bridgeWidth ?? ""),
          templeLength: String(guide.eyewear.templeLength ?? ""),
          frameWidth: guide.eyewear.frameWidth ? String(guide.eyewear.frameWidth) : "",
        }
      : undefined,
  };
}

export async function GET(request: NextRequest) {
  const unauthorized = ensureAdmin(request);

  if (unauthorized) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
        diagnostics: {
          adminAuth: getAdminAuthDiagnostics(),
        },
      },
      { status: 401 },
    );
  }

  let readError: string | null = null;
  let database: StoreDatabase;

  try {
    database = await readStoreDatabase();
  } catch (error) {
    readError =
      error instanceof Error ? error.message : "Unable to read store database.";
    database = createDefaultStoreDatabase();
  }

  const webhookEvents: AdminWebhookEvent[] =
    getConfiguredStoreStorageDriver() === "postgres" && !readError
      ? (await getPrisma().paymentWebhookEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        }))
      : database.processedWebhookEvents.slice(-100).reverse().map((id): AdminWebhookEvent => ({
          id,
          provider: null,
          type: "payment_notification",
          orderId: null,
          providerTransactionId: null,
          providerPaymentId: null,
          status: null,
          amount: null,
          currency: null,
          createdAt: null,
        }));

  const orders = database.orders.map((order) => {
    const payment = database.payments.find((item) => item.orderId === order.id);
    const lastWebhookEvent = webhookEvents.find(
      (event) =>
        event.orderId === order.id ||
        event.providerTransactionId === payment?.providerTransactionId ||
        event.providerPaymentId === payment?.providerPaymentId,
    );
    const stock = order.items.map((item) => {
      const variant = database.variants.find((entry) => entry.id === item.variantId);

      return {
        productName: item.name,
        sku: item.sku,
        size: item.size,
        orderedQuantity: item.quantity,
        currentStock: variant?.stockQuantity ?? null,
        currentReserved: variant?.reservedQuantity ?? null,
      };
    });
    const orderWebhookEvents = webhookEvents.filter(
      (event) =>
        event.orderId === order.id ||
        event.providerTransactionId === payment?.providerTransactionId ||
        event.providerPaymentId === payment?.providerPaymentId,
    );
    const analyticsEvents = database.analyticsEvents.filter(
      (event) => event.orderId === order.id,
    );
    const timeline = [
      timelineEvent("order", order.orderStatus, order.createdAt, "Order created"),
      timelineEvent(
        "payment",
        payment?.status ?? order.paymentStatus,
        payment?.createdAt,
        "Payment record created",
      ),
      ...analyticsEvents.map((event) =>
        timelineEvent("analytics", event.name, event.createdAt, event.id),
      ),
      ...orderWebhookEvents.map((event) =>
        timelineEvent("webhook", event.status, event.createdAt, event.id),
      ),
      timelineEvent("payment", "paid", payment?.paidAt, "Payment marked paid"),
    ]
      .filter((event): event is NonNullable<typeof event> => Boolean(event))
      .sort((left, right) => left.at.localeCompare(right.at));

    return {
      ...order,
      shipments: database.shipments.filter((shipment) => shipment.orderId === order.id),
      provider: payment?.provider ?? order.provider,
      providerTransactionId: payment?.providerTransactionId ?? null,
      providerPaymentId: payment?.providerPaymentId ?? null,
      paidAt: payment?.paidAt ?? null,
      rawEventIds: payment?.rawEventIds ?? [],
      lastWebhookEvent,
      stock,
      timeline,
    };
  });

  return NextResponse.json({
    products: database.products,
    variants: database.variants,
    images: database.images,
    categories: database.categories,
    drops: database.drops,
    orders,
    payments: database.payments,
    emailEvents: database.emailEvents,
    shipments: database.shipments,
    webhookEvents,
    returns: database.returns,
    complaints: database.complaints,
    newsletterSubscribers: database.newsletterSubscribers,
    discounts: database.discounts,
    settings: database.settings,
    diagnostics: {
      adminAuth: getAdminAuthDiagnostics(),
      tpaySandbox: await getTpaySandboxDiagnostics({ database, readError }),
      legalReadiness: getLegalReadinessDiagnostics(database),
      email: {
        config: getEmailConfigDiagnostics(),
        templates: getAvailableEmailTemplates(),
      },
      accountSecurity: {
        rateLimit: getAccountRateLimitDiagnostics(),
      },
      shipping: {
        providers: getShippingProviderDiagnostics(),
      },
    },
    analyticsEvents: database.analyticsEvents.slice(0, 200),
  });
}

async function resetTpaySandboxProduct() {
  if (productionDeployment()) {
    throw new Error("Refusing to reset the Tpay sandbox product in production.");
  }

  if (getConfiguredStoreStorageDriver() === "postgres") {
    const prisma = getPrisma();

    return prisma.$transaction(async (tx: StoreTransactionClient) => {
      const product = await tx.product.findUnique({
        where: { id: tpaySandboxProductId },
      });
      const variant = await tx.productVariant.findUnique({
        where: { id: tpaySandboxVariantId },
      });

      if (!product || !variant || variant.productId !== tpaySandboxProductId) {
        throw new Error("Tpay sandbox product or variant is missing. Run the sandbox seed first.");
      }

      await tx.inventoryReservation.updateMany({
        where: {
          variantId: tpaySandboxVariantId,
          status: "active",
        },
        data: {
          status: "released",
        },
      });
      await tx.productVariant.update({
        where: { id: tpaySandboxVariantId },
        data: {
          stockQuantity: 1,
          reservedQuantity: 0,
        },
      });

      return {
        productId: tpaySandboxProductId,
        variantId: tpaySandboxVariantId,
        stockQuantity: 1,
        reservedQuantity: 0,
      };
    });
  }

  return updateStoreDatabase((database) => {
    const variant = database.variants.find(
      (item) =>
        item.id === tpaySandboxVariantId &&
        item.productId === tpaySandboxProductId,
    );

    if (!variant) {
      throw new Error("Tpay sandbox product variant is missing. Run the sandbox seed first.");
    }

    for (const reservation of database.reservations) {
      if (
        reservation.variantId === tpaySandboxVariantId &&
        reservation.status === "active"
      ) {
        reservation.status = "released";
        reservation.updatedAt = nowIso();
      }
    }

    variant.stockQuantity = 1;
    variant.reservedQuantity = 0;
    variant.updatedAt = nowIso();

    return {
      productId: tpaySandboxProductId,
      variantId: tpaySandboxVariantId,
      stockQuantity: 1,
      reservedQuantity: 0,
    };
  });
}

export async function POST(request: NextRequest) {
  const unauthorized = ensureAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json()) as {
    action?: string;
    payload?: Record<string, unknown>;
  };

  try {
    if (body.action === "tpaySandbox.reset") {
      const result = await resetTpaySandboxProduct();

      return NextResponse.json({
        ok: true,
        message: "Tpay sandbox product reset to stockQuantity=1 and reservedQuantity=0.",
        result,
      });
    }

    if (body.action === "tpaySandbox.oauthDiagnostic") {
      const result = await diagnoseTpayOAuthConfig();

      return NextResponse.json({
        ok: result.ok,
        message: result.ok
          ? "OAuth OK — sandbox credentials valid."
          : "OAuth diagnostic failed. Review the sanitized Tpay result.",
        result,
      });
    }

    if (body.action === "email.preview") {
      const template = String(body.payload?.template ?? "order_created") as StoreEmailTemplate;
      const sample = String(body.payload?.sample ?? "synthetic");
      const database = await readStoreDatabase();
      const payload =
        sample === "latest_order"
          ? latestOrderEmailPayload(database, template)
          : createSyntheticEmailPayload(template);
      const preview = await previewStoreEmail(template, payload);

      return NextResponse.json({ ok: true, result: { preview } });
    }

    if (body.action === "email.testSend") {
      const template = String(body.payload?.template ?? "order_created") as StoreEmailTemplate;
      const recipient =
        typeof body.payload?.recipient === "string" ? body.payload.recipient : null;
      const database = await readStoreDatabase();

      try {
        const result = await sendStoreEmailTest({
          template,
          recipient,
          payload: latestOrderEmailPayload(database, template),
        });

        return NextResponse.json({
          ok: true,
          message:
            result.status === "sent" || result.status === "queued"
              ? "Test email queued."
              : "Test email skipped.",
          result,
        });
      } catch (error) {
        return NextResponse.json(
          {
            ok: false,
            error: "Email test send failed.",
            diagnostics: {
              action: "email.testSend",
              template,
              ...safeAdminActionError(error),
            },
          },
          { status: 500 },
        );
      }
    }

    if (body.action?.startsWith("shipment.")) {
      if (getConfiguredStoreStorageDriver() !== "postgres") {
        throw new Error("Shipment API actions require STORE_STORAGE=postgres.");
      }

      const orderId = String(body.payload?.orderId ?? "");
      const shipmentId =
        typeof body.payload?.shipmentId === "string"
          ? body.payload.shipmentId
          : undefined;
      const provider =
        typeof body.payload?.provider === "string"
          ? body.payload.provider
          : undefined;
      const database = await readStoreDatabase();
      const order = database.orders.find((item) => item.id === orderId);

      if (!order) {
        throw new Error("Order not found.");
      }

      if (body.action === "shipment.create") {
        const shipment = await createOrderShipment(order, provider);

        return NextResponse.json({
          ok: true,
          message: "Shipment created or prepared.",
          result: { shipment },
        });
      }

      if (body.action === "shipment.label") {
        const shipment = await generateShipmentLabel(order, shipmentId);

        return NextResponse.json({
          ok: true,
          message: "Shipment label generated.",
          result: { shipment },
        });
      }

      if (body.action === "shipment.track") {
        const shipment = await refreshShipmentTracking(order, shipmentId);

        return NextResponse.json({
          ok: true,
          message: "Shipment tracking refreshed.",
          result: { shipment },
        });
      }

      if (body.action === "shipment.cancel") {
        const shipment = await cancelOrderShipment(order, shipmentId);

        return NextResponse.json({
          ok: true,
          message: "Shipment cancelled.",
          result: { shipment },
        });
      }
    }

    const result = await updateStoreDatabase((database) => {
    const timestamp = nowIso();
    const payload = body.payload ?? {};

    switch (body.action) {
      case "product.upsert": {
        const id = String(payload.id || createId("prod"));
        const existing = database.products.find((product) => product.id === id);
        const next: Product = {
          id,
          name: String(payload.name ?? existing?.name ?? "Untitled product"),
          slug: String(payload.slug ?? existing?.slug ?? id),
          shortDescription: String(
            payload.shortDescription ?? existing?.shortDescription ?? "",
          ),
          editorialDescription: String(
            payload.editorialDescription ?? existing?.editorialDescription ?? "",
          ),
          technicalDescription: String(
            payload.technicalDescription ?? existing?.technicalDescription ?? "",
          ),
          seoTitle: String(payload.seoTitle ?? existing?.seoTitle ?? ""),
          seoDescription: String(
            payload.seoDescription ?? existing?.seoDescription ?? "",
          ),
          internalNotes: String(
            payload.internalNotes ?? existing?.internalNotes ?? "",
          ),
          specifications:
            parseStringRecord(payload.specifications) ?? existing?.specifications,
          sizeGuide: parseSizeGuide(payload.sizeGuide) ?? existing?.sizeGuide,
          price: Number(payload.price ?? existing?.price ?? 0),
          currency: "PLN",
          status: String(payload.status ?? existing?.status ?? "draft") as ProductStatus,
          isVisible: Boolean(payload.isVisible ?? existing?.isVisible ?? false),
          isFeatured: Boolean(payload.isFeatured ?? existing?.isFeatured ?? false),
          categoryId: (payload.categoryId as string | null) ?? existing?.categoryId ?? null,
          dropId: (payload.dropId as string | null) ?? existing?.dropId ?? null,
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        if (existing) {
          Object.assign(existing, next);
        } else {
          database.products.unshift(next);
        }

        return { product: next };
      }
      case "product.status": {
        const product = database.products.find((item) => item.id === payload.id);

        if (!product) {
          throw new Error("Product not found.");
        }

        product.status = String(payload.status ?? product.status) as ProductStatus;
        product.isVisible = Boolean(payload.isVisible ?? product.isVisible);
        product.updatedAt = timestamp;

        return { product };
      }
      case "variant.upsert": {
        const id = String(payload.id || createId("var"));
        const existing = database.variants.find((variant) => variant.id === id);
        const sku = String(payload.sku ?? existing?.sku ?? id).trim();
        const stockQuantity = Number(
          payload.stockQuantity ?? existing?.stockQuantity ?? 0,
        );
        const reservedQuantity = existing?.reservedQuantity ?? 0;
        const variantsWithNextSku = database.variants.map((variant) =>
          variant.id === id ? { ...variant, sku } : variant,
        );

        if (!existing) {
          variantsWithNextSku.push({
            id,
            productId: String(payload.productId ?? ""),
            size: String(payload.size ?? "OS"),
            sku,
            stockQuantity,
            reservedQuantity: 0,
            isAvailable: false,
            priceOverride: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }

        const duplicateSkus = duplicateSkuValues(variantsWithNextSku);

        if (duplicateSkus.includes(sku)) {
          throw new Error(`Duplicate SKU is not allowed: ${sku}.`);
        }

        assertVariantStockIsSafe({
          sku,
          stockQuantity,
          reservedQuantity,
        });

        const next: ProductVariant = {
          id,
          productId: String(payload.productId ?? existing?.productId ?? ""),
          size: String(payload.size ?? existing?.size ?? "OS"),
          sku,
          stockQuantity,
          reservedQuantity,
          isAvailable: Boolean(payload.isAvailable ?? existing?.isAvailable ?? false),
          priceOverride:
            payload.priceOverride === null || payload.priceOverride === undefined
              ? null
              : Number(payload.priceOverride),
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        if (existing) {
          Object.assign(existing, next);
        } else {
          database.variants.unshift(next);
        }

        return { variant: next };
      }
      case "variant.delete": {
        const variant = database.variants.find((item) => item.id === payload.id);

        if (!variant) {
          throw new Error("Variant not found.");
        }

        if (variant.reservedQuantity > 0) {
          throw new Error("Cannot delete a variant with reserved inventory.");
        }

        const activeReservations = database.reservations.some(
          (reservation) =>
            reservation.variantId === variant.id && reservation.status === "active",
        );

        if (activeReservations) {
          throw new Error("Cannot delete a variant with active reservations.");
        }

        database.variants = database.variants.filter((item) => item.id !== variant.id);

        return { variantId: variant.id };
      }
      case "product.image.add": {
        const productId = String(payload.productId ?? "");
        const image: ProductImage = {
          id: createId("img"),
          productId,
          url: String(payload.url ?? ""),
          alt: String(payload.alt ?? ""),
          sortOrder: Number(
            payload.sortOrder ??
              database.images.filter((item) => item.productId === productId).length,
          ),
          isPrimary: Boolean(payload.isPrimary ?? false),
          createdAt: timestamp,
        };

        if (image.isPrimary) {
          for (const current of database.images) {
            if (current.productId === image.productId) {
              current.isPrimary = false;
            }
          }
        }

        database.images.unshift(image);
        normalizeProductImageOrder(database, image.productId);
        return { image };
      }
      case "product.image.update": {
        const image = database.images.find((item) => item.id === payload.id);

        if (!image) {
          throw new Error("Image not found.");
        }

        image.url = String(payload.url ?? image.url);
        image.alt = String(payload.alt ?? image.alt);
        image.sortOrder = Number(payload.sortOrder ?? image.sortOrder);
        image.isPrimary = Boolean(payload.isPrimary ?? image.isPrimary);

        if (image.isPrimary) {
          setPrimaryProductImage(database, image.id);
        }

        normalizeProductImageOrder(database, image.productId);

        return { image };
      }
      case "product.image.primary": {
        const image = setPrimaryProductImage(database, String(payload.id ?? ""));

        return { image };
      }
      case "product.image.delete": {
        const image = database.images.find((item) => item.id === payload.id);

        if (!image) {
          throw new Error("Image not found.");
        }

        database.images = database.images.filter((item) => item.id !== image.id);
        normalizeProductImageOrder(database, image.productId);

        return { imageId: image.id };
      }
      case "drop.upsert": {
        const id = String(payload.id || createId("drop"));
        const existing = database.drops.find((drop) => drop.id === id);
        const next: Drop = {
          id,
          name: String(payload.name ?? existing?.name ?? "Untitled drop"),
          slug: String(payload.slug ?? existing?.slug ?? id),
          status: String(payload.status ?? existing?.status ?? "draft") as DropStatus,
          launchDate: (payload.launchDate as string | null) ?? existing?.launchDate ?? null,
          endDate: (payload.endDate as string | null) ?? existing?.endDate ?? null,
          description: String(payload.description ?? existing?.description ?? ""),
          isPasswordProtected: Boolean(
            payload.isPasswordProtected ?? existing?.isPasswordProtected ?? false,
          ),
          earlyAccessEnabled: Boolean(
            payload.earlyAccessEnabled ?? existing?.earlyAccessEnabled ?? false,
          ),
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };

        if (existing) {
          Object.assign(existing, next);
        } else {
          database.drops.unshift(next);
        }

        return { drop: next };
      }
      case "settings.update": {
        database.settings = {
          ...database.settings,
          ...(payload as Partial<StoreSettings>),
          deliveryMethods: normalizeDeliveryMethods(
            (payload as Partial<StoreSettings>).deliveryMethods ??
              database.settings.deliveryMethods,
          ),
          defaultCurrency: "PLN",
          defaultCountry: "PL",
          updatedAt: timestamp,
        };
        return { settings: database.settings };
      }
      case "order.status": {
        const order = database.orders.find((item) => item.id === payload.id);

        if (!order) {
          throw new Error("Order not found.");
        }

        if (payload.orderStatus) {
          order.orderStatus = payload.orderStatus as typeof order.orderStatus;
        }

        if (payload.fulfillmentStatus) {
          order.fulfillmentStatus =
            payload.fulfillmentStatus as typeof order.fulfillmentStatus;
        }

        if (payload.trackingNumber !== undefined) {
          order.trackingNumber = String(payload.trackingNumber || "");
          order.delivery.trackingNumber = order.trackingNumber;
          order.delivery.trackingUrl = getTrackingUrl({
            provider: order.delivery.shipmentProvider,
            trackingNumber: order.trackingNumber,
          });
        }

        if (payload.shipmentProvider) {
          order.delivery.shipmentProvider =
            payload.shipmentProvider === "manual" ? "manual" : "inpost";
          order.delivery.trackingUrl = getTrackingUrl({
            provider: order.delivery.shipmentProvider,
            trackingNumber: order.delivery.trackingNumber,
          });
        }

        if (payload.adminNote !== undefined) {
          order.delivery.adminNote = String(payload.adminNote || "");
        }

        if (payload.deliveryStatus) {
          order.delivery.deliveryStatus =
            payload.deliveryStatus as typeof order.delivery.deliveryStatus;
          if (order.delivery.deliveryStatus === "shipped") {
            if (
              order.delivery.shipmentProvider !== "manual" &&
              !String(order.delivery.trackingNumber ?? "").trim()
            ) {
              throw new Error("Tracking number is required before marking the order as shipped.");
            }
            order.delivery.shippedAt = order.delivery.shippedAt ?? timestamp;
          }
        }

        order.updatedAt = timestamp;
        return { order };
      }
      case "order.delivery.update": {
        const order = database.orders.find((item) => item.id === payload.id);

        if (!order) {
          throw new Error("Order not found.");
        }

        if (order.delivery.deliveryStatus === "shipped") {
          throw new Error("Delivery data cannot be edited after shipping.");
        }

        if (payload.deliveryMethod) {
          order.delivery.deliveryMethod = payload.deliveryMethod as typeof order.delivery.deliveryMethod;
        }

        if (payload.shipmentProvider) {
          order.delivery.shipmentProvider =
            payload.shipmentProvider === "manual" ? "manual" : "inpost";
        }

        if (payload.parcelLockerId !== undefined) {
          order.delivery.parcelLockerId = String(payload.parcelLockerId || "");
        }

        if (payload.parcelLockerName !== undefined) {
          order.delivery.parcelLockerName = String(payload.parcelLockerName || "");
        }

        if (payload.parcelLockerAddress !== undefined) {
          order.delivery.parcelLockerAddress = String(payload.parcelLockerAddress || "");
        }

        if (payload.adminNote !== undefined) {
          order.delivery.adminNote = String(payload.adminNote || "");
        }

        order.updatedAt = timestamp;
        return { order };
      }
      case "return.status": {
        const returnRequest = database.returns.find(
          (item) => item.id === payload.id,
        );

        if (!returnRequest) {
          throw new Error("Return request not found.");
        }

        returnRequest.status = String(
          payload.status ?? returnRequest.status,
        ) as typeof returnRequest.status;
        returnRequest.updatedAt = timestamp;
        return { returnRequest };
      }
      case "complaint.status": {
        const complaint = database.complaints.find(
          (item) => item.id === payload.id,
        );

        if (!complaint) {
          throw new Error("Complaint not found.");
        }

        complaint.status = String(
          payload.status ?? complaint.status,
        ) as typeof complaint.status;
        complaint.updatedAt = timestamp;
        return { complaint };
      }
      case "discount.create": {
        return {
          discount: createDiscountCode(database, {
            code: String(payload.code ?? ""),
            type: (payload.type ?? "percentage") as never,
            value: Number(payload.value ?? 0),
            usageLimit:
              payload.usageLimit === null || payload.usageLimit === undefined
                ? null
                : Number(payload.usageLimit),
            startsAt: (payload.startsAt as string | null) ?? null,
            endsAt: (payload.endsAt as string | null) ?? null,
            minimumOrderValue:
              payload.minimumOrderValue === null ||
              payload.minimumOrderValue === undefined
                ? null
                : Number(payload.minimumOrderValue),
            appliesToProductIds: Array.isArray(payload.appliesToProductIds)
              ? payload.appliesToProductIds.map(String)
              : [],
            appliesToDropId: (payload.appliesToDropId as string | null) ?? null,
            isActive: Boolean(payload.isActive ?? true),
          }),
        };
      }
      default:
        throw new Error("Unknown admin action.");
    }
    });

    if (
      body.action === "order.status" &&
      "order" in result &&
      result.order?.delivery.deliveryStatus === "shipped"
    ) {
      await sendStoreEmail("order_shipped", { order: result.order });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update store backend.",
      },
      { status: 400 },
    );
  }
}
