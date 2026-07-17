import { clientType } from "@/components/pages/client-area-typography";

type QuantitySelectorProps = {
  label: string;
  value?: number;
  disabled?: boolean;
  tone?: "dark" | "light";
};

export function QuantitySelector({
  label,
  value = 1,
  disabled = false,
  tone = "dark",
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className={tone === "light" ? `${clientType.formLabelLight} text-black/70` : `${clientType.formLabelDark} text-white/62`}>{label}</p>
      <div className={`grid grid-cols-[44px_44px_44px] border text-center ${tone === "light" ? "border-black/14" : "border-white/12"}`}>
        <button type="button" disabled={disabled} className={`h-11 text-[15px] font-normal ${tone === "light" ? "text-black/66 disabled:text-black/32" : "text-white/58 disabled:text-white/28"}`}>
          -
        </button>
        <output className={`grid h-11 place-items-center border-x text-[15px] font-normal ${tone === "light" ? "border-black/14 text-black/86" : "border-white/12 text-white/84"}`}>
          {value}
        </output>
        <button type="button" disabled={disabled} className={`h-11 text-[15px] font-normal ${tone === "light" ? "text-black/66 disabled:text-black/32" : "text-white/58 disabled:text-white/28"}`}>
          +
        </button>
      </div>
    </div>
  );
}
