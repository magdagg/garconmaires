"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckoutSummary } from "@/components/commerce/checkout-summary";
import { useCart } from "@/components/providers/cart-provider";

type CheckoutPreviewDemoProps = {
  locale: "pl" | "en";
  delivery: number;
  freeShippingThreshold: number;
};

type AccountSessionPayload =
  | {
      accountEnabled: false;
      authenticated: false;
      customer: null;
    }
  | {
      accountEnabled: true;
      authenticated: false;
      customer: null;
    }
  | {
      accountEnabled: true;
      authenticated: true;
      customer: {
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        addresses: Array<{
          firstName: string;
          lastName: string;
          addressLine1: string;
          addressLine2: string;
          postalCode: string;
          city: string;
          country: string;
          phone: string;
          isDefault: boolean;
        }>;
      };
    };

type ContactForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type ShippingForm = {
  address: string;
  postalCode: string;
  city: string;
};

const copy = {
  pl: {
    eyebrow: "Checkout preview",
    title: "Checkout DROP 01",
    body:
      "Podgląd checkoutu dla local/staging. Formularz pokazuje układ zamówienia, ale nie tworzy płatności ani publicznej sprzedaży.",
    contact: "Kontakt",
    shipping: "Adres dostawy",
    order: "Zamówienie",
    payment: "Płatność",
    paymentBody:
      "Płatność jest wyłączona w preview. Tpay nie jest wywoływany, a prawdziwy checkout pozostaje zablokowany do osobnej decyzji o launchu.",
    firstName: "Imię",
    lastName: "Nazwisko",
    email: "E-mail",
    phone: "Telefon",
    address: "Adres",
    postalCode: "Kod pocztowy",
    city: "Miasto",
    terms: "Akceptuję regulamin dla podglądu.",
    privacy: "Akceptuję politykę prywatności dla podglądu.",
    newsletter: "Chcę otrzymywać informacje o premierach.",
    accountAutofill: "Dane uzupełnione z konta. Możesz je zmienić dla tego zamówienia.",
    submit: "Potwierdź preview checkout",
    success: "Checkout preview potwierdzony. Nie utworzono zamówienia ani płatności.",
    cart: "Wróć do koszyka",
    collection: "Kolekcja",
    freeShipping: "Darmowa dostawa od",
    empty: "Koszyk preview jest pusty. Dodaj produkt z kolekcji przed checkoutem.",
    emptyOrder: "Brak produktów w koszyku preview.",
    summary: {
      title: "Checkout preview",
      subtotal: "Suma produktów",
      delivery: "Dostawa testowa",
      total: "Razem testowo",
      placeholder: "Do potwierdzenia",
    },
  },
  en: {
    eyebrow: "Checkout preview",
    title: "DROP 01 checkout",
    body:
      "A local/staging checkout preview. The form shows the order layout, but it does not create payment or open public sales.",
    contact: "Contact",
    shipping: "Shipping address",
    order: "Order",
    payment: "Payment",
    paymentBody:
      "Payment is disabled in preview. Tpay is not called, and the real checkout remains locked until a separate launch decision.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    postalCode: "Postal code",
    city: "City",
    terms: "I accept the terms for preview.",
    privacy: "I accept the privacy policy for preview.",
    newsletter: "Send me launch updates.",
    accountAutofill: "Details filled from your account. You can edit them for this order.",
    submit: "Confirm checkout preview",
    success: "Checkout preview confirmed. No order or payment was created.",
    cart: "Back to cart",
    collection: "Collection",
    freeShipping: "Free shipping from",
    empty: "Your preview cart is empty. Add a product from the collection before checkout.",
    emptyOrder: "No products in the preview cart.",
    summary: {
      title: "Checkout preview",
      subtotal: "Subtotal",
      delivery: "Test delivery",
      total: "Preview total",
      placeholder: "To be confirmed",
    },
  },
};

function TextField({
  label,
  type = "text",
  required = true,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-xs tracking-[0.14em] text-white/42 uppercase">
      <span>{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full border border-white/12 bg-transparent px-3 text-sm tracking-normal text-white outline-none focus:border-white/42"
      />
    </label>
  );
}

export function CheckoutPreviewDemo({
  locale,
  delivery,
  freeShippingThreshold,
}: CheckoutPreviewDemoProps) {
  const t = copy[locale];
  const { items, subtotal } = useCart();
  const [message, setMessage] = useState("");
  const [autofillNote, setAutofillNote] = useState("");
  const [contact, setContact] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [shipping, setShipping] = useState<ShippingForm>({
    address: "",
    postalCode: "",
    city: "",
  });
  const hasItems = items.length > 0;
  const cartHref = locale === "pl" ? "/koszyk" : "/en/cart";
  const collectionHref = locale === "pl" ? "/kolekcja" : "/en/collection";

  useEffect(() => {
    let cancelled = false;

    async function loadAccountDefaults() {
      try {
        const response = await fetch("/api/account/session", { cache: "no-store" });
        const payload = (await response.json()) as AccountSessionPayload;

        if (cancelled || !payload.accountEnabled || !payload.authenticated) {
          return;
        }

        const defaultAddress =
          payload.customer.addresses.find((address) => address.isDefault) ??
          payload.customer.addresses[0];

        setContact({
          firstName: payload.customer.firstName,
          lastName: payload.customer.lastName,
          email: payload.customer.email,
          phone: payload.customer.phone || defaultAddress?.phone || "",
        });

        if (defaultAddress) {
          setShipping({
            address: [defaultAddress.addressLine1, defaultAddress.addressLine2]
              .filter(Boolean)
              .join(", "),
            postalCode: defaultAddress.postalCode,
            city: defaultAddress.city,
          });
        }

        setAutofillNote(t.accountAutofill);
      } catch {
        // Guest checkout must remain independent from account availability.
      }
    }

    void loadAccountDefaults();

    return () => {
      cancelled = true;
    };
  }, [t.accountAutofill]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="site-shell px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form
            className="space-y-8"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage(hasItems ? t.success : t.empty);
            }}
          >
            <div className="space-y-4 border-b border-white/10 pb-8">
              <p className="font-label text-[10px] tracking-[0.32em] text-white/35 uppercase">
                {t.eyebrow}
              </p>
              <h1 className="font-display text-5xl leading-none sm:text-6xl">
                {t.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/58">{t.body}</p>
            </div>

            <section className="space-y-4">
              <div className="flex items-center gap-4 border-b border-white/10 pb-3">
                <span className="font-label text-[10px] tracking-[0.22em] text-white/30 uppercase">
                  01
                </span>
                <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                  {t.contact}
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label={t.firstName}
                  value={contact.firstName}
                  onChange={(value) => setContact((current) => ({ ...current, firstName: value }))}
                />
                <TextField
                  label={t.lastName}
                  value={contact.lastName}
                  onChange={(value) => setContact((current) => ({ ...current, lastName: value }))}
                />
                <TextField
                  label={t.email}
                  type="email"
                  value={contact.email}
                  onChange={(value) => setContact((current) => ({ ...current, email: value }))}
                />
                <TextField
                  label={t.phone}
                  type="tel"
                  value={contact.phone}
                  onChange={(value) => setContact((current) => ({ ...current, phone: value }))}
                />
              </div>
              {autofillNote ? (
                <p className="text-xs leading-6 text-white/36">{autofillNote}</p>
              ) : null}
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-4 border-b border-white/10 pb-3">
                <span className="font-label text-[10px] tracking-[0.22em] text-white/30 uppercase">
                  02
                </span>
                <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                  {t.shipping}
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label={t.address}
                  value={shipping.address}
                  onChange={(value) => setShipping((current) => ({ ...current, address: value }))}
                />
                <TextField
                  label={t.postalCode}
                  value={shipping.postalCode}
                  onChange={(value) => setShipping((current) => ({ ...current, postalCode: value }))}
                />
                <TextField
                  label={t.city}
                  value={shipping.city}
                  onChange={(value) => setShipping((current) => ({ ...current, city: value }))}
                />
              </div>
            </section>

            <p className="border-t border-white/10 pt-4 text-xs leading-6 text-white/42">
              {t.freeShipping}{" "}
              {new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB", {
                style: "currency",
                currency: "PLN",
              }).format(freeShippingThreshold / 100)}
              .
            </p>

            <section className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-3">
                <span className="font-label text-[10px] tracking-[0.22em] text-white/30 uppercase">
                  03
                </span>
                <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                  {t.order}
                </h2>
              </div>
              {hasItems ? (
                <div className="grid gap-px bg-white/8">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-4 bg-black p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.imageAlt}
                        className="aspect-[4/5] w-[72px] border border-white/8 bg-white/[0.03] object-contain p-2"
                      />
                      <div>
                        <p className="text-sm tracking-[0.08em] text-white uppercase">
                          {item.product.name}
                        </p>
                        <p className="mt-1 text-xs tracking-[0.16em] text-white/40 uppercase">
                          {item.size} / x{item.quantity}
                        </p>
                      </div>
                      <p className="text-sm tracking-[0.1em] text-white/68">
                        {new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB", {
                          style: "currency",
                          currency: "PLN",
                        }).format(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-white/50">{t.emptyOrder}</p>
              )}
            </section>

            <section className="space-y-3 text-sm leading-6 text-white/58">
              <label className="flex gap-3">
                <input type="checkbox" required />
                <span>{t.terms}</span>
              </label>
              <label className="flex gap-3">
                <input type="checkbox" required />
                <span>{t.privacy}</span>
              </label>
              <label className="flex gap-3">
                <input type="checkbox" />
                <span>{t.newsletter}</span>
              </label>
            </section>

            <section className="space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-3">
                <span className="font-label text-[10px] tracking-[0.22em] text-white/30 uppercase">
                  04
                </span>
                <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                  {t.payment}
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-white/54">
                {t.paymentBody}
              </p>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="bg-white px-6 py-4 text-xs tracking-[0.24em] text-black uppercase hover:bg-white/90"
              >
                {t.submit}
              </button>
              <Link
                href={cartHref}
                className="border border-white/12 px-5 py-4 text-xs tracking-[0.22em] text-white/58 uppercase hover:border-white/36"
              >
                {t.cart}
              </Link>
              <Link
                href={collectionHref}
                className="px-5 py-4 text-xs tracking-[0.22em] text-white/42 uppercase hover:text-white/70"
              >
                {t.collection}
              </Link>
            </div>
            <p className="min-h-6 text-sm leading-6 text-white/58" aria-live="polite">
              {message}
            </p>
          </form>

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
