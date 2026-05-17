import type { Product } from "@/lib/data/products";
import { cn } from "@/lib/utils";

type ProductMediaProps = {
  product: Product;
  compact?: boolean;
  label?: string;
};

export function ProductMedia({
  product,
  compact = false,
  label,
}: ProductMediaProps) {
  return (
    <div
      className={cn(
        "group grain relative overflow-hidden border border-white/10 bg-zinc-950",
        compact ? "aspect-[4/5]" : "aspect-[4/5] min-h-[300px]",
      )}
    >
      <div
        className="image-drift absolute inset-0 opacity-95"
        style={{
          background: `linear-gradient(135deg, ${product.tones.base} 0%, ${product.tones.highlight} 50%, ${product.tones.edge} 100%)`,
        }}
      />
      <div className="absolute inset-x-[16%] top-[10%] h-[70%] rounded-t-[42%] border border-white/18 bg-black/34" />
      <div className="absolute inset-x-[28%] bottom-[14%] h-[22%] rounded-full border border-white/12 bg-white/8 blur-[1px]" />
      <div className="absolute left-[16%] top-[18%] h-[48%] w-[1px] bg-white/20" />
      <div className="absolute right-[14%] top-[12%] w-[44%] border-t border-white/16" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/55 to-transparent p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.28em] text-white/40 uppercase">
              {label ?? product.category}
            </p>
            <p className="mt-2 text-sm tracking-[0.08em] text-white">
              {product.name}
            </p>
          </div>
          <span className="text-[10px] tracking-[0.28em] text-white/35 uppercase">
            Garçonmaires
          </span>
        </div>
      </div>
    </div>
  );
}
