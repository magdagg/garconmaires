import type { Metadata } from "next";
import { AccountPlaceholderPage } from "@/components/pages/account-placeholder-page";

export const metadata: Metadata = {
  title: "My orders | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <AccountPlaceholderPage
      eyebrow="Account"
      title="My orders"
      description="This feature will become available when the Garçonmaires store launches."
      accountHref="/en/account"
      accountLabel="Back to account"
    />
  );
}
