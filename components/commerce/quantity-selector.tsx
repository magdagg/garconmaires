type QuantitySelectorProps = {
  label: string;
  value?: number;
  disabled?: boolean;
};

export function QuantitySelector({
  label,
  value = 1,
  disabled = false,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs tracking-[0.18em] text-white/45 uppercase">{label}</p>
      <div className="grid grid-cols-[44px_44px_44px] border border-white/12 text-center">
        <button type="button" disabled={disabled} className="h-11 text-white/50 disabled:text-white/24">
          -
        </button>
        <output className="grid h-11 place-items-center border-x border-white/12 text-sm text-white/80">
          {value}
        </output>
        <button type="button" disabled={disabled} className="h-11 text-white/50 disabled:text-white/24">
          +
        </button>
      </div>
    </div>
  );
}
