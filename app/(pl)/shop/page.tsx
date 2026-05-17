import type { Metadata } from "next";
import { ShopPage } from "@/components/shop/shop-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Sklep",
  description: copy.pl.shop.description,
};

export default function Page() {
  return <ShopPage locale="pl" />;
}
