import type {
  Product,
  ProductImage,
  ProductVariant,
  StoreDatabase,
} from "./types";

export type ProductAdminWarning = {
  code: string;
  message: string;
  severity: "warn" | "critical";
};

const placeholderPattern = /POTWIERDZIĆ|placeholder|to confirm/i;

export function duplicateSkuValues(variants: ProductVariant[]) {
  const counts = new Map<string, number>();

  for (const variant of variants) {
    const sku = variant.sku.trim();

    if (!sku) {
      continue;
    }

    counts.set(sku, (counts.get(sku) ?? 0) + 1);
  }

  return Array.from(counts)
    .filter(([, count]) => count > 1)
    .map(([sku]) => sku);
}

export function getProductAdminWarnings(input: {
  product: Product;
  variants: ProductVariant[];
  images: ProductImage[];
  shopEnabled: boolean;
  shopMode: string;
}) {
  const warnings: ProductAdminWarning[] = [];
  const hasStock = input.variants.some((variant) => variant.stockQuantity > 0);

  if (input.product.isVisible && input.shopMode === "PRE_LAUNCH") {
    warnings.push({
      code: "visible_prelaunch",
      severity: "critical",
      message: "Product is visible while shopMode=PRE_LAUNCH.",
    });
  }

  if (input.product.status === "active" && !input.shopEnabled) {
    warnings.push({
      code: "active_shop_disabled",
      severity: "warn",
      message: "Product is active while shopEnabled=false.",
    });
  }

  if (hasStock && !input.product.isVisible) {
    warnings.push({
      code: "stock_hidden",
      severity: "warn",
      message: "Product has stock but is hidden.",
    });
  }

  if (input.images.length === 0) {
    warnings.push({
      code: "missing_images",
      severity: "warn",
      message: "Product has no images.",
    });
  }

  const specText = [
    input.product.technicalDescription,
    ...Object.values(input.product.specifications ?? {}),
  ].join("\n");

  if (placeholderPattern.test(specText)) {
    warnings.push({
      code: "placeholder_specs",
      severity: "warn",
      message: "Product still has material/care/spec placeholders to confirm before launch.",
    });
  }

  for (const sku of duplicateSkuValues(input.variants)) {
    warnings.push({
      code: "duplicate_sku",
      severity: "critical",
      message: `Duplicate SKU: ${sku}.`,
    });
  }

  for (const variant of input.variants) {
    if (variant.stockQuantity < 0) {
      warnings.push({
        code: "negative_stock",
        severity: "critical",
        message: `${variant.sku} has negative stock.`,
      });
    }

    if (variant.reservedQuantity > variant.stockQuantity) {
      warnings.push({
        code: "reserved_exceeds_stock",
        severity: "critical",
        message: `${variant.sku} has reservedQuantity above stockQuantity.`,
      });
    }
  }

  return warnings;
}

export function assertVariantStockIsSafe(input: {
  stockQuantity: number;
  reservedQuantity: number;
  sku: string;
}) {
  if (input.stockQuantity < 0) {
    throw new Error(`Stock cannot be negative for ${input.sku}.`);
  }

  if (input.reservedQuantity > input.stockQuantity) {
    throw new Error(
      `Stock cannot be lower than reservedQuantity for ${input.sku}.`,
    );
  }
}

export function setPrimaryProductImage(
  database: StoreDatabase,
  imageId: string,
) {
  const image = database.images.find((item) => item.id === imageId);

  if (!image) {
    throw new Error("Image not found.");
  }

  for (const current of database.images) {
    if (current.productId === image.productId) {
      current.isPrimary = current.id === imageId;
    }
  }

  return image;
}

export function normalizeProductImageOrder(database: StoreDatabase, productId: string) {
  database.images
    .filter((image) => image.productId === productId)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((image, index) => {
      image.sortOrder = index;
    });
}
