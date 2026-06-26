import type { Metadata } from "next";
import { AccountPlaceholderPage } from "@/components/pages/account-placeholder-page";

export const metadata: Metadata = {
  title: "Register | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <AccountPlaceholderPage
      eyebrow="Account"
      title="Register"
      description="This feature will become available when the Garçonmaires store launches."
      accountHref="/en/account"
      accountLabel="Back to account"
    />
  );
}
