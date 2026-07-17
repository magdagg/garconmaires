import type { Metadata } from "next";
import { OrderStatusPage } from "@/components/pages/order-status-page";

export const metadata: Metadata = {
  title: "Status zamowienia | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <OrderStatusPage locale="pl" />;
}
