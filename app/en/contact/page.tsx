import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/contact-page";
import { copy } from "@/lib/i18n";

export const metadata: Metadata = {
  title: copy.en.contact.title,
  description: copy.en.contact.description,
};

export default function Page() {
  return <ContactPage locale="en" />;
}
