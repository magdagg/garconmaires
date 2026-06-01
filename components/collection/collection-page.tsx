import { Space_Grotesk } from "next/font/google";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { copy, type Locale } from "@/lib/i18n";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
});

function HeroVisual() {
  return (
    <div className="relative min-h-[32rem] overflow-hidden bg-black md:min-h-[calc(100svh-72px)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_22%,rgba(255,255,255,0.09),transparent_24%),radial-gradient(circle_at_24%_68%,rgba(255,255,255,0.045),transparent_22%),linear-gradient(135deg,#101010_0%,#020202_58%,#080808_100%)]" />
      <div className="absolute inset-x-[10%] top-[18%] h-px bg-white/12" />
      <div className="absolute inset-y-[18%] right-[18%] w-px bg-white/10" />
      <div className="absolute right-[12%] bottom-[18%] max-w-[18rem] text-right">
        <p className="mt-4 text-5xl leading-none font-medium text-white/70 md:text-7xl">
          DROP 01
        </p>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.76)_34%,rgba(0,0,0,0.18)_72%,rgba(0,0,0,0.58)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.04),transparent_18%)]" />
    </div>
  );
}

function EditorialPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(180deg,#020202_0%,#000000_100%)]" />
      <div className="absolute inset-x-8 top-8 h-px bg-white/12" />
      <div className="absolute inset-y-8 left-8 w-px bg-white/10" />
      <div className="absolute right-8 bottom-8 left-8">
        <p className="font-label text-[10px] tracking-[0.3em] text-white/36 uppercase">
          {label}
        </p>
        <p className="mt-4 text-4xl leading-none font-medium text-white/70">
          Garçonmaires
        </p>
      </div>
    </div>
  );
}

function DirectionCopyBlock({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col justify-end gap-5 border-t border-white/10 pt-5 md:border-t-0 md:pt-0">
      <div className="space-y-3">
        <p className="font-label text-[10px] tracking-[0.3em] text-white/38 uppercase">
          {label}
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <h2 className="font-display text-3xl leading-none text-white sm:text-4xl">
            {title}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-white/56">{body}</p>
      </div>
    </div>
  );
}

export function CollectionPage({ locale = "pl" }: { locale?: Locale }) {
  const t = copy[locale].collectionPage;
  const newsletter = copy[locale].home;

  return (
    <div className="bg-black text-white">
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-white/10">
        <HeroVisual />

        <div className="pointer-events-none absolute inset-0 flex items-end">
          <div className="site-shell w-full px-4 pb-10 pt-24 md:px-6 md:pb-14 md:pt-28">
            <div className="max-w-xl">
              <h1
                className={`${spaceGrotesk.className} hero-reveal font-bold text-[4.5rem] leading-[0.82] tracking-[-0.08em] text-white sm:text-[6.5rem] md:text-[8.5rem]`}
              >
                {t.title}
              </h1>
              <div className="hero-reveal-delay mt-8 max-w-sm space-y-4 border-l border-white/16 pl-5">
                <p className="font-label text-[10px] tracking-[0.28em] text-white/40 uppercase">
                  {t.leadCategory}
                </p>
                <h2 className="font-display text-2xl leading-tight text-white sm:text-3xl">
                  {t.leadName}
                </h2>
                <p className="text-sm leading-7 text-white/62">{t.leadDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell px-4 py-10 md:px-6 md:py-16">
        <div className="grid gap-px bg-white/8 md:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-black px-0 py-0">
            <EditorialPlaceholder label="01 / black base" />
          </div>
          <div className="bg-black px-6 py-6 md:px-8 md:py-8">
            <DirectionCopyBlock
              label={t.conceptLabel}
              title={t.leadName}
              body={t.leadDescription}
            />
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-10">
          <div className="mb-8 space-y-4">
            <p className="font-label text-[10px] tracking-[0.3em] text-white/38 uppercase">
              02 / Atmosphere
            </p>
            <h2 className="font-display max-w-lg text-3xl leading-tight text-white sm:text-4xl">
              {t.moodTitle}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-white/56">{t.moodBody}</p>
          </div>

          <div className="grid gap-px bg-white/8 md:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-black px-6 py-6 md:px-8 md:py-8">
              <DirectionCopyBlock
                label={t.availability}
                title="Garçonmaires"
                body={t.description}
              />
              {t.footerNote ? (
                <p className="mt-10 font-label text-[10px] tracking-[0.28em] text-white/34 uppercase">
                  {t.footerNote}
                </p>
              ) : null}
            </div>
            <div className="bg-black">
              <div className="overflow-hidden">
                <EditorialPlaceholder label="02 / graphic mark" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[linear-gradient(180deg,#050505_0%,#010101_100%)]">
        <div className="site-shell grid gap-10 px-4 py-14 md:grid-cols-[0.88fr_1.12fr] md:px-6 md:py-18">
          <div className="space-y-4">
            <p className="font-label text-[10px] tracking-[0.3em] text-white/36 uppercase">
              {newsletter.newsletterEyebrow}
            </p>
            <h2 className="font-display max-w-xl text-3xl leading-tight text-white sm:text-5xl">
              {newsletter.newsletterTitle}
            </h2>
            <p className="max-w-xl text-sm leading-8 text-white/60 sm:text-base">
              {newsletter.newsletterDescription}
            </p>
          </div>
          <div className="md:pt-3">
            <NewsletterForm source="collection" language={locale} variant="section" />
          </div>
        </div>
      </section>
    </div>
  );
}
