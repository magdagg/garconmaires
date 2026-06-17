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
  const status = "DROP 01 / Preview";
  const priceLabel = locale === "pl" ? "Cena testowa" : "Preview price";
  const sizesLabel = locale === "pl" ? "Rozmiary" : "Sizes";
  const actionLabel = locale === "pl" ? "Zobacz produkt" : "View piece";

  return (
    <Link
      href={href}
      className="group block border border-white/8 bg-black transition duration-300 hover:border-white/22"
    >
      <div className="overflow-hidden">
        <ProductMedia product={product} />
      </div>
      <div className="space-y-5 px-5 pt-5 pb-6">
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
        <div className="grid gap-3 border-t border-white/8 pt-4">
          <div className="flex items-center justify-between gap-4">
            <p className="font-label text-[9px] tracking-[0.22em] text-white/28 uppercase">
              {sizesLabel}
            </p>
            <p className="text-right text-[11px] tracking-[0.2em] text-white/48 uppercase">
              {product.sizes.join(" / ")}
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="font-label text-[9px] tracking-[0.22em] text-white/28 uppercase">
              {status}
            </p>
            <p className="text-[10px] tracking-[0.2em] text-white/48 uppercase transition group-hover:text-white/80">
              {actionLabel}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
