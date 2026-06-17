"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckoutSummary } from "@/components/commerce/checkout-summary";
import { useCart } from "@/components/providers/cart-provider";

type CheckoutPreviewDemoProps = {
  locale: "pl" | "en";
  delivery: number;
  freeShippingThreshold: number;
};

const copy = {
  pl: {
    eyebrow: "Checkout preview",
    title: "Testowy checkout bez płatności",
    body:
      "Ten flow pokazuje układ checkoutu dla DROP 01 na local/staging. Nie tworzy zamówienia, nie kontaktuje Tpay i nie odblokowuje publicznej sprzedaży.",
    contact: "Kontakt",
    shipping: "Adres dostawy",
    payment: "Płatność",
    paymentBody:
      "Płatność jest symulowana. Prawdziwy checkout pozostaje zablokowany do osobnej decyzji o publicznym launchu.",
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
    submit: "Potwierdź preview checkout",
    success: "Checkout preview potwierdzony. Nie utworzono zamówienia ani płatności.",
    cart: "Wróć do koszyka",
    collection: "Kolekcja",
    freeShipping: "Darmowa dostawa od",
    empty: "Koszyk preview jest pusty. Dodaj produkt z kolekcji przed checkoutem.",
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
    title: "Test checkout without payment",
    body:
      "This flow shows the DROP 01 checkout layout on local/staging. It does not create an order, contact Tpay, or open public sales.",
    contact: "Contact",
    shipping: "Shipping address",
    payment: "Payment",
    paymentBody:
      "Payment is simulated. The real checkout remains locked until a separate public launch decision.",
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
    submit: "Confirm checkout preview",
    success: "Checkout preview confirmed. No order or payment was created.",
    cart: "Back to cart",
    collection: "Collection",
    freeShipping: "Free shipping from",
    empty: "Your preview cart is empty. Add a product from the collection before checkout.",
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
}: {
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2 text-xs tracking-[0.14em] text-white/42 uppercase">
      <span>{label}</span>
      <input
        type={type}
        required={required}
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
  const hasItems = items.length > 0;
  const cartHref = locale === "pl" ? "/koszyk" : "/en/cart";
  const collectionHref = locale === "pl" ? "/kolekcja" : "/en/collection";

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
              <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                {t.contact}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label={t.firstName} />
                <TextField label={t.lastName} />
                <TextField label={t.email} type="email" />
                <TextField label={t.phone} type="tel" />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                {t.shipping}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label={t.address} />
                <TextField label={t.postalCode} />
                <TextField label={t.city} />
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
              <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
                {t.payment}
              </h2>
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
