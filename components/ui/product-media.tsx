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
}: ProductMediaProps) {
  return (
    <div
      className={cn(
        "group grain relative overflow-hidden border border-white/10 bg-black",
        compact ? "aspect-[4/5]" : "aspect-[4/5] min-h-[300px]",
      )}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 50% 18%, ${product.tones.highlight}55, transparent 24%), linear-gradient(145deg, ${product.tones.base} 0%, #020202 58%, ${product.tones.highlight} 100%)`,
        }}
      />
      <div className="absolute inset-x-5 top-5 h-px bg-white/14" />
      <div className="absolute inset-y-5 left-5 w-px bg-white/10" />
      <div className="absolute right-5 top-5 h-12 w-px bg-white/10" />
      <div className="absolute right-5 top-5 w-12 border-t border-white/12" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/55 to-transparent" />
    </div>
  );
}
