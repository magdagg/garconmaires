type AddToCartButtonProps = {
  label: string;
  disabledLabel: string;
  disabled?: boolean;
};

export function AddToCartButton({
  label,
  disabledLabel,
  disabled = true,
}: AddToCartButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="w-full border border-white/12 px-6 py-4 text-xs tracking-[0.28em] text-white/35 uppercase disabled:cursor-not-allowed"
    >
      {disabled ? disabledLabel : label}
    </button>
  );
}
