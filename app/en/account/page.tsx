import type { Metadata } from "next";
import { AccountPage } from "@/components/pages/account-page";

export const metadata: Metadata = {
  title: "Account | Garçonmaires",
  description: "The Garçonmaires account area is being prepared for a future drop.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  const items = [
    {
      title: "Login",
      href: "/en/account/login",
      description: "Account access will become available when the store launches.",
    },
    {
      title: "Register",
      href: "/en/account/register",
      description: "Client accounts will open with the ready Garçonmaires store.",
    },
    {
      title: "My orders",
      href: "/en/account/orders",
      description: "Purchase history will be available after the first sale.",
    },
    {
      title: "Customer details",
      href: "/en/account/details",
      description: "Contact details and preferences are being prepared.",
    },
    {
      title: "Delivery addresses",
      href: "/en/account/addresses",
      description: "Saved delivery addresses will be enabled with client accounts.",
    },
    {
      title: "Returns and complaints",
      href: "/en/account/returns",
      description: "Return handling will connect to real orders after launch.",
    },
  ];

  return (
    <AccountPage
      eyebrow="Account"
      title="The Garçonmaires client account is currently being prepared."
      description="Soon, you will be able to access your orders, delivery details and purchase history. During pre-launch, this area remains a frontend structure for the future store."
      items={items}
      collectionHref="/en/collection"
      cartHref="/en/cart"
      collectionLabel="Collection"
      cartLabel="Cart"
    />
  );
}
