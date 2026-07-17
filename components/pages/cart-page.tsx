import Link from "next/link";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { CartRow } from "@/components/commerce/cart-row";
import { CheckoutSummary } from "@/components/commerce/checkout-summary";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { SizeSelector } from "@/components/commerce/size-selector";
import { clientType } from "@/components/pages/client-area-typography";
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
    title: "Koszyk pozostaje zamknięty",
    body:
      "DROP 01 pozostaje zamknięty przed premierą. Produkty dodane z kolekcji pojawią się tutaj przed finalizacją zamówienia.",
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
    collection: "Kolekcja",
    account: "Konto",
    delivery: "Dostawa zostanie potwierdzona w checkout.",
    locked: "DROP 01 / przed premierą",
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
    title: "The cart remains closed",
    body:
      "DROP 01 remains closed before launch. Pieces added from the collection will appear here before checkout.",
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
    collection: "Collection",
    account: "Account",
    delivery: "Delivery will be confirmed at checkout.",
    locked: "DROP 01 / before launch",
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
  const accountHref = locale === "pl" ? "/konto" : "/en/account";
  const checkoutHref = locale === "pl" ? "/checkout" : "/en/checkout";

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
                {gate.storefrontLive ? t.emptyTitle : t.title}
              </h1>
              <p className={`mt-6 max-w-xl ${clientType.bodyLight}`}>
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
                  tone="light"
                />
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link
                    href={checkoutHref}
                    className={`${clientType.ctaBase} min-h-12 border-black bg-black text-white hover:bg-transparent hover:text-black`}
                  >
                    {t.continue}
                  </Link>
                  <button
                    type="button"
                    className={`${clientType.ctaBase} min-h-12 border-black/18 text-black/68 hover:border-black/54 hover:text-black`}
                  >
                    {t.clear}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-10 border-y border-black/12 bg-[#f8f6f1] px-5 py-9 md:grid-cols-[minmax(0,1fr)_280px] sm:px-8 sm:py-10">
                <div className="space-y-7">
                  <p className={clientType.sectionLabelLight}>
                    {t.locked}
                  </p>
                  <SizeSelector tone="light" label={t.size} sizes={["S", "M", "L", "XL", "ONE SIZE"]} disabled />
                  <QuantitySelector tone="light" label={t.quantity} disabled />
                  <AddToCartButton tone="light" label={t.add} disabledLabel={t.disabledAdd} disabled />
                  <p className="border-t border-black/10 pt-6 text-[13px] font-normal leading-6 text-black/64">{t.delivery}</p>
                </div>
                <div className="border-t border-black/10 pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  <p className={clientType.bodyLightMuted}>
                    {gate.shopMode === "PRE_LAUNCH" ? "DROP 01 coming soon" : t.emptyBody}
                  </p>
                </div>
              </div>
            )}
          </div>

          <CheckoutSummary locale={locale} labels={t.summary} tone="light" />
        </div>
      </section>
    </main>
  );
}
