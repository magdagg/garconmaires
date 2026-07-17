import type { Metadata } from "next";
import { CheckoutStatePage } from "@/components/pages/checkout-state-page";

export const metadata: Metadata = {
  title: "Payment failed | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <CheckoutStatePage locale="en" state="failed" />;
}
