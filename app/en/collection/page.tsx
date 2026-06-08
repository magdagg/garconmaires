import type { Metadata } from "next";
import { CollectionPage } from "@/components/collection/collection-page";
import { copy } from "@/lib/i18n";
import { getPublicCatalogState } from "@/lib/store/public-catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const catalog = await getPublicCatalogState();

  return {
    title: "Collection",
    description: copy.en.collectionPage.description,
    alternates: {
      canonical: "https://garconmaires.com/en/collection",
    },
    robots: {
      index: catalog.storefrontLive,
      follow: catalog.storefrontLive,
    },
    openGraph: {
      url: "https://garconmaires.com/en/collection",
    },
  };
}

export default async function Page() {
  const catalog = await getPublicCatalogState();

  return (
    <CollectionPage
      locale="en"
      products={catalog.products}
      storefrontLive={catalog.storefrontLive}
    />
  );
}
