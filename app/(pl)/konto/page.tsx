import type { Metadata } from "next";
import { CustomerAccountClient } from "@/components/pages/customer-account-client";

export const metadata: Metadata = {
  title: "Konto | Garçonmaires",
  description: "Panel konta Garçonmaires jest przygotowywany dla przyszłego dropu.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <CustomerAccountClient locale="pl" mode="dashboard" />;
}
