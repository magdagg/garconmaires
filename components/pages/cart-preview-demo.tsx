"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { CheckoutSummary } from "@/components/commerce/checkout-summary";
import { formatPrice } from "@/lib/utils";

type CartPreviewDemoProps = {
  locale: "pl" | "en";
  delivery: number;
};

const copy = {
  pl: {
    eyebrow: "Koszyk preview",
    title: "Koszyk działa w trybie testowym",
    body:
      "To lokalny/staging flow dla DROP 01. Pozycje są zapisywane w tej przeglądarce i nie uruchamiają publicznej sprzedaży.",
    emptyTitle: "Koszyk jest pusty",
    emptyBody: "Dodaj Hoodie, T-shirt albo Zip hoodie z kolekcji, żeby zobaczyć flow.",
    collection: "Wróć do kolekcji",
    checkout: "Przejdź do checkout preview",
    remove: "Usuń",
    decrease: "Zmniejsz",
    increase: "Zwiększ",
    preview: "Preview / pre-launch",
    summary: {
      title: "Podsumowanie preview",
      subtotal: "Suma produktów",
      delivery: "Dostawa testowa",
      total: "Razem testowo",
      placeholder: "Do potwierdzenia",
    },
  },
  en: {
    eyebrow: "Preview cart",
    title: "The cart works in test mode",
    body:
      "This is a local/staging flow for DROP 01. Items are stored in this browser and do not open public sales.",
    emptyTitle: "Your cart is empty",
    emptyBody: "Add Hoodie, T-shirt, or Zip hoodie from the collection to see the flow.",
    collection: "Back to collection",
    checkout: "Continue to checkout preview",
    remove: "Remove",
    decrease: "Decrease",
    increase: "Increase",
    preview: "Preview / pre-launch",
    summary: {
      title: "Preview summary",
      subtotal: "Subtotal",
      delivery: "Test delivery",
      total: "Preview total",
      placeholder: "To be confirmed",
    },
  },
};

export function CartPreviewDemo({ locale, delivery }: CartPreviewDemoProps) {
  const t = copy[locale];
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const collectionHref = locale === "pl" ? "/kolekcja" : "/en/collection";
  const checkoutHref = locale === "pl" ? "/checkout" : "/en/checkout";
  const hasItems = items.length > 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="site-shell px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            <div className="space-y-4 border-b border-white/10 pb-8">
              <p className="font-label text-[10px] tracking-[0.32em] text-white/35 uppercase">
                {t.eyebrow}
              </p>
              <h1 className="font-display text-5xl leading-none sm:text-6xl">
                {hasItems ? t.title : t.emptyTitle}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/58">
                {hasItems ? t.body : t.emptyBody}
              </p>
            </div>

            {hasItems ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-5 border-b border-white/10 py-5 md:grid-cols-[120px_1fr_150px] md:items-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.imageAlt}
                      className="aspect-[4/5] w-full bg-white/[0.03] object-contain p-3"
                    />
                    <div className="space-y-2">
                      <p className="font-label text-[10px] tracking-[0.24em] text-white/34 uppercase">
                        {t.preview}
                      </p>
                      <p className="text-lg tracking-[0.08em] text-white uppercase">
                        {item.product.name}
                      </p>
                      <p className="text-xs tracking-[0.18em] text-white/42 uppercase">
                        {item.size}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-xs tracking-[0.16em] text-white/36 uppercase hover:text-white/70"
                      >
                        {t.remove}
                      </button>
                    </div>
                    <div className="space-y-4 md:text-right">
                      <p className="text-sm tracking-[0.12em] text-white/72">
                        {formatPrice(item.product.price * item.quantity, locale)}
                      </p>
                      <div className="inline-flex border border-white/12">
                        <button
                          type="button"
                          aria-label={t.decrease}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-10 w-10 text-white/58 hover:bg-white hover:text-black"
                        >
                          -
                        </button>
                        <span className="flex h-10 w-12 items-center justify-center text-xs tracking-[0.2em] text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={t.increase}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-10 w-10 text-white/58 hover:bg-white hover:text-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href={checkoutHref}
                    className="bg-white px-6 py-4 text-xs tracking-[0.24em] text-black uppercase hover:bg-white/90"
                  >
                    {t.checkout}
                  </Link>
                  <Link
                    href={collectionHref}
                    className="border border-white/12 px-6 py-4 text-xs tracking-[0.24em] text-white/58 uppercase hover:border-white/36"
                  >
                    {t.collection}
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href={collectionHref}
                className="inline-flex border border-white/12 px-6 py-4 text-xs tracking-[0.24em] text-white/62 uppercase hover:border-white/36"
              >
                {t.collection}
              </Link>
            )}
          </div>

          <CheckoutSummary
            locale={locale}
            labels={t.summary}
            subtotal={subtotal * 100}
            delivery={hasItems ? delivery : 0}
          />
        </div>
      </section>
    </main>
  );
}
