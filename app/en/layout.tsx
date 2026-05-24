import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { RootShell } from "@/components/layout/root-shell";
import { copy } from "@/lib/i18n";
import "../globals.css";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const label = IBM_Plex_Mono({
  variable: "--font-label",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://garconmaires.com"),
  title: {
    default: "Garçonmaires",
    template: "%s | Garçonmaires",
  },
  description: copy.en.metaDescription,
  applicationName: "Garçonmaires",
  alternates: {
    canonical: "/en",
    languages: {
      "pl-PL": "/",
      "en-US": "/en",
    },
  },
  openGraph: {
    title: "Garçonmaires",
    description: copy.en.metaDescription,
    url: "https://garconmaires.com/en",
    siteName: "Garçonmaires",
    locale: "en_US",
    type: "website",
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootShell
      locale="en"
      className={`${sans.variable} ${label.variable} h-full scroll-smooth antialiased`}
    >
      {children}
    </RootShell>
  );
}
