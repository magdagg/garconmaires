import type { Metadata } from "next";
import { CartPage } from "@/components/pages/cart-page";
import {
  cartCheckoutNoindexMetadata,
  getCartCheckoutGate,
} from "@/lib/store/cart-checkout-gate";
import { isPreviewShopDemoEnabled } from "@/lib/preview-shop";

export const dynamic = "force-dynamic";

export const metadata: Metadata = cartCheckoutNoindexMetadata({
  title: "Cart | Garçonmaires",
  description: "The cart will be available once the first drop is released.",
});

export default async function Page() {
  return (
    <CartPage
      locale="en"
      gate={await getCartCheckoutGate()}
      previewDemo={isPreviewShopDemoEnabled()}
    />
  );
}
