import Link from "next/link";

type Locale = "pl" | "en";
type CheckoutState = "failed" | "cancelled" | "expired";

const copy = {
  pl: {
    failed: {
      eyebrow: "Platnosc",
      title: "Platnosc nie zostala ukonczona",
      body: "Jesli srodki nie zostaly pobrane, mozesz wrocic do koszyka i sprobowac ponownie. Zamowienie nie powinno przejsc do realizacji bez potwierdzenia operatora.",
    },
    cancelled: {
      eyebrow: "Platnosc",
      title: "Platnosc zostala anulowana",
      body: "Koszyk i zamowienie pozostaja bez publicznego potwierdzenia platnosci. Wroc do koszyka, jesli chcesz kontynuowac preview flow.",
    },
    expired: {
      eyebrow: "Platnosc",
      title: "Sesja platnosci wygasla",
      body: "Link platnosci nie jest juz aktywny. Wroc do koszyka i rozpocznij checkout ponownie.",
    },
    cart: "Koszyk",
    orderStatus: "Status zamowienia",
  },
  en: {
    failed: {
      eyebrow: "Payment",
      title: "Payment was not completed",
      body: "If no funds were captured, you can return to the cart and try again. The order should not move to fulfillment without provider confirmation.",
    },
    cancelled: {
      eyebrow: "Payment",
      title: "Payment was cancelled",
      body: "The cart and order remain without public payment confirmation. Return to the cart if you want to continue the preview flow.",
    },
    expired: {
      eyebrow: "Payment",
      title: "Payment session expired",
      body: "The payment link is no longer active. Return to the cart and start checkout again.",
    },
    cart: "Cart",
    orderStatus: "Order status",
  },
};

export function CheckoutStatePage({
  locale,
  state,
}: {
  locale: Locale;
  state: CheckoutState;
}) {
  const t = copy[locale];
  const content = t[state];
  const cartHref = locale === "pl" ? "/koszyk" : "/en/cart";
  const statusHref = locale === "pl" ? "/status-zamowienia" : "/en/order-status";

  return (
    <main className="min-h-[calc(100vh-72px)] bg-black text-white">
      <section className="site-shell flex min-h-[calc(100vh-72px)] items-center py-20 sm:py-24">
        <div className="max-w-2xl border-y border-white/12 py-12">
          <p className="font-label text-[11px] uppercase tracking-[0.24em] text-white/42">
            {content.eyebrow}
          </p>
          <h1 className="mt-6 text-4xl font-light tracking-normal sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/58">
            {content.body}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={cartHref}
              className="font-label border border-white px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-white hover:bg-white hover:text-black"
            >
              {t.cart}
            </Link>
            <Link
              href={statusHref}
              className="font-label border border-white/14 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-white/70 hover:border-white hover:text-white"
            >
              {t.orderStatus}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
