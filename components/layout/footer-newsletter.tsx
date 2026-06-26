"use client";

import type { Locale } from "@/lib/i18n";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";

type FooterNewsletterProps = {
  locale: Locale;
};

const copyByLocale = {
  pl: {
    eyebrow: "PRIVATE LIST",
    title: "Wejdź na prywatną listę DROP 01.",
    body: "Dostaniesz pierwszy sygnał o dacie premiery, modelach i dostępności. Sprzedaż pozostaje zamknięta do publicznego launchu.",
    submit: "Dołącz do listy",
    success: "Jesteś na liście DROP 01.",
  },
  en: {
    eyebrow: "PRIVATE LIST",
    title: "Enter the DROP 01 private list.",
    body: "Get the first signal on the release date, pieces, and availability. Sales stay closed until the public launch.",
    submit: "Join the list",
    success: "You are on the DROP 01 list.",
  },
} satisfies Record<
  Locale,
  {
    title: string;
    eyebrow: string;
    body: string;
    submit: string;
    success: string;
  }
>;

export function FooterNewsletter({ locale }: FooterNewsletterProps) {
  const t = copyByLocale[locale];

  return (
    <section id="newsletter" className="border-b border-white/10">
      <div className="site-shell px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="space-y-3">
            <p className="font-label text-[10px] tracking-[0.24em] text-white/42 uppercase">
              {t.eyebrow}
            </p>
            <h2 className="font-display text-3xl leading-tight text-white sm:text-5xl">
              {t.title}
            </h2>
            <p className="mx-auto max-w-2xl text-[15px] leading-8 text-white/72 sm:text-[16px]">
              {t.body}
            </p>
          </div>

          <div className="mx-auto max-w-2xl">
            <NewsletterForm
              source="homepage-early-access"
              language={locale}
              variant="footer"
              submitLabel={t.submit}
              successMessage={t.success}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
