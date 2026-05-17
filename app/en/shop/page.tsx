import type { Metadata } from "next";
import { ShopPage } from "@/components/shop/shop-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: copy.en.shop.eyebrow,
  description: copy.en.shop.description,
};

export default function Page() {
  return <ShopPage locale="en" />;
}
