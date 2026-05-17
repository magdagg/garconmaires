import type { InfoPageContent } from "@/lib/store-pages";

export function InfoPage({ page }: { page: InfoPageContent }) {
  return (
    <div className="site-shell px-4 py-14 md:px-6 md:py-20">
      <div className="max-w-3xl border-b border-white/10 pb-12">
        <p className="text-xs tracking-[0.34em] text-white/38 uppercase">
          {page.eyebrow}
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none sm:text-7xl">
          {page.title}
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-8 text-white/62 sm:text-base">
          {page.intro}
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:gap-10">
        {page.sections.map((section) => (
          <section
            key={section.title}
            className="border border-white/10 bg-white/[0.02] p-6 md:p-8"
          >
            <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl">
              {section.title}
            </h2>
            {section.paragraphs ? (
              <div className="mt-5 space-y-4 text-sm leading-8 text-white/64 sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            {section.bullets ? (
              <ul className="mt-5 space-y-3 text-sm leading-8 text-white/64 sm:text-base">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
