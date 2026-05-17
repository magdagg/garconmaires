"use client";

import { useState } from "react";
import { CheckoutButton } from "@/components/commerce/checkout-button";
import type { Product } from "@/lib/data/products";
import { copy, getProductCopy, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import { ProductMedia } from "@/components/ui/product-media";
import { ProductCard } from "@/components/ui/product-card";
import { useCart } from "@/components/providers/cart-provider";

type ProductDetailProps = {
  product: Product;
  relatedProducts: Product[];
  locale?: Locale;
};

export function ProductDetail({
  product,
  relatedProducts,
  locale = "pl",
}: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const t = copy[locale].product;
  const productCopy = getProductCopy(product, locale);

  return (
    <div className="site-shell px-4 py-14 md:px-6 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <ProductMedia product={product} label="Front View" />
          <div className="grid gap-4">
            <ProductMedia product={product} label="Material Study" />
            <ProductMedia product={product} label="Detail Crop" />
          </div>
        </div>

        <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 border-b border-white/10 pb-8">
            <p className="text-xs tracking-[0.34em] text-white/36 uppercase">
              {productCopy.category}
            </p>
            <h1 className="font-display text-5xl leading-none sm:text-6xl">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-lg tracking-[0.14em] text-white/76">
                {formatPrice(product.price, locale)}
              </p>
              <span className="border border-white/10 px-3 py-1 text-[10px] tracking-[0.28em] text-white/42 uppercase">
                {t.limitedRelease}
              </span>
            </div>
            <p className="max-w-xl text-sm leading-8 text-white/62 sm:text-base">
              {productCopy.description}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-3 text-xs tracking-[0.28em] text-white/36 uppercase">
                {t.selectSize}
              </p>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={
                      selectedSize === size
                        ? "border border-white bg-white px-4 py-3 text-xs tracking-[0.24em] uppercase text-black"
                        : "border border-white/12 px-4 py-3 text-xs tracking-[0.24em] uppercase text-white hover:border-white"
                    }
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs tracking-[0.28em] text-white/36 uppercase">
                {t.quantity}
              </p>
              <div className="flex w-fit items-center border border-white/12">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="px-4 py-3 text-white hover:bg-white hover:text-black"
                >
                  -
                </button>
                <span className="min-w-14 text-center text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => value + 1)}
                  className="px-4 py-3 text-white hover:bg-white hover:text-black"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => addItem(product, selectedSize, quantity)}
                className="flex-1 bg-white px-6 py-4 text-xs tracking-[0.28em] uppercase text-black hover:opacity-85"
              >
                {t.addToCart}
              </button>
              <CheckoutButton
                items={[
                  {
                    productId: product.id,
                    size: selectedSize,
                    quantity,
                  },
                ]}
                locale={locale}
                label={t.buyNow}
                className="flex-1 border border-white/12 px-6 py-4 text-xs tracking-[0.28em] uppercase text-white hover:bg-white hover:text-black"
              />
            </div>
          </div>

          <div className="grid gap-px bg-white/8">
            <div className="bg-black p-5">
              <p className="text-xs tracking-[0.28em] text-white/36 uppercase">
                {t.materials}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                {productCopy.material}
              </p>
            </div>
            <div className="bg-black p-5">
              <p className="text-xs tracking-[0.28em] text-white/36 uppercase">
                {t.details}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-white/70">
                {productCopy.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
            <div className="bg-black p-5">
              <p className="text-xs tracking-[0.28em] text-white/36 uppercase">
                {t.service}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                {t.serviceBody}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-24 border-t border-white/10 pt-16">
        <div className="mb-12 max-w-2xl space-y-4">
          <p className="text-xs tracking-[0.34em] text-white/36 uppercase">
            {t.relatedEyebrow}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl">{t.relatedTitle}</h2>
        </div>
        <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-4">
          {relatedProducts.map((item) => (
            <ProductCard key={item.id} product={item} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
