import type { Metadata } from "next";
import { CollectionPage } from "@/components/collection/collection-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Kolekcja",
  description: copy.pl.collectionPage.description,
  alternates: {
    canonical: "https://garconmaires.com/kolekcja",
  },
  openGraph: {
    url: "https://garconmaires.com/kolekcja",
  },
};

export default function Page() {
  return <CollectionPage locale="pl" />;
}
