import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { createDefaultStoreDatabase, defaultStoreSettings } from "./defaults";
import { releaseExpiredReservations } from "./inventory";
import { readPostgresStore, writePostgresStore } from "./postgres";
import type { StoreDatabase } from "./types";

const localStorePath = path.join(process.cwd(), "data", "store.json");
const blobStorePath = "store/database.json";

export type StoreStorageDriver = "local-json" | "vercel-blob" | "postgres";

export type StoreStorageAdapter = {
  driver: StoreStorageDriver;
  read: () => Promise<StoreDatabase>;
  write: (database: StoreDatabase) => Promise<StoreDatabase>;
};

function hasBlobConfig() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID),
  );
}

export function getConfiguredStoreStorageDriver(): StoreStorageDriver {
  const configured = (
    process.env.STORE_STORAGE ??
    process.env.STORE_STORAGE_DRIVER
  )?.trim();

  if (configured === "local-json" || configured === "vercel-blob" || configured === "postgres") {
    return configured;
  }

  return hasBlobConfig() ? "vercel-blob" : "local-json";
}

function assertProductionSafeDriver(driver: StoreStorageDriver) {
  if (process.env.NODE_ENV === "production" && driver !== "postgres") {
    throw new Error(
      "Production store storage must use STORE_STORAGE=postgres. JSON and Vercel Blob document storage are not production-safe for inventory, orders or payments.",
    );
  }
}

async function streamToText(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      return text;
    }

    text += decoder.decode(value, { stream: true });
  }
}

function normalizeStoreDatabase(input: Partial<StoreDatabase>): StoreDatabase {
  const fallback = createDefaultStoreDatabase();

  return {
    ...fallback,
    ...input,
    settings: {
      ...defaultStoreSettings,
      ...(input.settings ?? {}),
    },
    products: Array.isArray(input.products) ? input.products : fallback.products,
    variants: Array.isArray(input.variants) ? input.variants : fallback.variants,
    images: Array.isArray(input.images) ? input.images : [],
    categories: Array.isArray(input.categories)
      ? input.categories
      : fallback.categories,
    drops: Array.isArray(input.drops) ? input.drops : fallback.drops,
    carts: Array.isArray(input.carts) ? input.carts : [],
    reservations: Array.isArray(input.reservations) ? input.reservations : [],
    orders: Array.isArray(input.orders) ? input.orders : [],
    payments: Array.isArray(input.payments)
      ? input.payments.map((payment) => ({
          ...payment,
          provider:
            payment.provider === "payu" || payment.provider === "przelewy24"
              ? payment.provider
              : "tpay",
          providerPaymentId: payment.providerPaymentId ?? null,
          providerCustomerId: payment.providerCustomerId ?? null,
          rawProviderPayload: payment.rawProviderPayload ?? null,
          paidAt: payment.paidAt ?? null,
        }))
      : [],
    returns: Array.isArray(input.returns) ? input.returns : [],
    complaints: Array.isArray(input.complaints) ? input.complaints : [],
    newsletterSubscribers: Array.isArray(input.newsletterSubscribers)
      ? input.newsletterSubscribers
      : [],
    discounts: Array.isArray(input.discounts) ? input.discounts : [],
    legalSubmissions: Array.isArray(input.legalSubmissions)
      ? input.legalSubmissions
      : [],
    analyticsEvents: Array.isArray(input.analyticsEvents)
      ? input.analyticsEvents
      : [],
    processedWebhookEvents: Array.isArray(input.processedWebhookEvents)
      ? input.processedWebhookEvents
      : [],
  };
}

async function readLocalJsonStore() {
  try {
    const raw = await readFile(localStorePath, "utf8");
    return normalizeStoreDatabase(JSON.parse(raw) as Partial<StoreDatabase>);
  } catch {
    return createDefaultStoreDatabase();
  }
}

async function writeLocalJsonStore(database: StoreDatabase) {
  const normalized = normalizeStoreDatabase(database);

  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
}

async function readVercelBlobStore() {
  if (!hasBlobConfig()) {
    throw new Error("Missing Vercel Blob configuration for store storage.");
  }

    const result = await get(blobStorePath, { access: "private", useCache: false });

    if (result?.statusCode === 200) {
      return normalizeStoreDatabase(
        JSON.parse(await streamToText(result.stream)) as Partial<StoreDatabase>,
      );
    }

    return createDefaultStoreDatabase();
}

async function writeVercelBlobStore(database: StoreDatabase) {
  if (!hasBlobConfig()) {
    throw new Error("Missing Vercel Blob configuration for store storage.");
  }

  const normalized = normalizeStoreDatabase(database);

  await put(blobStorePath, JSON.stringify(normalized, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
  return normalized;
}

function createPostgresAdapter(): StoreStorageAdapter {
  return {
    driver: "postgres",
    read: readPostgresStore,
    write: writePostgresStore,
  };
}

export function getStoreStorageAdapter(): StoreStorageAdapter {
  const driver = getConfiguredStoreStorageDriver();

  assertProductionSafeDriver(driver);

  if (driver === "vercel-blob") {
    return {
      driver,
      read: readVercelBlobStore,
      write: writeVercelBlobStore,
    };
  }

  if (driver === "postgres") {
    return createPostgresAdapter();
  }

  return {
    driver,
    read: readLocalJsonStore,
    write: writeLocalJsonStore,
  };
}

export async function readStoreDatabase(): Promise<StoreDatabase> {
  return getStoreStorageAdapter().read();
}

export async function writeStoreDatabase(database: StoreDatabase) {
  return getStoreStorageAdapter().write(database);
}

export async function updateStoreDatabase<T>(
  updater: (database: StoreDatabase) => T | Promise<T>,
) {
  const database = await readStoreDatabase();
  releaseExpiredReservations(database);
  const result = await updater(database);

  await writeStoreDatabase(database);
  return result;
}
