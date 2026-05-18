import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Garçonmaires",
  description: "The cart will be available once the first drop is released.",
};

export default function Page() {
  redirect("/en");
}
