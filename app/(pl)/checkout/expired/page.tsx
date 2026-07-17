import type { Metadata } from "next";
import { CheckoutStatePage } from "@/components/pages/checkout-state-page";

export const metadata: Metadata = {
  title: "Platnosc wygasla | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <CheckoutStatePage locale="pl" state="expired" />;
}
