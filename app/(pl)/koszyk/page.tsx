import type { Metadata } from "next";
import { CartPage } from "@/components/pages/cart-page";
import {
  cartCheckoutNoindexMetadata,
  getCartCheckoutGate,
} from "@/lib/store/cart-checkout-gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = cartCheckoutNoindexMetadata({
  title: "Koszyk | Garçonmaires",
  description: "Koszyk Garçonmaires pozostaje zablokowany do startu DROP 01.",
});

export default async function Page() {
  return <CartPage locale="pl" gate={await getCartCheckoutGate()} />;
}
