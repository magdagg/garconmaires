import type { Metadata } from "next";
import { CartPage } from "@/components/pages/cart-page";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your selected Garçonmaires pieces and continue to checkout.",
};

export default function Page() {
  return <CartPage locale="en" />;
}
