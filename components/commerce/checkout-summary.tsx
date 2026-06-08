import { formatPrice } from "@/lib/utils";

type CheckoutSummaryProps = {
  locale: "pl" | "en";
  labels: {
    title: string;
    subtotal: string;
    delivery: string;
    total: string;
    placeholder: string;
  };
  subtotal?: number;
  delivery?: number;
};

export function CheckoutSummary({
  locale,
  labels,
  subtotal = 0,
  delivery = 0,
}: CheckoutSummaryProps) {
  const total = subtotal + delivery;

  return (
    <aside className="space-y-5 border-t border-white/10 pt-6 lg:border-t-0 lg:border-l lg:pl-8">
      <h2 className="font-label text-[10px] tracking-[0.3em] text-white/42 uppercase">
        {labels.title}
      </h2>
      <div className="space-y-3 text-sm text-white/62">
        <div className="flex items-center justify-between gap-4">
          <span>{labels.subtotal}</span>
          <span>{formatPrice(subtotal / 100, locale)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>{labels.delivery}</span>
          <span>{delivery > 0 ? formatPrice(delivery / 100, locale) : labels.placeholder}</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-white">
          <span>{labels.total}</span>
          <span>{formatPrice(total / 100, locale)}</span>
        </div>
      </div>
    </aside>
  );
}
