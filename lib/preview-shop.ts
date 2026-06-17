import { products, type Product } from "@/lib/data/products";
import type { PublicProduct } from "@/lib/store/public-catalog";

export function isPreviewShopDemoEnabled() {
  if (process.env.NEXT_PUBLIC_GM_SHOP_PREVIEW_DEMO === "false") {
    return false;
  }

  if (process.env.NEXT_PUBLIC_GM_SHOP_PREVIEW_DEMO === "true") {
    return true;
  }

  return process.env.VERCEL_ENV !== "production";
}

export function getPreviewProducts() {
  return products;
}

export function getPreviewProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug) ?? null;
}

export function toPreviewPublicProduct(product: Product): PublicProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.tagline,
    editorialDescription: product.description,
    technicalDescription: product.details.join("\n"),
    seoTitle: `${product.name} | DROP 01 Preview`,
    seoDescription: product.description,
    specifications: {
      Drop: "DROP 01",
      Scope: "Garments only",
      Motif: "Front Garçonmaires logo / shared back print",
      Status: "Preview / pre-launch",
      Material: product.material,
    },
    sizeGuide: undefined,
    price: product.price * 100,
    currency: "PLN",
    categoryId: product.category,
    categoryName: product.category,
    dropId: "drop-01",
    dropName: "DROP 01 / Preview",
    variants: product.sizes.map((size) => ({
      id: `${product.id}-${size.toLowerCase()}`,
      size,
      sku: `GM-D01-${product.slug.toUpperCase()}-${size}`,
      priceOverride: null,
      isAvailable: true,
      availableStock: 99,
    })),
    images: [
      {
        id: `${product.id}-primary`,
        url: product.imageUrl,
        alt: product.imageAlt,
        sortOrder: 0,
        isPrimary: true,
      },
      {
        id: `${product.id}-back-print`,
        url: "/collection/drop-01-back-print-preview.png",
        alt: "Shared Garçonmaires DROP 01 back print motif",
        sortOrder: 1,
        isPrimary: false,
      },
    ],
  };
}
