import type { Metadata } from "next";
import { AccountPage } from "@/components/pages/account-page";

export const metadata: Metadata = {
  title: "Konto | Garçonmaires",
  description: "Panel konta Garçonmaires jest przygotowywany dla przyszłego dropu.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  const items = [
    {
      title: "Logowanie",
      href: "/konto/logowanie",
      description: "Dostęp do panelu zostanie aktywowany przy uruchomieniu sklepu.",
    },
    {
      title: "Rejestracja",
      href: "/konto/rejestracja",
      description: "Konta klientów pojawią się razem z gotowym sklepem Garçonmaires.",
    },
    {
      title: "Moje zamówienia",
      href: "/konto/zamowienia",
      description: "Historia zakupów będzie dostępna po starcie sprzedaży.",
    },
    {
      title: "Dane klienta",
      href: "/konto/dane",
      description: "Dane kontaktowe i preferencje pozostają na razie w przygotowaniu.",
    },
    {
      title: "Adresy dostawy",
      href: "/konto/adresy",
      description: "Adresy będzie można zapisać po uruchomieniu kont klientów.",
    },
    {
      title: "Zwroty i reklamacje",
      href: "/konto/zwroty",
      description: "Obsługa zwrotów zostanie podpięta do prawdziwych zamówień.",
    },
  ];

  return (
    <AccountPage
      eyebrow="Konto"
      title="Panel klienta Garçonmaires jest w przygotowaniu."
      description="Wkrótce będzie można sprawdzać zamówienia, dane dostawy i historię zakupów. Na etapie pre-launch konto pozostaje wyłącznie strukturą pod przyszły sklep."
      items={items}
      collectionHref="/kolekcja"
      cartHref="/koszyk"
      collectionLabel="Kolekcja"
      cartLabel="Koszyk"
    />
  );
}
