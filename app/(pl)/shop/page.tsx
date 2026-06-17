import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Kolekcja | Garçonmaires",
  description: "Preview kolekcji DROP 01.",
};

export default function Page() {
  redirect("/kolekcja");
}
