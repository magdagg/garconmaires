type SizeSelectorProps = {
  label: string;
  sizes: string[];
  disabled?: boolean;
};

export function SizeSelector({ label, sizes, disabled = false }: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            disabled={disabled}
            className="min-h-11 min-w-14 border border-white/12 px-4 text-xs tracking-[0.22em] text-white/60 uppercase disabled:text-white/28"
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
