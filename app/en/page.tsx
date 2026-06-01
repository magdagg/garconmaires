import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";
import {
  homepageSeo,
  homepageOgImage,
  homepageStructuredData,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: homepageSeo.en.title,
  },
  description: homepageSeo.en.description,
  keywords: [...homepageSeo.en.keywords],
  alternates: {
    canonical: "https://garconmaires.com/en",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: homepageSeo.en.title,
    description: homepageSeo.en.description,
    url: "https://garconmaires.com/en",
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
    title: homepageSeo.en.title,
    description: homepageSeo.en.description,
    images: [homepageOgImage],
  },
};

export default function Page() {
  return (
    <>
      <HomePage locale="en" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageStructuredData),
        }}
      />
    </>
  );
}
