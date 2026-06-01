"use client";

import type { Locale } from "@/lib/i18n";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";

type FooterNewsletterProps = {
  locale: Locale;
};

const copyByLocale = {
  pl: {
    eyebrow: "EARLY ACCESS",
    title: "Dołącz przed pierwszym dropem.",
    body: "Zapisz się, żeby dostać informację o premierze, próbkach i dostępności DROP 01.",
  },
  en: {
    eyebrow: "EARLY ACCESS",
    title: "Join before the first drop.",
    body: "Sign up for launch notes, sample previews, and DROP 01 availability.",
  },
} satisfies Record<
  Locale,
  {
    title: string;
    eyebrow: string;
    body: string;
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
              submitLabel={locale === "pl" ? "Zapisz się" : "Sign up"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
