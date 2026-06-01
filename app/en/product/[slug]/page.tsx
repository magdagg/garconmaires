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
      description: "Product pages will be available once the first drop is released.",
    };
  }

  const productCopy = getProductCopy(product, "en");

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
      locale="en"
    />
  );
}
