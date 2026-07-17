import { clientType } from "@/components/pages/client-area-typography";

type AddToCartButtonProps = {
  label: string;
  disabledLabel: string;
  disabled?: boolean;
  tone?: "dark" | "light";
};

export function AddToCartButton({
  label,
  disabledLabel,
  disabled = true,
  tone = "dark",
}: AddToCartButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`w-full ${clientType.ctaBase} disabled:cursor-not-allowed ${
        tone === "light"
          ? "border-black/20 text-black/68"
          : "border-white/14 text-white/48"
      }`}
    >
      {disabled ? disabledLabel : label}
    </button>
  );
}
