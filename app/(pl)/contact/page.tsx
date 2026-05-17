import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/contact-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: copy.pl.contact.title,
  description: copy.pl.contact.description,
};

export default function Page() {
  return <ContactPage locale="pl" />;
}
