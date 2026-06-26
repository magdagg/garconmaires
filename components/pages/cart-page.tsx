import Link from "next/link";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { CartRow } from "@/components/commerce/cart-row";
import { CheckoutSummary } from "@/components/commerce/checkout-summary";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { SizeSelector } from "@/components/commerce/size-selector";
import { CartPreviewDemo } from "@/components/pages/cart-preview-demo";
import type { CartCheckoutGateState } from "@/lib/store/cart-checkout-gate";

type CartPageProps = {
  locale: "pl" | "en";
  gate: CartCheckoutGateState;
  previewDemo?: boolean;
};

const copy = {
  pl: {
    eyebrow: "Koszyk",
    title: "Sklep nie jest jeszcze aktywny",
    body:
      "DROP 01 pozostaje w trybie pre-launch. Koszyk jest przygotowany technicznie, ale publiczne dodawanie produktów i płatności są zablokowane.",
    emptyTitle: "Koszyk",
    emptyBody: "Dodane produkty pojawią się tutaj po uruchomieniu sprzedaży.",
    sampleName: "Garçonmaires DROP 01",
    sampleSize: "ONE SIZE",
    size: "Rozmiar",
    quantity: "Ilość",
    add: "Dodaj do koszyka",
    disabledAdd: "Dostępne po premierze",
    remove: "Usuń",
    clear: "Wyczyść koszyk",
    continue: "Przejdź do checkoutu",
    collection: "Wróć do kolekcji",
    delivery: "Dostawa zostanie potwierdzona w checkout.",
    locked: "Pre-launch / checkout locked",
    summary: {
      title: "Podsumowanie",
      subtotal: "Suma produktów",
      delivery: "Dostawa",
      total: "Razem",
      placeholder: "Do wyliczenia",
    },
  },
  en: {
    eyebrow: "Cart",
    title: "The shop is not active yet",
    body:
      "DROP 01 remains in pre-launch mode. The cart is technically prepared, but public product adds and payments are blocked.",
    emptyTitle: "Cart",
    emptyBody: "Added pieces will appear here once sales open.",
    sampleName: "Garçonmaires DROP 01",
    sampleSize: "ONE SIZE",
    size: "Size",
    quantity: "Quantity",
    add: "Add to cart",
    disabledAdd: "Available at launch",
    remove: "Remove",
    clear: "Clear cart",
    continue: "Continue checkout",
    collection: "Back to collection",
    delivery: "Delivery will be confirmed at checkout.",
    locked: "Pre-launch / checkout locked",
    summary: {
      title: "Summary",
      subtotal: "Subtotal",
      delivery: "Delivery",
      total: "Total",
      placeholder: "Calculated later",
    },
  },
};

export function CartPage({ locale, gate, previewDemo = false }: CartPageProps) {
  if (previewDemo && !gate.storefrontLive) {
    return (
      <CartPreviewDemo
        locale={locale}
        delivery={gate.defaultDeliveryPrice}
      />
    );
  }

  const t = copy[locale];
  const collectionHref = locale === "pl" ? "/kolekcja" : "/en/collection";
  const checkoutHref = locale === "pl" ? "/checkout" : "/en/checkout";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="site-shell px-4 py-14 md:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8">
            <div className="space-y-4 border-b border-white/10 pb-8">
              <p className="font-label text-[10px] tracking-[0.32em] text-white/35 uppercase">
                {t.eyebrow}
              </p>
              <h1 className="font-display text-5xl leading-none sm:text-6xl">
                {gate.storefrontLive ? t.emptyTitle : t.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/58">
                {gate.storefrontLive ? t.emptyBody : t.body}
              </p>
            </div>

            {gate.storefrontLive ? (
              <div className="space-y-6">
                <CartRow
                  locale={locale}
                  name={t.sampleName}
                  size={t.sampleSize}
                  quantity={1}
                  unitPrice={0}
                  removeLabel={t.remove}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={checkoutHref}
                    className="bg-white px-6 py-4 text-xs tracking-[0.24em] text-black uppercase"
                  >
                    {t.continue}
                  </Link>
                  <button
                    type="button"
                    className="border border-white/12 px-6 py-4 text-xs tracking-[0.24em] text-white/45 uppercase"
                  >
                    {t.clear}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-10 border-y border-white/10 py-8 md:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-6">
                  <p className="font-label text-[10px] uppercase tracking-[0.24em] text-white/30">
                    {t.locked}
                  </p>
                  <SizeSelector label={t.size} sizes={["S", "M", "L", "XL", "ONE SIZE"]} disabled />
                  <QuantitySelector label={t.quantity} disabled />
                  <AddToCartButton label={t.add} disabledLabel={t.disabledAdd} disabled />
                  <p className="text-xs leading-6 text-white/42">{t.delivery}</p>
                </div>
                <div className="border-t border-white/10 pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                  <p className="text-sm leading-7 text-white/58">
                    {gate.shopMode === "PRE_LAUNCH" ? "DROP 01 coming soon" : t.emptyBody}
                  </p>
                  <Link
                    href={collectionHref}
                    className="mt-6 inline-flex border-b border-white/28 pb-2 text-xs tracking-[0.22em] text-white/60 uppercase transition-colors hover:border-white hover:text-white"
                  >
                    {t.collection}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <CheckoutSummary locale={locale} labels={t.summary} />
        </div>
      </section>
    </main>
  );
}
