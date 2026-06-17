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
        "group grain relative overflow-hidden border border-white/10 bg-[#030303]",
        compact ? "aspect-[4/5]" : "aspect-[4/5] min-h-[340px]",
      )}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 18%, ${product.tones.highlight}42, transparent 24%), linear-gradient(145deg, #000 0%, ${product.tones.base} 48%, #050505 100%)`,
        }}
      />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.045] to-transparent" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.imageUrl}
        alt={product.imageAlt}
        className="absolute inset-0 h-full w-full object-contain p-5 transition duration-700 group-hover:scale-[1.018] sm:p-7"
      />
      <div className="absolute inset-x-5 top-5 h-px bg-white/14" />
      <div className="absolute inset-y-5 left-5 w-px bg-white/10" />
      <div className="absolute right-5 top-5 h-12 w-px bg-white/10" />
      <div className="absolute right-5 top-5 w-12 border-t border-white/12" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/60 to-transparent" />
    </div>
  );
}
