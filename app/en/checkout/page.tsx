import type { Metadata } from "next";
import { CheckoutPage } from "@/components/pages/checkout-page";
import {
  cartCheckoutNoindexMetadata,
  getCartCheckoutGate,
} from "@/lib/store/cart-checkout-gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = cartCheckoutNoindexMetadata({
  title: "Checkout | Garçonmaires",
  description: "Garçonmaires checkout remains blocked until DROP 01 launches.",
});

export default async function Page() {
  return <CheckoutPage locale="en" gate={await getCartCheckoutGate()} />;
}
