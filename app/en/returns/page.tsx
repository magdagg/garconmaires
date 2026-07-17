import type { Metadata } from "next";
import { InfoPage } from "@/components/pages/info-page";
import { ReturnsComplaintsForm } from "@/components/pages/returns-complaints-form";
import { storePages } from "@/lib/store-pages";

const page = storePages.en.returns;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <>
      <InfoPage page={page} />
      <ReturnsComplaintsForm locale="en" />
    </>
  );
}
