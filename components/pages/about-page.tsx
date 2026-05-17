import { ProductMedia } from "@/components/ui/product-media";
import { products } from "@/lib/data/products";
import { copy, type Locale } from "@/lib/i18n";

export function AboutPage({ locale }: { locale: Locale }) {
  const t = copy[locale].about;

  return (
    <div className="site-shell px-4 py-14 md:px-6 md:py-20">
      <div className="grid gap-10 border-b border-white/10 pb-14 md:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <p className="text-xs tracking-[0.34em] text-white/38 uppercase">
            {t.eyebrow}
          </p>
          <h1 className="font-display text-5xl leading-none sm:text-7xl">
            {t.heroTitle}
          </h1>
          <p className="max-w-xl text-sm leading-8 text-white/62 sm:text-base">
            {t.heroBody}
          </p>
        </div>
        <ProductMedia product={products[0]} label="Studio Study" />
      </div>

      <section className="grid gap-px bg-white/8 md:grid-cols-3">
        <div className="bg-black p-8 md:p-10">
          <p className="text-xs tracking-[0.34em] text-white/36 uppercase">
            {t.vision}
          </p>
          <p className="mt-6 font-display text-3xl leading-tight">
            {t.visionBody}
          </p>
        </div>
        <div className="bg-black p-8 md:p-10">
          <p className="text-xs tracking-[0.34em] text-white/36 uppercase">
            {t.identity}
          </p>
          <p className="mt-6 text-sm leading-8 text-white/64">
            {t.identityBody}
          </p>
        </div>
        <div className="bg-black p-8 md:p-10">
          <p className="text-xs tracking-[0.34em] text-white/36 uppercase">
            {t.mood}
          </p>
          <p className="mt-6 text-sm leading-8 text-white/64">{t.moodBody}</p>
        </div>
      </section>

      <section className="grid gap-10 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-24">
        <div className="space-y-5">
          <p className="text-xs tracking-[0.34em] text-white/36 uppercase">
            {t.storyEyebrow}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl">{t.storyTitle}</h2>
        </div>
        <div className="space-y-6 text-sm leading-8 text-white/64 sm:text-base">
          {t.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
