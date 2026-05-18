import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Garçonmaires",
  description: "The collection page will open once the first drop is ready.",
};

export default function Page() {
  redirect("/en");
}
