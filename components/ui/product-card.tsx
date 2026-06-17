import Link from "next/link";
import type { Product } from "@/lib/data/products";
import { getProductCopy, type Locale } from "@/lib/i18n";
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
  const href =
    locale === "pl" ? `/produkt/${product.slug}` : `/en/product/${product.slug}`;
  const status = locale === "pl" ? "Preview / pre-launch" : "Preview / pre-launch";
  const priceLabel = locale === "pl" ? "Cena testowa" : "Preview price";

  return (
    <Link href={href} className="group block">
      <div className="overflow-hidden border border-transparent group-hover:border-white/10">
        <ProductMedia product={product} />
      </div>
      <div className="mt-5 space-y-3">
        <div className="flex items-start justify-between gap-6">
          <p className="text-[10px] tracking-[0.28em] text-white/35 uppercase">
            {productCopy.category}
          </p>
          <div className="text-right">
            <p className="font-label text-[9px] tracking-[0.22em] text-white/30 uppercase">
              {priceLabel}
            </p>
            <p className="mt-1 text-sm tracking-[0.14em] text-white/68">
              {formatPrice(product.price, locale)}
            </p>
          </div>
        </div>
        <h3 className="text-lg tracking-[0.04em] text-white group-hover:text-white/76">
          {product.name}
        </h3>
        <p className="max-w-xs text-sm leading-6 text-white/46">
          {productCopy.tagline}
        </p>
        <p className="font-label text-[9px] tracking-[0.22em] text-white/28 uppercase">
          {status}
        </p>
      </div>
    </Link>
  );
}
