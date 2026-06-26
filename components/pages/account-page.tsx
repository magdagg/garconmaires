import Link from "next/link";
import { cn } from "@/lib/utils";

type AccountItem = {
  title: string;
  href: string;
  description: string;
};

type AccountPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: AccountItem[];
  collectionHref: string;
  cartHref: string;
  collectionLabel: string;
  cartLabel: string;
};

export function AccountPage({
  eyebrow,
  title,
  description,
  items,
  collectionHref,
  cartHref,
  collectionLabel,
  cartLabel,
}: AccountPageProps) {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-black text-white">
      <section className="site-shell py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.68fr)_minmax(280px,0.32fr)] lg:items-end">
          <div className="max-w-2xl">
          <p className="font-label text-[11px] uppercase tracking-[0.24em] text-white/42">
            {eyebrow}
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-light leading-[0.98] tracking-normal text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/58">
            {description}
          </p>
        </div>
          <div className="hidden border-y border-white/12 py-5 text-right lg:block">
            <p className="font-label text-[10px] uppercase tracking-[0.28em] text-white/30">
              Pre-launch access
            </p>
            <p className="mt-3 text-sm leading-6 text-white/46">
              Client services are staged now and activated only when the shop opens.
            </p>
          </div>
        </div>

        <div className="mt-14 grid border-t border-white/12">
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group grid gap-3 border-b border-white/12 py-7 transition-colors duration-200 hover:border-white/34 sm:grid-cols-[72px_minmax(0,0.52fr)_minmax(0,1fr)_24px] sm:items-center",
                index === 0 && "border-t-0",
              )}
            >
              <span className="font-label text-[10px] tracking-[0.24em] text-white/28 transition-colors group-hover:text-white/46">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-xl font-light text-white transition-colors group-hover:text-white sm:text-2xl">
                {item.title}
              </span>
              <span className="max-w-2xl text-sm leading-6 text-white/48 transition-colors group-hover:text-white/68">
                {item.description}
              </span>
              <span className="hidden text-right text-xl leading-none text-white/22 transition-colors group-hover:text-white/64 sm:block">
                &gt;
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href={collectionHref}
            className="font-label border border-white px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-white hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {collectionLabel}
          </Link>
          <Link
            href={cartHref}
            className="font-label border border-white/14 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-white/70 hover:border-white hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {cartLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
