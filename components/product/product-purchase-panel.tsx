"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import type { Product } from "@/lib/data/products";
import type { Locale } from "@/lib/i18n";

const copy = {
  pl: {
    size: "Rozmiar",
    quantity: "Ilość",
    add: "Dodaj do koszyka preview",
    added: "Dodano do koszyka preview.",
    cart: "Koszyk",
    checkout: "Checkout preview",
    demo:
      "Ten panel pokazuje działanie flow na local/staging. Publiczna sprzedaż i realna płatność pozostają zablokowane.",
  },
  en: {
    size: "Size",
    quantity: "Quantity",
    add: "Add to preview cart",
    added: "Added to preview cart.",
    cart: "Cart",
    checkout: "Checkout preview",
    demo:
      "This panel shows the local/staging flow. Public sales and real payment remain locked.",
  },
};

type ProductPurchasePanelProps = {
  product: Product;
  locale: Locale;
};

export function ProductPurchasePanel({
  product,
  locale,
}: ProductPurchasePanelProps) {
  const t = copy[locale];
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0] ?? "M");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const cartHref = locale === "pl" ? "/koszyk" : "/en/cart";
  const checkoutHref = locale === "pl" ? "/checkout" : "/en/checkout";
  const quantities = useMemo(() => [1, 2, 3], []);

  return (
    <div className="space-y-6 border-y border-white/10 py-6">
      <div className="grid gap-6 md:grid-cols-[1fr_0.56fr]">
        <div className="space-y-3">
          <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
            {t.size}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {product.sizes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSize(item)}
                className={
                  item === size
                    ? "h-12 border border-white bg-white text-xs tracking-[0.22em] text-black uppercase"
                    : "h-12 border border-white/16 text-xs tracking-[0.22em] text-white/62 uppercase hover:border-white/40"
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
            {t.quantity}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {quantities.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuantity(item)}
                className={
                  item === quantity
                    ? "h-12 border border-white bg-white text-xs tracking-[0.18em] text-black"
                    : "h-12 border border-white/16 text-xs tracking-[0.18em] text-white/62 hover:border-white/40"
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            addItem(product, size, quantity);
            setMessage(t.added);
          }}
          className="w-full bg-white px-6 py-4 text-xs tracking-[0.26em] text-black uppercase hover:bg-white/90"
        >
          {t.add}
        </button>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={cartHref}
            className="border border-white/14 px-5 py-3 text-center text-xs tracking-[0.22em] text-white/72 uppercase hover:border-white/36"
          >
            {t.cart}
          </Link>
          <Link
            href={checkoutHref}
            className="border border-white/14 px-5 py-3 text-center text-xs tracking-[0.22em] text-white/72 uppercase hover:border-white/36"
          >
            {t.checkout}
          </Link>
        </div>
        <p className="min-h-6 text-xs leading-6 text-white/44" aria-live="polite">
          {message || t.demo}
        </p>
      </div>
    </div>
  );
}
