import { products as staticProducts } from "@/lib/data/products";
import type {
  Drop,
  Product,
  ProductCategory,
  ProductVariant,
  StoreDatabase,
  StoreSettings,
} from "./types";

const createdAt = "2026-05-31T00:00:00.000Z";

export const defaultStoreSettings: StoreSettings = {
  storeName: "Garçonmaires",
  contactEmail: "studio@garconmaires.com",
  supportEmail: "studio@garconmaires.com",
  sellerName: "",
  sellerAddress: "",
  nip: "",
  regon: "",
  returnAddress: "",
  defaultCurrency: "PLN",
  defaultCountry: "PL",
  freeShippingThreshold: 40000,
  defaultDeliveryPrice: 1900,
  shopEnabled: false,
  maintenanceMode: false,
  shopMode: "PRE_LAUNCH",
  legalDocumentVersion: "2026-05-31",
  updatedAt: createdAt,
};

const defaultDrop: Drop = {
  id: "drop-01",
  name: "DROP 01",
  slug: "drop-01",
  status: "draft",
  launchDate: null,
  endDate: null,
  description:
    "Pierwszy drop Garçonmaires. Ukryty w backendzie do czasu uruchomienia sprzedaży.",
  isPasswordProtected: false,
  earlyAccessEnabled: false,
  createdAt,
  updatedAt: createdAt,
};

const categoryNames = Array.from(new Set(staticProducts.map((item) => item.category)));

const categories: ProductCategory[] = categoryNames.map((name) => ({
  id: `cat-${name.toLowerCase().replace(/\s+/g, "-")}`,
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  createdAt,
  updatedAt: createdAt,
}));

const backendProducts: Product[] = staticProducts.map((item) => ({
  id: item.id,
  name: item.name,
  slug: item.slug,
  shortDescription: item.tagline,
  editorialDescription: item.description,
  technicalDescription: item.details.join("\n"),
  price: item.price * 100,
  currency: "PLN",
  status: "draft",
  isVisible: false,
  isFeatured: Boolean(item.featured),
  categoryId:
    categories.find((category) => category.name === item.category)?.id ?? null,
  dropId: defaultDrop.id,
  createdAt,
  updatedAt: createdAt,
}));

const variants: ProductVariant[] = staticProducts.flatMap((product) =>
  product.sizes.map((size) => ({
    id: `${product.id}-${size.toLowerCase()}`,
    productId: product.id,
    size,
    sku: `GM-${product.id.replace("gm-", "").toUpperCase()}-${size}`,
    stockQuantity: 0,
    reservedQuantity: 0,
    isAvailable: false,
    priceOverride: null,
    createdAt,
    updatedAt: createdAt,
  })),
);

export function createDefaultStoreDatabase(): StoreDatabase {
  return {
    products: backendProducts,
    variants,
    images: [],
    categories,
    drops: [defaultDrop],
    carts: [],
    reservations: [],
    orders: [],
    payments: [],
    returns: [],
    complaints: [],
    newsletterSubscribers: [],
    discounts: [],
    settings: defaultStoreSettings,
    legalSubmissions: [],
    analyticsEvents: [],
    processedWebhookEvents: [],
  };
}
