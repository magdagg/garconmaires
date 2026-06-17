import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import {
  getPreviewProductBySlug,
  isPreviewShopDemoEnabled,
  toPreviewPublicProduct,
} from "@/lib/preview-shop";
import {
  getPublicCatalogState,
  getPublicProductBySlug,
} from "@/lib/store/public-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  const previewProduct = isPreviewShopDemoEnabled()
    ? getPreviewProductBySlug(slug)
    : null;

  if (!product && !previewProduct) {
    return {
      title: "Garçonmaires",
      description:
        "Karty produktów zostaną udostępnione po premierze pierwszego dropu.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  if (previewProduct) {
    return {
      title: `${previewProduct.name} | DROP 01 Preview`,
      description: previewProduct.description,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  if (!product) {
    return {
      title: "Garçonmaires",
      description:
        "Karty produktów zostaną udostępnione po premierze pierwszego dropu.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.shortDescription,
    alternates: {
      canonical: `https://garconmaires.com/produkt/${product.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription,
      url: `https://garconmaires.com/produkt/${product.slug}`,
      images: product.images[0]
        ? [{ url: product.images[0].url, alt: product.images[0].alt }]
        : undefined,
    },
  };
}

export async function generateStaticParams() {
  return [];
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const previewProduct = isPreviewShopDemoEnabled()
    ? getPreviewProductBySlug(slug)
    : null;
  const product = previewProduct
    ? toPreviewPublicProduct(previewProduct)
    : await getPublicProductBySlug(slug);
  const catalog = await getPublicCatalogState();

  if (!product) {
    notFound();
  }

  return (
    <ProductDetail
      product={product}
      demoProduct={previewProduct}
      locale="pl"
      storefrontLive={catalog.storefrontLive}
    />
  );
}
