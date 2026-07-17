import { clientType } from "@/components/pages/client-area-typography";
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
  tone?: "dark" | "light";
};

export function CheckoutSummary({
  locale,
  labels,
  subtotal = 0,
  delivery = 0,
  tone = "dark",
}: CheckoutSummaryProps) {
  const total = subtotal + delivery;

  return (
    <aside
      className={`space-y-6 border-y px-5 py-7 sm:px-7 lg:sticky lg:top-24 ${
        tone === "light" ? "border-black/12 bg-[#f8f6f1]" : "border-white/10"
      }`}
    >
      <div className={`border-b pb-5 ${tone === "light" ? "border-black/10" : "border-white/10"}`}>
        <h2 className={tone === "light" ? clientType.sectionLabelLight : clientType.sectionLabelDark}>
          {labels.title}
        </h2>
      </div>
      <div className={`space-y-5 text-[15px] font-normal leading-7 ${tone === "light" ? "text-black/76" : "text-white/70"}`}>
        <div className={`flex items-center justify-between gap-4 border-b pb-4 ${tone === "light" ? "border-black/10" : "border-white/8"}`}>
          <span>{labels.subtotal}</span>
          <span>{formatPrice(subtotal / 100, locale)}</span>
        </div>
        <div className={`flex items-center justify-between gap-4 border-b pb-4 ${tone === "light" ? "border-black/10" : "border-white/8"}`}>
          <span>{labels.delivery}</span>
          <span>{delivery > 0 ? formatPrice(delivery / 100, locale) : labels.placeholder}</span>
        </div>
        <div className={`flex items-center justify-between gap-4 pt-1 font-medium ${tone === "light" ? "text-black" : "text-white"}`}>
          <span>{labels.total}</span>
          <span className="text-lg tracking-normal">
            {formatPrice(total / 100, locale)}
          </span>
        </div>
      </div>
    </aside>
  );
}
