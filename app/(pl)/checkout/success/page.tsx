import type { Metadata } from "next";
import { CheckoutSuccessPage } from "@/components/pages/checkout-success-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: copy.pl.success.title,
  description: copy.pl.success.description,
};

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  return <CheckoutSuccessPage locale="pl" searchParams={searchParams} />;
}
