import Link from "next/link";
import type { Product } from "@/lib/data/products";
import { getProductCopy, withLocalePath, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import { ProductMedia } from "@/components/ui/product-media";

export function ProductCard({
  product,
  locale = "pl",
}: {
  product: Product;
  locale?: Locale;
}) {
  const productCopy = getProductCopy(product, locale);

  return (
    <Link href={withLocalePath(`/product/${product.slug}`, locale)} className="group block">
      <div className="overflow-hidden border border-transparent group-hover:border-white/10">
        <ProductMedia product={product} />
      </div>
      <div className="mt-5 space-y-3">
        <div className="flex items-start justify-between gap-6">
          <p className="text-[10px] tracking-[0.28em] text-white/35 uppercase">
            {productCopy.category}
          </p>
          <p className="text-sm tracking-[0.14em] text-white/68">
            {formatPrice(product.price, locale)}
          </p>
        </div>
        <h3 className="text-lg tracking-[0.04em] text-white group-hover:text-white/76">
          {product.name}
        </h3>
        <p className="max-w-xs text-sm leading-6 text-white/46">
          {productCopy.tagline}
        </p>
      </div>
    </Link>
  );
}
