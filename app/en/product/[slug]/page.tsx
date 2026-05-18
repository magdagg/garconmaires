import type { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata({
  params: _params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return {
    title: "Garçonmaires",
    description: "Product pages will be available once the first drop is released.",
  };
}

export default async function Page({
  params: _params,
}: {
  params: Promise<{ slug: string }>;
}) {
  redirect("/en");
}
