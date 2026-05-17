import { copy, type Locale } from "@/lib/i18n";

export function ContactPage({ locale }: { locale: Locale }) {
  const t = copy[locale].contact;

  return (
    <div className="site-shell px-4 py-14 md:px-6 md:py-20">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
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

          <div className="grid gap-px bg-white/8 sm:grid-cols-2">
            <div className="bg-black p-6">
              <p className="text-xs tracking-[0.28em] text-white/36 uppercase">
                {t.email}
              </p>
              <p className="mt-4 text-sm text-white/76">
                studio@garconmaires.com
              </p>
            </div>
            <div className="bg-black p-6">
              <p className="text-xs tracking-[0.28em] text-white/36 uppercase">
                {t.base}
              </p>
              <p className="mt-4 text-sm text-white/76">Warsaw</p>
            </div>
          </div>
        </div>

        <form className="space-y-4 border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder={t.name}
              className="border border-white/12 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-white"
            />
            <input
              type="email"
              placeholder={t.email}
              className="border border-white/12 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-white"
            />
          </div>
          <input
            type="text"
            placeholder={t.subject}
            className="w-full border border-white/12 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-white"
          />
          <textarea
            placeholder={t.message}
            rows={8}
            className="w-full border border-white/12 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-white"
          />
          <button
            type="submit"
            className="bg-white px-6 py-4 text-xs tracking-[0.28em] uppercase text-black hover:opacity-85"
          >
            {t.send}
          </button>
        </form>
      </div>
    </div>
  );
}
