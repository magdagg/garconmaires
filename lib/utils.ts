export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(value: number, locale: "pl" | "en" = "pl") {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);
}
