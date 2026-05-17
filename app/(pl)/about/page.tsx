import type { Metadata } from "next";
import { AboutPage } from "@/components/pages/about-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: copy.pl.about.title,
  description: copy.pl.about.description,
};

export default function Page() {
  return <AboutPage locale="pl" />;
}
