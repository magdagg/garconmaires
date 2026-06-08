import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
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

  if (!product) {
    return {
      title: "Garçonmaires",
      description: "Product pages will be available once the first drop is released.",
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
      canonical: `https://garconmaires.com/en/product/${product.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription,
      url: `https://garconmaires.com/en/product/${product.slug}`,
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
  const product = await getPublicProductBySlug(slug);
  const catalog = await getPublicCatalogState();

  if (!product) {
    notFound();
  }

  return (
    <ProductDetail
      product={product}
      locale="en"
      storefrontLive={catalog.storefrontLive}
    />
  );
}
