import type { Metadata } from "next";
import { CollectionPage } from "@/components/collection/collection-page";
import { copy } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Kolekcja",
  description: copy.pl.collectionPage.description,
  alternates: {
    canonical: "https://garconmaires.com/kolekcja",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    url: "https://garconmaires.com/kolekcja",
  },
};

export default function Page() {
  return <CollectionPage locale="pl" />;
}
