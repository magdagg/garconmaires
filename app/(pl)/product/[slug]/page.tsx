import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { getProductCopy } from "@/lib/i18n";
import { getProductBySlug, getRelatedProducts, products } from "@/lib/data/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Garçonmaires",
      description:
        "Karty produktów zostaną udostępnione po premierze pierwszego dropu.",
    };
  }

  const productCopy = getProductCopy(product, "pl");

  return {
    title: product.name,
    description: productCopy.description,
  };
}

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetail
      product={product}
      relatedProducts={getRelatedProducts(product)}
      locale="pl"
    />
  );
}
