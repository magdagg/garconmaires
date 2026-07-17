"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { CheckoutSummary } from "@/components/commerce/checkout-summary";
import { clientType } from "@/components/pages/client-area-typography";
import { formatPrice } from "@/lib/utils";

type CartPreviewDemoProps = {
  locale: "pl" | "en";
  delivery: number;
};

const copy = {
  pl: {
    eyebrow: "Koszyk",
    title: "Koszyk",
    body:
      "Produkty dodane z kolekcji pojawią się tutaj przed finalizacją zamówienia.",
    emptyTitle: "Koszyk",
    emptyBody: "Twój koszyk jest obecnie pusty. Produkty dodane z kolekcji pojawią się tutaj przed finalizacją zamówienia.",
    collection: "Kolekcja",
    account: "Konto",
    checkout: "Przejdź do checkoutu",
    remove: "Usuń",
    decrease: "Zmniejsz",
    increase: "Zwiększ",
    preview: "DROP 01",
    item: "Produkt",
    qty: "Ilość",
    line: "Suma",
    summary: {
      title: "Podsumowanie",
      subtotal: "Suma produktów",
      delivery: "Dostawa",
      total: "Razem",
      placeholder: "Do potwierdzenia",
    },
  },
  en: {
    eyebrow: "Cart",
    title: "Cart",
    body:
      "Pieces added from the collection will appear here before checkout.",
    emptyTitle: "Cart",
    emptyBody: "Your cart is currently empty. Pieces added from the collection will appear here before checkout.",
    collection: "Collection",
    account: "Account",
    checkout: "Continue to checkout",
    remove: "Remove",
    decrease: "Decrease",
    increase: "Increase",
    preview: "DROP 01",
    item: "Item",
    qty: "Qty",
    line: "Line total",
    summary: {
      title: "Summary",
      subtotal: "Subtotal",
      delivery: "Delivery",
      total: "Total",
      placeholder: "To be confirmed",
    },
  },
};

export function CartPreviewDemo({ locale, delivery }: CartPreviewDemoProps) {
  const t = copy[locale];
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const collectionHref = locale === "pl" ? "/kolekcja" : "/en/collection";
  const accountHref = locale === "pl" ? "/konto" : "/en/account";
  const checkoutHref = locale === "pl" ? "/checkout" : "/en/checkout";
  const hasItems = items.length > 0;

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-black">
      <section className="site-shell py-14 md:py-20">
        <nav
          className="mb-10 flex flex-wrap items-center justify-between gap-x-7 gap-y-3 border-b border-black/10 pb-5"
          aria-label="Cart navigation"
        >
          <Link
            href={collectionHref}
            className={clientType.navLight}
          >
            ← {t.collection}
          </Link>
          <Link
            href={accountHref}
            className={clientType.navLight}
          >
            {t.account} →
          </Link>
        </nav>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-10">
            <div className="border-y border-black/14 py-9 sm:py-11">
              <p className={clientType.eyebrowLight}>
                {t.eyebrow}
              </p>
              <h1 className={`mt-5 ${clientType.displayHeading}`}>
                {hasItems ? t.title : t.emptyTitle}
              </h1>
              <p className={`mt-6 max-w-xl ${clientType.bodyLight}`}>
                {hasItems ? t.body : t.emptyBody}
              </p>
            </div>

            {hasItems ? (
              <div className="space-y-2">
                <div className="hidden border-b border-black/10 pb-4 font-label text-[10px] font-medium tracking-[0.105em] text-black/48 uppercase md:grid md:grid-cols-[112px_1fr_168px]">
                  <span>{t.item}</span>
                  <span>{t.preview}</span>
                  <span className="text-right">{t.line}</span>
                </div>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-5 border-b border-black/10 py-6 md:grid-cols-[112px_1fr_168px] md:items-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.imageAlt}
                      className="aspect-[4/5] w-28 border border-black/10 bg-[#ebe6dd] object-contain p-3 md:w-full"
                    />
                    <div className="space-y-2">
                      <p className={clientType.sectionLabelLight}>
                        {t.preview}
                      </p>
                      <p className="text-lg tracking-[0.08em] text-black uppercase sm:text-xl">
                        {item.product.name}
                      </p>
                      <p className="font-label text-[10.5px] font-medium tracking-[0.105em] text-black/60 uppercase">
                        {item.size}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className={`${clientType.linkLight} pt-2`}
                      >
                        {t.remove}
                      </button>
                    </div>
                    <div className="space-y-4 md:text-right">
                      <p className="font-label text-[10px] font-medium tracking-[0.105em] text-black/50 uppercase md:hidden">
                        {t.qty}
                      </p>
                      <p className="text-sm tracking-[0.12em] text-black/72">
                        {formatPrice(item.product.price * item.quantity, locale)}
                      </p>
                      <div className="inline-flex border border-black/14">
                        <button
                          type="button"
                          aria-label={t.decrease}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-10 w-10 text-black/58 transition-colors hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                          -
                        </button>
                        <span className="flex h-10 w-12 items-center justify-center text-[13px] font-medium tracking-normal text-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={t.increase}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-10 w-10 text-black/58 transition-colors hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-3 pt-6">
                  <Link
                    href={checkoutHref}
                    className={`${clientType.ctaBase} min-h-12 border-black bg-black text-white hover:bg-transparent hover:text-black`}
                  >
                    {t.checkout}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="border-y border-black/12 bg-[#f8f6f1] px-5 py-9 sm:px-8 sm:py-10">
                <div>
                  <p className={clientType.eyebrowLight}>{t.eyebrow}</p>
                  <p className={`mt-5 max-w-md ${clientType.bodyLight}`}>
                    {t.emptyBody}
                  </p>
                </div>
              </div>
            )}
          </div>

          <CheckoutSummary
            locale={locale}
            labels={t.summary}
            subtotal={subtotal * 100}
            delivery={hasItems ? delivery : 0}
            tone="light"
          />
        </div>
      </section>
    </main>
  );
}
