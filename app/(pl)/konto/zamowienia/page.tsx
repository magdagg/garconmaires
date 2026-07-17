import type { Metadata } from "next";
import { CustomerAccountClient } from "@/components/pages/customer-account-client";

export const metadata: Metadata = {
  title: "Moje zamówienia | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <CustomerAccountClient locale="pl" mode="orders" />;
}
