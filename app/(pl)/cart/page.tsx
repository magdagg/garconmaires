import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Garçonmaires",
  description: "Koszyk zostanie udostępniony po premierze pierwszego dropu.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  redirect("/koszyk");
}
