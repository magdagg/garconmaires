import Link from "next/link";
import { CheckoutSummary } from "@/components/commerce/checkout-summary";
import { DeliverySelector } from "@/components/commerce/delivery-selector";
import type { CartCheckoutGateState } from "@/lib/store/cart-checkout-gate";

type CheckoutPageProps = {
  locale: "pl" | "en";
  gate: CartCheckoutGateState;
};

const copy = {
  pl: {
    eyebrow: "Checkout",
    title: "Płatność jest zablokowana do startu sklepu",
    body:
      "Ten formularz jest przygotowany na DROP 01, ale nie utworzy płatności Tpay, dopóki sklep pozostaje w trybie pre-launch.",
    contact: "Kontakt",
    shipping: "Adres dostawy",
    delivery: "Dostawa",
    locker: "Kod lub nazwa Paczkomatu",
    firstName: "Imię",
    lastName: "Nazwisko",
    email: "E-mail",
    phone: "Telefon",
    address: "Adres",
    postalCode: "Kod pocztowy",
    city: "Miasto",
    terms: "Akceptuję regulamin.",
    privacy: "Akceptuję politykę prywatności.",
    newsletter: "Chcę otrzymywać informacje o premierach.",
    legalLinks: {
      terms: "/regulamin",
      privacy: "/polityka-prywatnosci",
      returns: "/zwroty-i-reklamacje",
      delivery: "/dostawa",
    },
    legalNote: "Dokumenty: regulamin, prywatność, zwroty i dostawa.",
    paymentSection: "Płatność",
    paymentBody:
      "Płatności zostaną aktywowane przy starcie sprzedaży. Przygotowane metody: Tpay, BLIK, szybki przelew, karta oraz Apple Pay / Google Pay, jeśli operator je udostępni.",
    freeShipping: "Darmowa dostawa od",
    payment: "Przejdź do płatności",
    disabled: "Płatność dostępna po premierze",
    cart: "Wróć do koszyka",
    validation: "Wymagane: poprawny e-mail, telefon, adres, regulamin i prywatność.",
    summary: {
      title: "Zamówienie",
      subtotal: "Suma produktów",
      delivery: "Dostawa",
      total: "Razem",
      placeholder: "Do wyliczenia",
    },
  },
  en: {
    eyebrow: "Checkout",
    title: "Payment is blocked until the shop opens",
    body:
      "This form is prepared for DROP 01, but it will not create a Tpay payment while the shop remains in pre-launch mode.",
    contact: "Contact",
    shipping: "Shipping address",
    delivery: "Delivery",
    locker: "Parcel locker code or name",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    postalCode: "Postal code",
    city: "City",
    terms: "I accept the terms.",
    privacy: "I accept the privacy policy.",
    newsletter: "Send me launch updates.",
    legalLinks: {
      terms: "/en/terms",
      privacy: "/en/privacy-policy",
      returns: "/en/returns-complaints",
      delivery: "/en/delivery",
    },
    legalNote: "Documents: terms, privacy, returns and delivery.",
    paymentSection: "Payment",
    paymentBody:
      "Payments will be activated at launch. Prepared methods: Tpay, BLIK, fast transfer, card and Apple Pay / Google Pay if supported by the provider.",
    freeShipping: "Free shipping from",
    payment: "Go to payment",
    disabled: "Payment available at launch",
    cart: "Back to cart",
    validation: "Required: valid email, phone, address, terms and privacy.",
    summary: {
      title: "Order",
      subtotal: "Subtotal",
      delivery: "Delivery",
      total: "Total",
      placeholder: "Calculated later",
    },
  },
};

function TextField({
  label,
  type = "text",
  disabled,
}: {
  label: string;
  type?: string;
  disabled: boolean;
}) {
  return (
    <label className="block space-y-2 text-xs tracking-[0.14em] text-white/42 uppercase">
      <span>{label}</span>
      <input
        type={type}
        disabled={disabled}
        className="h-12 w-full border border-white/10 bg-transparent px-3 text-sm tracking-normal text-white outline-none disabled:text-white/30"
      />
    </label>
  );
}

export function CheckoutPage({ locale, gate }: CheckoutPageProps) {
  const t = copy[locale];
  const disabled = !gate.storefrontLive;
  const cartHref = locale === "pl" ? "/koszyk" : "/en/cart";

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="site-shell px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form className="space-y-8">
            <div className="space-y-4 border-b border-white/10 pb-8">
              <p className="font-label text-[10px] tracking-[0.32em] text-white/35 uppercase">
                {t.eyebrow}
              </p>
              <h1 className="font-display text-5xl leading-none sm:text-6xl">
                {disabled ? t.title : t.eyebrow}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/58">{t.body}</p>
            </div>

            <section className="space-y-4">
              <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                {t.contact}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label={t.firstName} disabled={disabled} />
                <TextField label={t.lastName} disabled={disabled} />
                <TextField label={t.email} type="email" disabled={disabled} />
                <TextField label={t.phone} type="tel" disabled={disabled} />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                {t.shipping}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label={t.address} disabled={disabled} />
                <TextField label={t.postalCode} disabled={disabled} />
                <TextField label={t.city} disabled={disabled} />
              </div>
            </section>

            <DeliverySelector
              locale={locale}
              title={t.delivery}
              lockerLabel={t.locker}
              methods={gate.deliveryMethods}
              disabled={disabled}
            />

            <p className="border-t border-white/10 pt-4 text-xs leading-6 text-white/42">
              {t.freeShipping}{" "}
              {new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB", {
                style: "currency",
                currency: "PLN",
              }).format(gate.freeShippingThreshold / 100)}
              .
            </p>

            <section className="space-y-3 text-sm leading-6 text-white/58">
              <label className="flex gap-3">
                <input type="checkbox" required disabled={disabled} />
                <span>
                  {t.terms}{" "}
                  <Link href={t.legalLinks.terms} className="text-white underline underline-offset-4">
                    {locale === "pl" ? "Regulamin" : "Terms"}
                  </Link>
                </span>
              </label>
              <label className="flex gap-3">
                <input type="checkbox" required disabled={disabled} />
                <span>
                  {t.privacy}{" "}
                  <Link href={t.legalLinks.privacy} className="text-white underline underline-offset-4">
                    {locale === "pl" ? "Prywatność" : "Privacy"}
                  </Link>
                </span>
              </label>
              <label className="flex gap-3">
                <input type="checkbox" disabled={disabled} />
                <span>{t.newsletter}</span>
              </label>
              <p className="text-xs text-white/36">
                {t.legalNote}{" "}
                <Link href={t.legalLinks.returns} className="text-white/60 underline underline-offset-4">
                  {locale === "pl" ? "Zwroty" : "Returns"}
                </Link>
                {" / "}
                <Link href={t.legalLinks.delivery} className="text-white/60 underline underline-offset-4">
                  {locale === "pl" ? "Dostawa" : "Delivery"}
                </Link>
              </p>
              <p className="text-xs text-white/36">{t.validation}</p>
            </section>

            <section className="space-y-3 border-t border-white/10 pt-6">
              <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                {t.paymentSection}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-white/54">
                {t.paymentBody}
              </p>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled
                className="border border-white/12 px-6 py-4 text-xs tracking-[0.24em] text-white/35 uppercase"
              >
                {disabled ? t.disabled : t.payment}
              </button>
              <Link
                href={cartHref}
                className="px-5 py-4 text-xs tracking-[0.22em] text-white/45 uppercase"
              >
                {t.cart}
              </Link>
            </div>
          </form>

          <CheckoutSummary locale={locale} labels={t.summary} />
        </div>
      </section>
    </main>
  );
}
