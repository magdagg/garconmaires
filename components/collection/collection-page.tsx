import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { products } from "@/lib/data/products";
import { copy, getProductCopy, withLocalePath, type Locale } from "@/lib/i18n";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
});

function getRequiredProduct(productId: string) {
  const product = products.find((entry) => entry.id === productId);

  if (!product) {
    throw new Error(`Missing required collection preview product: ${productId}`);
  }

  return product;
}

const teeProduct = getRequiredProduct("gm-002");
const hoodieProduct = getRequiredProduct("gm-001");

function HeroVisual() {
  return (
    <div className="relative min-h-[32rem] overflow-hidden bg-black md:min-h-[calc(100svh-72px)]">
      <Image
        src="/collection/spades-sunglasses-hero-02.jpg"
        alt="Spades Sunglasses editorial preview"
        fill
        className="object-cover object-[68%_center] md:object-[72%_center]"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.76)_34%,rgba(0,0,0,0.18)_72%,rgba(0,0,0,0.58)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.04),transparent_18%)]" />
    </div>
  );
}

function TeeVisual() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(180deg,#020202_0%,#000000_100%)]" />
      <Image
        src="/collection/drop-tee-01.png"
        alt="Spades T-Shirt editorial preview"
        fill
        className="object-cover object-center"
        sizes="(min-width: 1024px) 52vw, 100vw"
      />
    </div>
  );
}

function HoodieVisual() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(180deg,#020202_0%,#000000_100%)]" />
      <Image
        src="/collection/drop-hoodie-01.png"
        alt="Spades Hoodie editorial preview"
        fill
        className="object-cover object-center"
        sizes="(min-width: 1024px) 48vw, 100vw"
      />
    </div>
  );
}

function ProductCopyBlock({
  productName,
  category,
  tagline,
}: {
  productName: string;
  category: string;
  tagline: string;
}) {
  return (
    <div className="flex h-full flex-col justify-end gap-5 border-t border-white/10 pt-5 md:border-t-0 md:pt-0">
      <div className="space-y-3">
        <p className="font-label text-[10px] tracking-[0.3em] text-white/38 uppercase">
          {category}
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <h2 className="font-display text-3xl leading-none text-white sm:text-4xl">
            {productName}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-white/56">{tagline}</p>
      </div>
    </div>
  );
}

export function CollectionPage({ locale = "pl" }: { locale?: Locale }) {
  const t = copy[locale].collectionPage;
  const newsletter = copy[locale].home;
  const teeCopy = getProductCopy(teeProduct, locale);
  const hoodieCopy = getProductCopy(hoodieProduct, locale);

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
            <TeeVisual />
          </div>
          <div className="bg-black px-6 py-6 md:px-8 md:py-8">
            <ProductCopyBlock
              productName={teeProduct.name}
              category={teeCopy.category}
              tagline={teeCopy.tagline}
            />
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-10">
          <div className="mb-8 space-y-4">
            <p className="font-label text-[10px] tracking-[0.3em] text-white/38 uppercase">
              02 / Layer
            </p>
            <h2 className="font-display max-w-lg text-3xl leading-tight text-white sm:text-4xl">
              {t.moodTitle}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-white/56">{t.moodBody}</p>
          </div>

          <div className="grid gap-px bg-white/8 md:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-black px-6 py-6 md:px-8 md:py-8">
              <ProductCopyBlock
                productName={hoodieProduct.name}
                category={hoodieCopy.category}
                tagline={hoodieCopy.tagline}
              />
              {t.footerNote ? (
                <p className="mt-10 font-label text-[10px] tracking-[0.28em] text-white/34 uppercase">
                  {t.footerNote}
                </p>
              ) : null}
            </div>
            <Link
              href={withLocalePath(`/product/${hoodieProduct.slug}`, locale)}
              className="group block bg-black"
            >
              <div className="overflow-hidden">
                <HoodieVisual />
              </div>
            </Link>
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
