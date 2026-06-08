import type { Metadata } from "next";
import { CheckoutPage } from "@/components/pages/checkout-page";
import {
  cartCheckoutNoindexMetadata,
  getCartCheckoutGate,
} from "@/lib/store/cart-checkout-gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = cartCheckoutNoindexMetadata({
  title: "Checkout | Garçonmaires",
  description: "Checkout Garçonmaires pozostaje zablokowany do startu DROP 01.",
});

export default async function Page() {
  return <CheckoutPage locale="pl" gate={await getCartCheckoutGate()} />;
}
