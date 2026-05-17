import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";
import { storePages } from "@/lib/store-pages";

const page = storePages.en.payments;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
};

export default function Page() {
  return <InfoPage page={page} />;
}
