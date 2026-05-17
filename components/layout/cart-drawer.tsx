"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckoutButton } from "@/components/commerce/checkout-button";
import { useCart } from "@/components/providers/cart-provider";
import { copy, getLocaleFromPathname, getProductCopy, withLocalePath } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import { ProductMedia } from "@/components/ui/product-media";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    subtotal,
    updateQuantity,
    removeItem,
    checkoutItems,
  } = useCart();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = copy[locale].cart;
  const nav = copy[locale].nav;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeCart}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-black px-5 py-5 shadow-2xl",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-xs tracking-[0.28em] text-white/40 uppercase">
              {t.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl text-white">
              {t.drawerTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="text-sm tracking-[0.24em] uppercase text-white/60 hover:text-white"
          >
            {nav.close}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5">
          {items.length === 0 ? (
            <div className="space-y-4 border border-white/10 bg-white/3 p-6">
              <p className="font-display text-2xl">{t.emptyTitle}</p>
              <p className="text-sm leading-7 text-white/60">
                {t.drawerEmptyBody}
              </p>
              <Link
                href={withLocalePath("/shop", locale)}
                onClick={closeCart}
                className="inline-flex border border-white/20 px-5 py-3 text-xs tracking-[0.24em] uppercase text-white hover:bg-white hover:text-black"
              >
                {t.drawerExplore}
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => {
                const productCopy = getProductCopy(item.product, locale);

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[110px_1fr] gap-4 border-b border-white/8 pb-5"
                  >
                    <ProductMedia product={item.product} compact />
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs tracking-[0.22em] text-white/40 uppercase">
                          {productCopy.category}
                        </p>
                        <p className="mt-2 text-sm tracking-[0.06em] text-white">
                          {item.product.name}
                        </p>
                        <p className="mt-2 text-xs tracking-[0.18em] text-white/50 uppercase">
                          {t.size} {item.size}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-white/72">
                        <div className="flex items-center border border-white/10">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 hover:bg-white hover:text-black"
                          >
                            -
                          </button>
                          <span className="px-3">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2 hover:bg-white hover:text-black"
                          >
                            +
                          </button>
                        </div>
                        <span>{formatPrice(item.product.price * item.quantity, locale)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-fit text-xs tracking-[0.22em] text-white/40 uppercase hover:text-white"
                      >
                        {t.remove}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 pt-5">
          <div className="mb-5 flex items-center justify-between text-sm tracking-[0.18em] uppercase text-white/60">
            <span>{t.subtotal}</span>
            <span className="text-white">{formatPrice(subtotal, locale)}</span>
          </div>
          <div className="flex gap-3">
            <Link
              href={withLocalePath("/cart", locale)}
              onClick={closeCart}
              className="flex-1 border border-white/16 px-4 py-3 text-center text-xs tracking-[0.24em] uppercase text-white hover:bg-white hover:text-black"
            >
              {t.viewCart}
            </Link>
            <CheckoutButton
              items={checkoutItems}
              locale={locale}
              label={t.checkout}
              onBeforeRedirect={closeCart}
              className="flex-1 bg-white px-4 py-3 text-xs tracking-[0.24em] uppercase text-black"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
