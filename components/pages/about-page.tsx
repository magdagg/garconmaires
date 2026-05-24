import Image from "next/image";
import { copy, type Locale } from "@/lib/i18n";

export function AboutPage({ locale }: { locale: Locale }) {
  const t = copy[locale].about;

  return (
    <div className="site-shell px-4 py-14 md:px-6 md:py-20">
      <div className="grid gap-10 border-b border-white/10 pb-14 md:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <p className="font-label text-[11px] tracking-[0.24em] text-white/38 uppercase">
            {t.eyebrow}
          </p>
          <h1 className="font-display text-[3.35rem] leading-[0.94] tracking-[-0.02em] sm:text-[4.9rem]">
            {t.heroTitle}
          </h1>
          <p className="max-w-xl whitespace-pre-line text-[15px] leading-[1.85] text-white/62 sm:text-[16px]">
            {t.heroBody}
          </p>
        </div>
        <div className="relative overflow-hidden border border-white/10 bg-white/3">
          <div className="relative aspect-[4/5] min-h-[420px] w-full">
            <Image
              src="/brand/about-post-ig.png"
              alt="Garçonmaires about campaign artwork"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>

      <section className="grid gap-px bg-white/8 md:grid-cols-3">
        <div className="bg-black p-8 md:p-10">
          <p className="font-label text-[11px] tracking-[0.22em] text-white/36 uppercase">
            {t.vision}
          </p>
          <p className="mt-6 whitespace-pre-line font-display text-[2rem] leading-[1.02] tracking-[-0.015em]">
            {t.visionBody}
          </p>
        </div>
        <div className="bg-black p-8 md:p-10">
          <p className="font-label text-[11px] tracking-[0.22em] text-white/36 uppercase">
            {t.identity}
          </p>
          <p className="mt-6 whitespace-pre-line text-[15px] leading-[1.85] text-white/64 sm:text-[16px]">
            {t.identityBody}
          </p>
        </div>
        <div className="bg-black p-8 md:p-10">
          <p className="font-label text-[11px] tracking-[0.22em] text-white/36 uppercase">
            {t.mood}
          </p>
          <p className="mt-6 whitespace-pre-line text-[15px] leading-[1.85] text-white/64 sm:text-[16px]">
            {t.moodBody}
          </p>
        </div>
      </section>

      <section className="grid gap-10 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-24">
        <div className="space-y-5">
          <p className="font-label text-[11px] tracking-[0.24em] text-white/36 uppercase">
            {t.storyEyebrow}
          </p>
          <h2 className="font-display text-[2.85rem] leading-[0.98] tracking-[-0.02em] sm:text-[4rem]">
            {t.storyTitle}
          </h2>
        </div>
        <div className="space-y-6 text-[15px] leading-[1.85] text-white/64 sm:text-[16px]">
          {t.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
