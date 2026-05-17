import type { Metadata } from "next";
import { CheckoutSuccessPage } from "@/components/pages/checkout-success-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: copy.en.success.title,
  description: copy.en.success.description,
};

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  return <CheckoutSuccessPage locale="en" searchParams={searchParams} />;
}
