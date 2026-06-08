import { sandboxProductId } from "./draft-products";
import { getAvailableStock } from "./inventory";
import { readStoreDatabase } from "./storage";
import type {
  DeliveryMethodSetting,
  Product,
  ProductImage,
  ProductVariant,
  StoreDatabase,
} from "./types";

export type PublicProductVariant = {
  id: string;
  size: string;
  sku: string;
  priceOverride: number | null;
  isAvailable: boolean;
  availableStock: number;
};

export type PublicProductImage = {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  editorialDescription: string;
  technicalDescription: string;
  seoTitle: string;
  seoDescription: string;
  specifications: Record<string, string>;
  sizeGuide: Product["sizeGuide"];
  price: number;
  currency: "PLN";
  categoryId: string | null;
  categoryName: string | null;
  dropId: string | null;
  dropName: string | null;
  variants: PublicProductVariant[];
  images: PublicProductImage[];
};

export type PublicCatalogState = {
  storefrontLive: boolean;
  shopEnabled: boolean;
  shopMode: string;
  liveDropIds: string[];
  products: PublicProduct[];
  deliveryMethods: DeliveryMethodSetting[];
};

export function isStorefrontLive(database: StoreDatabase) {
  return (
    database.settings.shopEnabled &&
    database.settings.shopMode === "PUBLIC_DROP" &&
    database.drops.some((drop) => drop.status === "live")
  );
}

export function isPublicProductCandidate(
  database: StoreDatabase,
  product: Product,
) {
  if (product.id === sandboxProductId) {
    return false;
  }

  if (product.status !== "active" || !product.isVisible) {
    return false;
  }

  if (!product.dropId) {
    return false;
  }

  return database.drops.some(
    (drop) => drop.id === product.dropId && drop.status === "live",
  );
}

function publicImages(images: ProductImage[]) {
  return images
    .map((image): PublicProductImage => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function publicVariants(variants: ProductVariant[]) {
  return variants.map((variant): PublicProductVariant => ({
    id: variant.id,
    size: variant.size,
    sku: variant.sku,
    priceOverride: variant.priceOverride ?? null,
    isAvailable: variant.isAvailable && getAvailableStock(variant) > 0,
    availableStock: getAvailableStock(variant),
  }));
}

export function toPublicProduct(database: StoreDatabase, product: Product) {
  const category = database.categories.find((item) => item.id === product.categoryId);
  const drop = database.drops.find((item) => item.id === product.dropId);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    editorialDescription: product.editorialDescription,
    technicalDescription: product.technicalDescription,
    seoTitle: product.seoTitle ?? product.name,
    seoDescription: product.seoDescription ?? product.shortDescription,
    specifications: product.specifications ?? {},
    sizeGuide: product.sizeGuide,
    price: product.price,
    currency: "PLN" as const,
    categoryId: product.categoryId,
    categoryName: category?.name ?? null,
    dropId: product.dropId,
    dropName: drop?.name ?? null,
    variants: publicVariants(
      database.variants.filter((variant) => variant.productId === product.id),
    ),
    images: publicImages(
      database.images.filter((image) => image.productId === product.id),
    ),
  };
}

export function getPublicCatalogStateFromDatabase(database: StoreDatabase) {
  const storefrontLive = isStorefrontLive(database);
  const liveDropIds = database.drops
    .filter((drop) => drop.status === "live")
    .map((drop) => drop.id);
  const products = storefrontLive
    ? database.products
        .filter((product) => isPublicProductCandidate(database, product))
        .map((product) => toPublicProduct(database, product))
    : [];

  return {
    storefrontLive,
    shopEnabled: database.settings.shopEnabled,
    shopMode: database.settings.shopMode,
    liveDropIds,
    products,
    deliveryMethods: database.settings.deliveryMethods.filter(
      (method) => method.enabled,
    ),
  };
}

export async function getPublicCatalogState() {
  return getPublicCatalogStateFromDatabase(await readStoreDatabase());
}

export async function getPublicProductBySlug(slug: string) {
  const database = await readStoreDatabase();
  const catalog = getPublicCatalogStateFromDatabase(database);

  if (!catalog.storefrontLive) {
    return null;
  }

  return catalog.products.find((product) => product.slug === slug) ?? null;
}
