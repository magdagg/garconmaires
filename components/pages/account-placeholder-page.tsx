import Link from "next/link";

type AccountPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  accountHref: string;
  accountLabel: string;
};

export function AccountPlaceholderPage({
  eyebrow,
  title,
  description,
  accountHref,
  accountLabel,
}: AccountPlaceholderPageProps) {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-black text-white">
      <section className="site-shell flex min-h-[calc(100vh-72px)] items-center py-20 sm:py-24">
        <div className="w-full max-w-2xl border-y border-white/12 py-12 sm:py-14">
          <div className="flex flex-col gap-8 sm:grid sm:grid-cols-[120px_minmax(0,1fr)]">
            <p className="font-label text-[11px] uppercase tracking-[0.24em] text-white/42">
              {eyebrow}
            </p>
            <div>
              <h1 className="text-4xl font-light tracking-normal text-white sm:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-7 text-white/58">
                {description}
              </p>
            </div>
          </div>
          <Link
            href={accountHref}
            className="font-label mt-10 inline-flex border-b border-white/34 pb-2 text-[11px] uppercase tracking-[0.22em] text-white/66 transition-colors hover:border-white hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-white sm:ml-[120px]"
          >
            {accountLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
