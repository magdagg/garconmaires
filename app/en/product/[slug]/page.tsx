import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import {
  getProductBySlug,
  getRelatedProducts,
  products,
} from "@/lib/data/products";
import { getProductCopy } from "@/lib/i18n";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: getProductCopy(product, "en").description,
  };
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
