"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckoutButton } from "@/components/commerce/checkout-button";
import { useCart } from "@/components/providers/cart-provider";
import { ProductMedia } from "@/components/ui/product-media";
import { formatPrice } from "@/lib/utils";
import { copy, getProductCopy, withLocalePath, type Locale } from "@/lib/i18n";

export function CartPage({ locale }: { locale: Locale }) {
  const { items, subtotal, updateQuantity, removeItem, checkoutItems } =
    useCart();
  const t = copy[locale].cart;
  const [isCanceled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("checkout") === "canceled";
  });

  return (
    <div className="site-shell px-4 py-14 md:px-6 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs tracking-[0.34em] text-white/38 uppercase">
            {t.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none sm:text-7xl">
            {t.title}
          </h1>

          {isCanceled ? (
            <div className="mt-6 border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-7 text-white/62">
              {t.canceled}
            </div>
          ) : null}

          <div className="mt-10 space-y-6">
            {items.length === 0 ? (
              <div className="border border-white/10 bg-white/[0.03] p-8">
                <p className="font-display text-3xl">{t.emptyTitle}</p>
                <p className="mt-4 max-w-lg text-sm leading-7 text-white/60">
                  {t.emptyBody}
                </p>
                <Link
                  href={withLocalePath("/shop", locale)}
                  className="mt-6 inline-flex border border-white/18 px-5 py-3 text-xs tracking-[0.28em] uppercase text-white hover:bg-white hover:text-black"
                >
                  {t.continueShopping}
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const productCopy = getProductCopy(item.product, locale);

                return (
                  <div
                    key={item.id}
                    className="grid gap-5 border-b border-white/10 pb-6 sm:grid-cols-[160px_1fr]"
                  >
                    <ProductMedia product={item.product} compact />
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs tracking-[0.28em] text-white/34 uppercase">
                            {productCopy.category}
                          </p>
                          <h2 className="mt-2 text-xl text-white">
                            {item.product.name}
                          </h2>
                          <p className="mt-2 text-xs tracking-[0.2em] text-white/50 uppercase">
                            {t.size} {item.size}
                          </p>
                        </div>
                        <p className="text-sm tracking-[0.14em] text-white/76">
                          {formatPrice(item.product.price * item.quantity, locale)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center border border-white/12">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-4 py-3 hover:bg-white hover:text-black"
                          >
                            -
                          </button>
                          <span className="min-w-14 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-4 py-3 hover:bg-white hover:text-black"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xs tracking-[0.24em] text-white/40 uppercase hover:text-white"
                        >
                          {t.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <aside className="h-fit border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-24">
          <p className="text-xs tracking-[0.34em] text-white/38 uppercase">
            {t.summary}
          </p>
          <div className="mt-8 space-y-4 border-b border-white/10 pb-6 text-sm text-white/66">
            <div className="flex items-center justify-between">
              <span>{t.subtotal}</span>
              <span className="text-white">{formatPrice(subtotal, locale)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t.shipping}</span>
              <span>{t.shippingAtCheckout}</span>
            </div>
          </div>
          <CheckoutButton
            items={checkoutItems}
            locale={locale}
            label={t.checkout}
            className="mt-6 w-full bg-white px-6 py-4 text-xs tracking-[0.28em] uppercase text-black hover:opacity-85"
          />
          <p className="mt-4 text-sm leading-7 text-white/46">
            {t.paymentsNote}
          </p>
        </aside>
      </div>
    </div>
  );
}
