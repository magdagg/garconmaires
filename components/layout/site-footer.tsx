"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
import { BrandIcon, BrandWordmark } from "@/components/ui/brand-logo";
import {
  defaultLocale,
  getLocaleFromPathname,
  type Locale,
  switchLocalePath,
  withLocalePath,
} from "@/lib/i18n";
import { footerGroups } from "@/lib/store-pages";
import { cn } from "@/lib/utils";

type SiteFooterProps = {
  locale?: Locale;
};

export function SiteFooter({ locale }: SiteFooterProps) {
  const pathname = usePathname();
  const resolvedLocale = locale ?? getLocaleFromPathname(pathname) ?? defaultLocale;
  const footer = footerGroups[resolvedLocale];
  const cookieSettingsLabel =
    resolvedLocale === "pl" ? "Ustawienia cookie" : "Cookie settings";

  return (
    <footer className="border-t border-white/10 bg-black">
      <FooterNewsletter locale={resolvedLocale} />
      <div className="site-shell grid gap-12 px-4 py-12 md:grid-cols-[0.9fr_1.1fr] md:px-6">
        <div className="space-y-5">
          <BrandIcon className="h-20 w-16 opacity-90 sm:h-24 sm:w-20" />
          <BrandWordmark className="h-12 w-[24rem] sm:h-16 sm:w-[34rem]" />
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <p className="font-label text-[11px] tracking-[0.24em] text-white/40 uppercase">
              {resolvedLocale === "pl" ? "Nawigacja" : "Navigation"}
            </p>
            <div className="flex flex-col gap-3 text-sm text-white/72">
              {footer.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={withLocalePath(item.href, resolvedLocale)}
                  className="hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-label text-[11px] tracking-[0.24em] text-white/40 uppercase">
              {resolvedLocale === "pl" ? "Pomoc" : "Help"}
            </p>
            <div className="flex flex-col gap-3 text-sm text-white/72">
              {footer.help.map((item) => (
                <Link
                  key={item.href}
                  href={withLocalePath(item.href, resolvedLocale)}
                  className="hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-label text-[11px] tracking-[0.24em] text-white/40 uppercase">
              {resolvedLocale === "pl" ? "Informacje prawne" : "Legal"}
            </p>
            <div className="space-y-2 text-sm leading-7 text-white/72">
              {footer.legal.map((item) => (
                <Link
                  key={item.href}
                  href={withLocalePath(item.href, resolvedLocale)}
                  className="block hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="font-label site-shell grid gap-6 px-4 py-4 text-[11px] tracking-[0.22em] text-white/35 uppercase md:grid-cols-[1fr_auto] md:items-center md:px-6">
          <div className="space-y-2">
            <p>{resolvedLocale === "pl" ? "Garçonmaires Studio" : "Garçonmaires Studio"}</p>
            <div className="space-y-2 text-sm leading-7 text-white/72">
              <p>studio@garconmaires.com</p>
              <p>Warsaw</p>
              <button
                type="button"
                data-cookie-settings-trigger="true"
                className="block text-left text-sm leading-7 text-white/72 hover:text-white"
              >
                {cookieSettingsLabel}
              </button>
              <div className="flex items-center gap-2 pt-2 text-[11px] tracking-[0.22em] uppercase text-white/44">
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
            </div>
          </div>
          <p className="justify-self-start md:justify-self-end">Garconmaires.com</p>
        </div>
      </div>
    </footer>
  );
}
