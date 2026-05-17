import { getProductBySlug, products } from "@/lib/data/products";

export const storeConfig = {
  market: "PL",
  currency: "pln",
  locale: "pl",
  countryName: "Poland",
} as const;

export type CheckoutItemInput = {
  productId: string;
  size: string;
  quantity: number;
};

export type CheckoutProduct = {
  productId: string;
  size: string;
  quantity: number;
  product: (typeof products)[number];
};

export function getProductById(productId: string) {
  return products.find((product) => product.id === productId);
}

export function resolveCheckoutItems(items: CheckoutItemInput[]) {
  return items.reduce<CheckoutProduct[]>((resolved, item) => {
    const product = getProductById(item.productId);

    if (!product) {
      return resolved;
    }

    const quantity = Number.isFinite(item.quantity)
      ? Math.max(1, Math.min(10, Math.floor(item.quantity)))
      : 1;

    const size = product.sizes.includes(item.size) ? item.size : product.sizes[0];

    resolved.push({
      product,
      productId: product.id,
      quantity,
      size,
    });

    return resolved;
  }, []);
}

export function getCanonicalBaseUrl(origin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  return "http://localhost:3001";
}

export function getRelatedProductPath(slug: string) {
  return getProductBySlug(slug) ? `/product/${slug}` : "/shop";
}
