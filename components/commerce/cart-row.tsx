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
};

export function CartRow({
  locale,
  name,
  size,
  quantity,
  unitPrice,
  disabled = false,
  removeLabel,
}: CartRowProps) {
  return (
    <div className="grid gap-5 border-b border-white/10 py-5 md:grid-cols-[1fr_180px_120px] md:items-center">
      <div className="space-y-2">
        <p className="text-sm tracking-[0.16em] text-white uppercase">{name}</p>
        <p className="text-xs tracking-[0.18em] text-white/42 uppercase">{size}</p>
        <button
          type="button"
          disabled={disabled}
          className="text-xs tracking-[0.16em] text-white/36 uppercase"
        >
          {removeLabel}
        </button>
      </div>
      <QuantitySelector label="Qty" value={quantity} disabled={disabled} />
      <p className="text-right text-sm tracking-[0.12em] text-white/72">
        {formatPrice(unitPrice / 100, locale)}
      </p>
    </div>
  );
}
