import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getPreviewProductBySlug,
  isPreviewShopDemoEnabled,
} from "@/lib/preview-shop";
import { getPublicProductBySlug } from "@/lib/store/public-catalog";

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
  const previewProduct = isPreviewShopDemoEnabled()
    ? getPreviewProductBySlug(slug)
    : null;

  if (!product && !previewProduct) {
    notFound();
  }

  if (previewProduct) {
    redirect(`/produkt/${previewProduct.slug}`);
  }

  if (!product) {
    notFound();
  }

  redirect(`/produkt/${product.slug}`);
}
