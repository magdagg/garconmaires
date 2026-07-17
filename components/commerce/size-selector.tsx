import { clientType } from "@/components/pages/client-area-typography";

type SizeSelectorProps = {
  label: string;
  sizes: string[];
  disabled?: boolean;
  tone?: "dark" | "light";
};

export function SizeSelector({ label, sizes, disabled = false, tone = "dark" }: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <p className={tone === "light" ? `${clientType.formLabelLight} text-black/70` : `${clientType.formLabelDark} text-white/62`}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            disabled={disabled}
            className={`min-h-11 min-w-14 border px-4 font-label text-[11px] font-medium tracking-[0.105em] uppercase ${
              tone === "light"
                ? "border-black/16 text-black/74 disabled:text-black/40"
                : "border-white/14 text-white/66 disabled:text-white/36"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
