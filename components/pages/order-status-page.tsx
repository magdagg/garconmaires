"use client";

import { type FormEvent, useState } from "react";

type Locale = "pl" | "en";

type OrderStatusResponse = {
  order: {
    orderNumber: string;
    createdAt: string;
    paymentStatus: string;
    fulfillmentStatus: string;
    orderStatus: string;
    total: number;
    delivery: {
      method: string;
      status: string;
      trackingNumber: string | null;
      trackingUrl: string | null;
      parcelLockerName: string | null;
    };
    shippingAddress: {
      city: string;
      postalCode: string;
      country: string;
    };
    items: {
      name: string;
      size: string;
      sku: string;
      quantity: number;
      total: number;
    }[];
    payment: { provider: string; status: string; paidAt: string | null } | null;
    returns: { id: string; status: string; createdAt: string }[];
    complaints: { id: string; status: string; createdAt: string }[];
  };
};

const copy = {
  pl: {
    eyebrow: "Status zamowienia",
    title: "Sprawdz zamowienie",
    body: "Wpisz numer zamowienia i e-mail uzyty przy zakupie. Dane sa pokazywane tylko po zgodnosci obu wartosci.",
    orderNumber: "Numer zamowienia",
    email: "E-mail",
    submit: "Sprawdz status",
    notFound: "Nie znaleziono zamowienia dla podanych danych.",
    status: "Status",
    payment: "Platnosc",
    fulfillment: "Realizacja",
    delivery: "Dostawa",
    items: "Pozycje",
    requests: "Zgloszenia",
    meanings: "Co oznacza status",
    noItems: "Brak pozycji w zamowieniu.",
    statusMeanings: {
      pending: "Oczekuje na potwierdzenie.",
      paid: "Platnosc zostala potwierdzona.",
      failed: "Platnosc nie zostala ukonczona.",
      cancelled: "Zamowienie lub platnosc zostaly anulowane.",
      expired: "Sesja platnosci wygasla.",
      refunded: "Srodki zostaly zwrocone.",
      new: "Zamowienie zostalo utworzone.",
      confirmed: "Zamowienie zostalo potwierdzone.",
      processing: "Zamowienie jest przygotowywane.",
      completed: "Zamowienie zostalo zakonczone.",
      unfulfilled: "Realizacja jeszcze sie nie rozpoczela.",
      packing: "Zamowienie jest pakowane.",
      shipped: "Przesylka zostala nadana.",
      delivered: "Przesylka zostala dostarczona.",
      returned: "Zamowienie zostalo oznaczone jako zwrocone.",
    },
  },
  en: {
    eyebrow: "Order status",
    title: "Check your order",
    body: "Enter your order number and the e-mail used at checkout. Details are shown only when both values match.",
    orderNumber: "Order number",
    email: "E-mail",
    submit: "Check status",
    notFound: "No order was found for the provided details.",
    status: "Status",
    payment: "Payment",
    fulfillment: "Fulfillment",
    delivery: "Delivery",
    items: "Items",
    requests: "Requests",
    meanings: "What the status means",
    noItems: "No items in this order.",
    statusMeanings: {
      pending: "Waiting for confirmation.",
      paid: "Payment has been confirmed.",
      failed: "Payment was not completed.",
      cancelled: "Order or payment was cancelled.",
      expired: "Payment session expired.",
      refunded: "Funds were refunded.",
      new: "The order was created.",
      confirmed: "The order was confirmed.",
      processing: "The order is being prepared.",
      completed: "The order is complete.",
      unfulfilled: "Fulfillment has not started yet.",
      packing: "The order is being packed.",
      shipped: "The parcel has shipped.",
      delivered: "The parcel was delivered.",
      returned: "The order was marked as returned.",
    },
  },
};

function money(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    style: "currency",
    currency: "PLN",
  }).format(value / 100);
}

function statusMeaning(
  status: string,
  meanings: Record<string, string>,
) {
  return meanings[status] ?? status;
}

export function OrderStatusPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [orderNumber, setOrderNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OrderStatusResponse["order"] | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, customerEmail }),
    });
    const data = (await response.json()) as Partial<OrderStatusResponse> & { error?: string };

    setLoading(false);
    if (!response.ok || !data.order) {
      setError(data.error ?? t.notFound);
      return;
    }

    setResult(data.order);
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-black text-white">
      <section className="site-shell py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)]">
          <div>
            <p className="font-label text-[11px] uppercase tracking-[0.24em] text-white/42">
              {t.eyebrow}
            </p>
            <h1 className="mt-6 text-4xl font-light tracking-normal sm:text-6xl">
              {t.title}
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/58">{t.body}</p>
          </div>

          <form onSubmit={submit} className="border-y border-white/12 py-8">
            <label className="block space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
              <span>{t.orderNumber}</span>
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                required
                className="h-12 w-full border border-white/12 bg-transparent px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/42"
              />
            </label>
            <label className="mt-5 block space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
              <span>{t.email}</span>
              <input
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                required
                className="h-12 w-full border border-white/12 bg-transparent px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/42"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-7 w-full bg-white px-6 py-4 text-xs uppercase tracking-[0.24em] text-black disabled:opacity-50"
            >
              {loading ? "..." : t.submit}
            </button>
            {error ? <p className="mt-4 text-sm leading-6 text-white/58">{error}</p> : null}
          </form>
        </div>

        {result ? (
          <div className="mt-14 grid gap-8 border-t border-white/12 pt-10 lg:grid-cols-[0.4fr_0.6fr]">
            <div>
              <p className="font-label text-[10px] uppercase tracking-[0.24em] text-white/36">
                {result.orderNumber}
              </p>
              <p className="mt-4 text-3xl font-light">{money(result.total, locale)}</p>
              <p className="mt-4 text-sm leading-6 text-white/52">
                {new Date(result.createdAt).toLocaleDateString(locale === "pl" ? "pl-PL" : "en-GB")}
              </p>
            </div>
            <div className="grid gap-px bg-white/10">
              {[
                [t.status, result.orderStatus],
                [t.payment, result.payment?.status ?? result.paymentStatus],
                [t.fulfillment, result.fulfillmentStatus],
                [t.delivery, `${result.delivery.method} / ${result.delivery.status}`],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-2 bg-black p-5 sm:grid-cols-[160px_1fr]">
                  <p className="font-label text-[10px] uppercase tracking-[0.2em] text-white/32">
                    {label}
                  </p>
                  <p className="text-sm text-white/72">{value}</p>
                </div>
              ))}
              <div className="bg-black p-5">
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-white/32">
                  {t.items}
                </p>
                <div className="mt-4 space-y-3">
                  {result.items.length ? result.items.map((item) => (
                    <div key={`${item.sku}-${item.size}`} className="flex justify-between gap-4 text-sm text-white/70">
                      <span>{item.name} / {item.size} / x{item.quantity}</span>
                      <span>{money(item.total, locale)}</span>
                    </div>
                  )) : (
                    <p className="text-sm leading-6 text-white/50">{t.noItems}</p>
                  )}
                </div>
              </div>
              <div className="bg-black p-5">
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-white/32">
                  {t.meanings}
                </p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-white/56">
                  <p>{result.orderStatus}: {statusMeaning(result.orderStatus, t.statusMeanings)}</p>
                  <p>{result.payment?.status ?? result.paymentStatus}: {statusMeaning(result.payment?.status ?? result.paymentStatus, t.statusMeanings)}</p>
                  <p>{result.fulfillmentStatus}: {statusMeaning(result.fulfillmentStatus, t.statusMeanings)}</p>
                </div>
              </div>
              <div className="bg-black p-5">
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-white/32">
                  {t.requests}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/54">
                  Returns: {result.returns.length} / Complaints: {result.complaints.length}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
