import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";
import {
  homepageSeo,
  homepageOgImage,
  homepageStructuredData,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: homepageSeo.pl.title,
  },
  description: homepageSeo.pl.description,
  keywords: [...homepageSeo.pl.keywords],
  alternates: {
    canonical: "https://garconmaires.com/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: homepageSeo.pl.title,
    description: homepageSeo.pl.description,
    url: "https://garconmaires.com",
    type: "website",
    images: [
      {
        url: homepageOgImage,
        alt: "Garçonmaires eyewear from the first collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homepageSeo.pl.title,
    description: homepageSeo.pl.description,
    images: [homepageOgImage],
  },
};

export default function Page() {
  return (
    <>
      <HomePage locale="pl" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageStructuredData),
        }}
      />
    </>
  );
}
