"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { BrandHeaderLogo } from "@/components/ui/brand-logo";
import {
  copy,
  getLocaleFromPathname,
  switchLocalePath,
  withLocalePath,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = copy[locale].nav;
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    {
      href: withLocalePath("/play", locale),
      label: "♠",
      mobileLabel: t.play,
      ariaLabel: t.play,
      isSymbol: true,
    },
    { href: withLocalePath("/about", locale), label: t.about },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="site-shell relative grid h-[72px] grid-cols-[1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_auto_1fr] md:px-6">
          <nav className="hidden items-center gap-7 justify-self-start md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.ariaLabel}
                className={cn(
                  "text-[11px] tracking-[0.24em] uppercase text-white/52 hover:text-white",
                  pathname === link.href && "text-white",
                  link.isSymbol && "text-base tracking-normal",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href={withLocalePath("/", locale)}
            className="justify-self-start md:justify-self-center"
          >
            <BrandHeaderLogo
              className="header-logo-presence h-7 w-[12.75rem] sm:h-8 sm:w-[16rem]"
              priority
            />
          </Link>

          <div className="flex items-center justify-self-end gap-3">
            <div className="hidden items-center gap-2 text-[10px] tracking-[0.24em] uppercase text-white/44 md:flex">
              <Link
                href={switchLocalePath(pathname || "/", "pl")}
                className={cn(locale === "pl" && "text-white")}
              >
                PL
              </Link>
              <span>/</span>
              <Link
                href={switchLocalePath(pathname || "/", "en")}
                className={cn(locale === "en" && "text-white")}
              >
                EN
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="border border-white/10 px-3 py-2 text-[11px] tracking-[0.24em] uppercase text-white/80 hover:border-white hover:bg-white hover:text-black md:hidden"
            >
              {t.menu}
            </button>
          </div>
        </div>
        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          links={links}
          closeLabel={t.close}
        />
      </header>
    </>
  );
}
