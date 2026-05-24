"use client";

import Link from "next/link";
import { BrandWordmark } from "@/components/ui/brand-logo";
import { SectionHeading } from "@/components/ui/section-heading";
import { copy, withLocalePath, type Locale } from "@/lib/i18n";

export function HomePage({ locale = "pl" }: { locale?: Locale }) {
  const t = copy[locale].home;

  return (
    <div className="bg-black text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10 bg-black">
        <video
          className="block w-full h-auto"
          src="/brand/home-hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="grain absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_30%),linear-gradient(180deg,#090909_0%,#030303_100%)]" />
        <div className="site-shell relative grid min-h-[calc(100svh-72px)] items-center gap-16 px-4 py-20 md:grid-cols-[0.95fr_1.05fr] md:px-6 md:py-28">
          <div className="hero-reveal max-w-xl space-y-8">
            <p className="font-label text-[11px] tracking-[0.24em] text-white/40 uppercase">
              {t.eyebrow}
            </p>
            <BrandWordmark
              priority
              className="h-14 w-full max-w-[21rem] sm:h-20 sm:max-w-[34rem]"
            />
            <h1 className="font-display whitespace-pre-line text-4xl leading-[0.98] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>
            <p className="max-w-lg whitespace-pre-line text-sm leading-8 text-white/62 sm:text-base">
              {t.description}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={withLocalePath("/about", locale)}
                className="font-label inline-flex items-center justify-center bg-white px-7 py-4 text-[11px] tracking-[0.22em] uppercase text-black hover:opacity-85"
              >
                {t.primaryCta}
              </Link>
              <Link
                href={withLocalePath("/about", locale)}
                className="font-label inline-flex items-center justify-center border border-white/20 px-7 py-4 text-[11px] tracking-[0.22em] uppercase text-white hover:bg-white hover:text-black"
              >
                {t.secondaryCta}
              </Link>
            </div>
          </div>

          <SectionHeading
            eyebrow={t.featuredEyebrow}
            title={t.featuredTitle}
            description={t.featuredDescription}
          />
        </div>
      </section>
    </div>
  );
}
