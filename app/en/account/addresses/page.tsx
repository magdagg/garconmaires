import type { Metadata } from "next";
import { CustomerAccountClient } from "@/components/pages/customer-account-client";

export const metadata: Metadata = {
  title: "Delivery addresses | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <CustomerAccountClient locale="en" mode="addresses" />;
}
