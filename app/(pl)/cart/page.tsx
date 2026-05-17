import type { Metadata } from "next";
import { CartPage } from "@/components/pages/cart-page";

export const metadata: Metadata = {
  title: "Koszyk",
  description: "Przejrzyj wybrane produkty Garçonmaires i przejdź do płatności.",
};

export default function Page() {
  return <CartPage locale="pl" />;
}
