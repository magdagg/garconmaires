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
  description: copy.pl.metaDescription,
  applicationName: "Garçonmaires",
  alternates: {
    canonical: "/",
    languages: {
      "pl-PL": "/",
      "en-US": "/en",
    },
  },
  openGraph: {
    title: "Garçonmaires",
    description: copy.pl.metaDescription,
    url: "https://garconmaires.com",
    siteName: "Garçonmaires",
    locale: "pl_PL",
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
      locale="pl"
      className={`${sans.variable} ${label.variable} h-full scroll-smooth antialiased`}
    >
      {children}
    </RootShell>
  );
}
