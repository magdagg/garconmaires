import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { formatPrice } from "@/lib/utils";

type CartRowProps = {
  locale: "pl" | "en";
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  disabled?: boolean;
  removeLabel: string;
  tone?: "dark" | "light";
};

export function CartRow({
  locale,
  name,
  size,
  quantity,
  unitPrice,
  disabled = false,
  removeLabel,
  tone = "dark",
}: CartRowProps) {
  return (
    <div className={`grid gap-5 border-b py-5 md:grid-cols-[1fr_180px_120px] md:items-center ${tone === "light" ? "border-black/12" : "border-white/10"}`}>
      <div className="space-y-2">
        <p className={`text-sm tracking-[0.16em] uppercase ${tone === "light" ? "text-black" : "text-white"}`}>{name}</p>
        <p className={`text-xs tracking-[0.18em] uppercase ${tone === "light" ? "text-black/52" : "text-white/42"}`}>{size}</p>
        <button
          type="button"
          disabled={disabled}
          className={`text-xs tracking-[0.16em] uppercase ${tone === "light" ? "text-black/42" : "text-white/36"}`}
        >
          {removeLabel}
        </button>
      </div>
      <QuantitySelector tone={tone} label="Qty" value={quantity} disabled={disabled} />
      <p className={`text-right text-sm tracking-[0.12em] ${tone === "light" ? "text-black/72" : "text-white/72"}`}>
        {formatPrice(unitPrice / 100, locale)}
      </p>
    </div>
  );
}
