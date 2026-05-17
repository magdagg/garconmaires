import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartProvider } from "@/components/providers/cart-provider";

type RootShellProps = {
  children: ReactNode;
  locale: "pl" | "en";
  className: string;
};

export function RootShell({ children, locale, className }: RootShellProps) {
  return (
    <html lang={locale} className={className}>
      <body className="min-h-full bg-black text-white">
        <CartProvider>
          <div className="relative flex min-h-screen flex-col bg-black text-white">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
