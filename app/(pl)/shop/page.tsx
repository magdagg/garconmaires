import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Garçonmaires",
  description:
    "Strona kolekcji zostanie udostępniona po premierze pierwszego dropu.",
};

export default function Page() {
  redirect("/");
}
