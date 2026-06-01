"use client";

import { SiteHeader } from "@/components/layout/site-header";
import type { Locale } from "@/lib/i18n";

type SiteHeaderShellProps = {
  locale: Locale;
};

export function SiteHeaderShell({ locale }: SiteHeaderShellProps) {
  return <SiteHeader locale={locale} />;
}
