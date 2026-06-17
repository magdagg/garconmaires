import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Collection | Garçonmaires",
  description: "DROP 01 collection preview.",
};

export default function Page() {
  redirect("/en/collection");
}
