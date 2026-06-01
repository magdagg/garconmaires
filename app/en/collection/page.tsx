import type { Metadata } from "next";
import { CollectionPage } from "@/components/collection/collection-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Collection",
  description: copy.en.collectionPage.description,
  alternates: {
    canonical: "https://garconmaires.com/en/collection",
  },
  openGraph: {
    url: "https://garconmaires.com/en/collection",
  },
};

export default function Page() {
  return <CollectionPage locale="en" />;
}
