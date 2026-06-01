import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { isAuthorizedStoreAdmin } from "@/lib/store/admin";
import { createId, nowIso } from "@/lib/store/ids";
import { createDiscountCode } from "@/lib/store/operations";
import { createDefaultStoreDatabase } from "@/lib/store/defaults";
import {
  getConfiguredStoreStorageDriver,
  readStoreDatabase,
  updateStoreDatabase,
} from "@/lib/store/storage";
import type {
  Drop,
  DropStatus,
  Product,
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

function ensureAdmin(request: NextRequest) {
  if (!isAuthorizedStoreAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function envValue(name: string) {
  return process.env[name]?.trim() ?? "";
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
          migrations.some((item) => item.migration_name === "0001_init")
            ? "pass"
            : "fail",
          migrations.length
            ? migrations.map((item) => item.migration_name).join(", ")
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
  const siteUrl = envValue("NEXT_PUBLIC_SITE_URL");
  const webhookUrl = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/api/payments/webhook/tpay`
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

  if (siteUrl) {
    try {
      const hostname = new URL(siteUrl).hostname;

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

  if (siteUrl && !siteUrl.startsWith("https://")) {
    warnings.push(
      readinessCheck(
        "webhook URL warning",
        "warn",
        "NEXT_PUBLIC_SITE_URL should be an HTTPS staging origin for Tpay webhooks.",
      ),
    );
  }

  const databaseChecks = await getDatabaseReadinessChecks(input);
  const allChecks = [...envChecks, ...databaseChecks, ...warnings];
  const ready = allChecks.every((check) => check.status === "pass");

  return {
    environment: {
      nodeEnv: runtimeEnv || null,
      vercelEnv: vercelEnv || null,
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

export async function GET(request: NextRequest) {
  const unauthorized = ensureAdmin(request);

  if (unauthorized) {
    return unauthorized;
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

  const webhookEvents =
    getConfiguredStoreStorageDriver() === "postgres" && !readError
      ? await getPrisma().paymentWebhookEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : database.processedWebhookEvents.slice(-100).reverse().map((id) => ({
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
    webhookEvents,
    returns: database.returns,
    complaints: database.complaints,
    newsletterSubscribers: database.newsletterSubscribers,
    discounts: database.discounts,
    settings: database.settings,
    diagnostics: {
      tpaySandbox: await getTpaySandboxDiagnostics({ database, readError }),
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

    return prisma.$transaction(async (tx) => {
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
        const next: ProductVariant = {
          id,
          productId: String(payload.productId ?? existing?.productId ?? ""),
          size: String(payload.size ?? existing?.size ?? "OS"),
          sku: String(payload.sku ?? existing?.sku ?? id),
          stockQuantity: Number(payload.stockQuantity ?? existing?.stockQuantity ?? 0),
          reservedQuantity: Number(
            payload.reservedQuantity ?? existing?.reservedQuantity ?? 0,
          ),
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
      case "product.image.add": {
        const image = {
          id: createId("img"),
          productId: String(payload.productId ?? ""),
          url: String(payload.url ?? ""),
          alt: String(payload.alt ?? ""),
          sortOrder: Number(payload.sortOrder ?? database.images.length),
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
        return { image };
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
        }

        if (payload.deliveryStatus) {
          order.delivery.deliveryStatus =
            payload.deliveryStatus as typeof order.delivery.deliveryStatus;
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
