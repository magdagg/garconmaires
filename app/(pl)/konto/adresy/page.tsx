import type { Metadata } from "next";
import { AccountPlaceholderPage } from "@/components/pages/account-placeholder-page";

export const metadata: Metadata = {
  title: "Adresy dostawy | Garçonmaires",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <AccountPlaceholderPage
      eyebrow="Konto"
      title="Adresy dostawy"
      description="Ta funkcja zostanie udostępniona przy uruchomieniu sklepu Garçonmaires."
      accountHref="/konto"
      accountLabel="Wróć do konta"
    />
  );
}
