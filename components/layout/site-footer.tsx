"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandIcon, BrandWordmark } from "@/components/ui/brand-logo";
import {
  getLocaleFromPathname,
  switchLocalePath,
  withLocalePath,
} from "@/lib/i18n";
import { footerGroups } from "@/lib/store-pages";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const footer = footerGroups[locale];

  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="site-shell grid gap-12 px-4 py-12 md:grid-cols-[0.9fr_1.1fr] md:px-6">
        <div className="space-y-5">
          <BrandIcon className="opacity-90" />
          <BrandWordmark className="h-8 w-[16rem] sm:h-10 sm:w-[22rem]" />
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
              {locale === "pl" ? "Nawigacja" : "Navigation"}
            </p>
            <div className="flex flex-col gap-3 text-sm text-white/72">
              {footer.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={withLocalePath(item.href, locale)}
                  className="hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
              {locale === "pl" ? "Pomoc" : "Help"}
            </p>
            <div className="flex flex-col gap-3 text-sm text-white/72">
              {footer.help.map((item) => (
                <Link
                  key={item.href}
                  href={withLocalePath(item.href, locale)}
                  className="hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
              {locale === "pl" ? "Informacje prawne" : "Legal"}
            </p>
            <div className="space-y-2 text-sm leading-7 text-white/72">
              {footer.legal.map((item) => (
                <Link
                  key={item.href}
                  href={withLocalePath(item.href, locale)}
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
        <div className="site-shell grid gap-6 px-4 py-4 text-xs tracking-[0.24em] text-white/35 uppercase md:grid-cols-[1fr_auto] md:items-center md:px-6">
          <div className="space-y-2">
            <p>{locale === "pl" ? "Garçonmaires Studio" : "Garçonmaires Studio"}</p>
            <div className="space-y-2 text-sm leading-7 text-white/72">
              <p>studio@garconmaires.com</p>
              <p>Warsaw</p>
              <div className="flex items-center gap-2 pt-2 text-xs tracking-[0.24em] uppercase text-white/44">
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
            </div>
          </div>
          <p className="justify-self-start md:justify-self-end">Garconmaires.com</p>
        </div>
      </div>
    </footer>
  );
}
