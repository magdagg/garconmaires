"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useCart } from "@/components/providers/cart-provider";
import { BrandHeaderLogo } from "@/components/ui/brand-logo";
import {
  copy,
  defaultLocale,
  getLocaleFromPathname,
  type Locale,
  switchLocalePath,
  withLocalePath,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  locale?: Locale;
};

export function SiteHeader({ locale }: SiteHeaderProps) {
  const pathname = usePathname();
  const resolvedLocale = locale ?? getLocaleFromPathname(pathname) ?? defaultLocale;
  const t = copy[resolvedLocale].nav;
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartHref = resolvedLocale === "pl" ? "/koszyk" : "/en/cart";
  const accountHref = resolvedLocale === "pl" ? "/konto" : "/en/account";
  const links = [
    {
      href: withLocalePath("/play", resolvedLocale),
      label: "♠",
      mobileLabel: t.play,
      ariaLabel: t.play,
      isSymbol: true,
    },
    {
      href: withLocalePath("/collection", resolvedLocale),
      label: t.shop,
      mobileLabel: t.shop,
      ariaLabel: t.shop,
      isSymbol: false,
    },
  ];
  const mobileLinks = [
    ...links,
    {
      href: accountHref,
      label: t.account,
      mobileLabel: t.account,
      ariaLabel: t.account,
      isSymbol: false,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="relative grid h-[72px] w-full grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-6 md:grid-cols-[1fr_auto_1fr] md:px-8">
          <nav className="hidden items-center gap-7 justify-self-start md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.ariaLabel}
                className={cn(
                  link.isSymbol
                    ? "inline-flex min-w-7 items-center justify-center text-[2.35rem] leading-none text-white/60 hover:text-white"
                    : "font-label text-[11px] tracking-[0.22em] uppercase text-white/52 hover:text-white",
                  pathname === link.href && "text-white",
                  !link.isSymbol && "tracking-[0.22em] uppercase",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href={withLocalePath("/", resolvedLocale)}
            aria-label="Garçonmaires home"
            className="inline-flex items-center justify-self-start md:justify-self-center"
          >
            <BrandHeaderLogo
              className="header-logo-presence h-7 w-[12.75rem] sm:h-8 sm:w-[16rem]"
              priority
            />
          </Link>

          <div className="flex items-center justify-self-end gap-2 sm:gap-2.5">
            <div className="font-label hidden items-center gap-2 text-[10px] tracking-[0.22em] uppercase text-white/44 md:flex">
              <Link
                href={switchLocalePath(pathname || "/", "pl")}
                className={cn(resolvedLocale === "pl" && "text-white")}
              >
                PL
              </Link>
              <span>/</span>
              <Link
                href={switchLocalePath(pathname || "/", "en")}
                className={cn(resolvedLocale === "en" && "text-white")}
              >
                EN
              </Link>
            </div>
            <Link
              href={accountHref}
              aria-label={t.account}
              className={cn(
                "relative inline-flex h-9 w-9 items-center justify-center border border-white/8 text-white/58 transition-colors duration-200 hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-10 sm:w-10",
                pathname === accountHref && "border-white/32 text-white",
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-[17px] w-[17px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.55"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 12.25a3.65 3.65 0 1 0 0-7.3 3.65 3.65 0 0 0 0 7.3Z" />
                <path d="M5.75 20a6.55 6.55 0 0 1 12.5 0" />
              </svg>
            </Link>
            <Link
              href={cartHref}
              aria-label={`${t.cart}: ${itemCount}`}
              className={cn(
                "relative inline-flex h-9 w-9 items-center justify-center border border-white/8 text-white/58 transition-colors duration-200 hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-10 sm:w-10",
                pathname === cartHref && "border-white/32 text-white",
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-[17px] w-[17px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 8h10l-.9 10H7.9L7 8Z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
              {itemCount > 0 ? (
                <span className="font-label absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center border border-black bg-white px-1 text-[9px] leading-none text-black">
                  {itemCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="font-label border border-white/8 px-3 py-2 text-[10px] tracking-[0.22em] uppercase text-white/68 transition-colors hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
            >
              {t.menu}
            </button>
          </div>
        </div>
        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          links={mobileLinks}
          closeLabel={t.close}
        />
      </header>
    </>
  );
}
