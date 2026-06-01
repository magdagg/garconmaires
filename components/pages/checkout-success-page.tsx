import Link from "next/link";
import { copy, withLocalePath, type Locale } from "@/lib/i18n";

export async function CheckoutSuccessPage({
  locale,
}: {
  locale: Locale;
  searchParams: Promise<{ order_id?: string }>;
}) {
  const t = copy[locale].success;

  return (
    <div className="site-shell px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
        <p className="text-xs tracking-[0.34em] text-white/40 uppercase">
          {t.eyebrow}
        </p>
        <h1 className="mt-5 font-display text-5xl leading-none sm:text-6xl">
          {t.heroTitle}
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-8 text-white/62 sm:text-base">
          {t.heroBody}
        </p>

        <div className="mt-10 grid gap-px bg-white/8 sm:grid-cols-2">
          <div className="bg-black p-6">
            <p className="text-[10px] tracking-[0.28em] text-white/35 uppercase">
              {t.market}
            </p>
            <p className="mt-3 text-sm text-white/76">{t.marketName}</p>
          </div>
          <div className="bg-black p-6">
            <p className="text-[10px] tracking-[0.28em] text-white/35 uppercase">
              {t.total}
            </p>
            <p className="mt-3 text-sm text-white/76">
              {t.confirmed}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href={withLocalePath("/shop", locale)}
            className="inline-flex items-center justify-center bg-white px-7 py-4 text-xs tracking-[0.28em] uppercase text-black hover:opacity-85"
          >
            {t.continueShopping}
          </Link>
          <Link
            href={withLocalePath("/", locale)}
            className="inline-flex items-center justify-center border border-white/18 px-7 py-4 text-xs tracking-[0.28em] uppercase text-white hover:bg-white hover:text-black"
          >
            {t.returnHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
