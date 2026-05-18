import type { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params: _params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return {
    title: "Garçonmaires",
    description:
      "Karty produktów zostaną udostępnione po premierze pierwszego dropu.",
  };
}

export default async function Page({
  params: _params,
}: {
  params: Promise<{ slug: string }>;
}) {
  redirect("/");
}
