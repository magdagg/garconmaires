"use client";

import { type FormEvent, useMemo, useState } from "react";

type Locale = "pl" | "en";

type OrderLookup = {
  order: {
    orderNumber: string;
    items: {
      productId: string;
      variantId: string;
      name: string;
      size: string;
      quantity: number;
    }[];
  };
};

const copy = {
  pl: {
    eyebrow: "Obsluga zamowienia",
    title: "Zglos zwrot albo reklamacje",
    body: "Formularz dziala po numerze zamowienia i e-mailu. Upload zdjec dla reklamacji jest przygotowany jako pending i nie jest jeszcze podlaczony.",
    orderNumber: "Numer zamowienia",
    email: "E-mail",
    verify: "Sprawdz zamowienie",
    type: "Typ zgloszenia",
    return: "Zwrot",
    complaint: "Reklamacja",
    product: "Produkt",
    reason: "Powod",
    message: "Wiadomosc",
    solution: "Preferowane rozwiazanie",
    submit: "Wyslij zgloszenie",
    missing: "Najpierw sprawdz zamowienie i wybierz produkt.",
    successReturn: "Zgloszenie zwrotu zostalo przyjete.",
    successComplaint: "Zgloszenie reklamacji zostalo przyjete.",
    notFound: "Nie znaleziono zamowienia dla podanych danych.",
  },
  en: {
    eyebrow: "Order service",
    title: "Request a return or complaint",
    body: "The form works with order number and e-mail verification. Complaint image upload is prepared as pending and is not connected yet.",
    orderNumber: "Order number",
    email: "E-mail",
    verify: "Check order",
    type: "Request type",
    return: "Return",
    complaint: "Complaint",
    product: "Product",
    reason: "Reason",
    message: "Message",
    solution: "Preferred solution",
    submit: "Send request",
    missing: "Check the order and choose a product first.",
    successReturn: "Return request has been received.",
    successComplaint: "Complaint request has been received.",
    notFound: "No order was found for the provided details.",
  },
};

export function ReturnsComplaintsForm({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [orderNumber, setOrderNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [order, setOrder] = useState<OrderLookup["order"] | null>(null);
  const [type, setType] = useState<"return" | "complaint">("return");
  const [selectedItem, setSelectedItem] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [solution, setSolution] = useState("refund");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const item = useMemo(
    () =>
      order?.items.find(
        (entry) => `${entry.productId}:${entry.variantId}` === selectedItem,
      ) ?? null,
    [order, selectedItem],
  );

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setOrder(null);
    const response = await fetch("/api/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, customerEmail }),
    });
    const data = (await response.json()) as Partial<OrderLookup> & { error?: string };
    setLoading(false);

    if (!response.ok || !data.order) {
      setStatus(data.error ?? t.notFound);
      return;
    }

    setOrder(data.order);
    setSelectedItem(
      data.order.items[0]
        ? `${data.order.items[0].productId}:${data.order.items[0].variantId}`
        : "",
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || !item) {
      setStatus(t.missing);
      return;
    }

    setLoading(true);
    setStatus("");
    const endpoint = type === "return" ? "/api/returns" : "/api/complaints";
    const payload =
      type === "return"
        ? {
            orderNumber,
            customerEmail,
            selectedItems: [
              {
                productId: item.productId,
                variantId: item.variantId,
                quantity: 1,
              },
            ],
            reason,
          }
        : {
            orderNumber,
            customerEmail,
            productId: item.productId,
            variantId: item.variantId,
            description: message || reason,
            preferredSolution: solution,
          };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    setStatus(
      response.ok
        ? type === "return"
          ? t.successReturn
          : t.successComplaint
        : data.error ?? t.missing,
    );
  }

  return (
    <section className="site-shell px-4 pb-20 md:px-6 md:pb-28">
      <div className="grid gap-10 border-t border-white/12 pt-12 lg:grid-cols-[0.42fr_0.58fr]">
        <div>
          <p className="font-label text-[11px] uppercase tracking-[0.24em] text-white/42">
            {t.eyebrow}
          </p>
          <h2 className="mt-5 text-4xl font-light tracking-normal text-white sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/58">{t.body}</p>
        </div>
        <div className="space-y-8">
          <form onSubmit={verify} className="grid gap-4 border-y border-white/12 py-7 sm:grid-cols-2">
            <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
              <span>{t.orderNumber}</span>
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                required
                className="h-12 w-full border border-white/12 bg-transparent px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/42"
              />
            </label>
            <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
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
              className="bg-white px-6 py-4 text-xs uppercase tracking-[0.24em] text-black disabled:opacity-50 sm:col-span-2"
            >
              {loading ? "..." : t.verify}
            </button>
          </form>

          <form onSubmit={submit} className="grid gap-5">
            <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
              <span>{t.type}</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as "return" | "complaint")}
                className="h-12 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none"
              >
                <option value="return">{t.return}</option>
                <option value="complaint">{t.complaint}</option>
              </select>
            </label>
            <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
              <span>{t.product}</span>
              <select
                value={selectedItem}
                onChange={(event) => setSelectedItem(event.target.value)}
                disabled={!order}
                className="h-12 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none disabled:text-white/28"
              >
                {(order?.items ?? []).map((entry) => (
                  <option
                    key={`${entry.productId}:${entry.variantId}`}
                    value={`${entry.productId}:${entry.variantId}`}
                  >
                    {entry.name} / {entry.size}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
              <span>{t.reason}</span>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                className="h-12 w-full border border-white/12 bg-transparent px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/42"
              />
            </label>
            {type === "complaint" ? (
              <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
                <span>{t.solution}</span>
                <select
                  value={solution}
                  onChange={(event) => setSolution(event.target.value)}
                  className="h-12 w-full border border-white/12 bg-black px-3 text-sm text-white outline-none"
                >
                  <option value="refund">Refund</option>
                  <option value="replacement">Replacement</option>
                  <option value="repair">Repair</option>
                  <option value="price_reduction">Price reduction</option>
                </select>
              </label>
            ) : null}
            <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/42">
              <span>{t.message}</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-28 w-full border border-white/12 bg-transparent p-3 text-sm normal-case tracking-normal text-white outline-none focus:border-white/42"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !order}
              className="bg-white px-6 py-4 text-xs uppercase tracking-[0.24em] text-black disabled:opacity-50"
            >
              {loading ? "..." : t.submit}
            </button>
            <p className="min-h-6 text-sm leading-6 text-white/58" aria-live="polite">
              {status}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
