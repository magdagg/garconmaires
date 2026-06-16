import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { type Locale } from "@/lib/i18n";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
});

type TeaserPiece = {
  name: string;
  label: string;
  body: string;
};

const teaserCopy = {
  pl: {
    eyebrow: "DROP 01 / PRIVATE LIST",
    title: "Pierwsza odsłona odzieżowa.",
    lead:
      "DROP 01 pokazuje wyłącznie ubrania: hoodie, t-shirt i zip hoodie. Każdy element zaczyna się od przedniego logo Garçonmaires i wspólnego graficznego nadruku z tyłu.",
    status: "COMING SOON",
    city: "Warszawa / garments only / black base",
    heroAlt: "Trzy czarne produkty Garçonmaires DROP 01: hoodie, t-shirt i zip hoodie",
    lineupTitle: "Hoodie / T-shirt / Zip hoodie",
    lineupNote:
      "To zapowiedź zakresu dropu, nie katalog sprzedażowy. Sprzedaż pozostaje zamknięta do publicznego launchu.",
    backPrintLabel: "Wspólny tylny nadruk",
    backPrintTitle: "Jeden motyw łączy trzy formy.",
    backPrintBody:
      "Tylny nadruk jest wspólnym znakiem DROP 01. Na tym etapie pokazujemy go jako preview motywu, bez cen, wariantów i obietnicy konkretnej daty premiery.",
    backPrintAlt: "Graficzny motyw tylnego nadruku Garçonmaires DROP 01",
    privateList: "Prywatna lista",
    privateTitle: "Wejdź wcześniej niż publiczny launch.",
    privateBody:
      "Zapisz się, jeśli chcesz dostać pierwszy sygnał o odzieżowym DROP 01. Bez publicznego checkoutu, bez otwartej sprzedaży, tylko wcześniejszy dostęp do informacji.",
    submit: "Dołącz do listy",
    success: "Jesteś na liście DROP 01.",
    pieces: [
      {
        name: "Hoodie",
        label: "01 / volume",
        body:
          "Czarna bluza z kapturem jako najmocniejsza sylwetka dropu: ciężar, cień i frontowy znak Garçonmaires.",
      },
      {
        name: "T-shirt",
        label: "02 / base layer",
        body:
          "Czarna baza pierwszej odsłony: prosta forma, wyraźny logotyp z przodu i ten sam tylny motyw co na bluzach.",
      },
      {
        name: "Zip hoodie",
        label: "03 / split front",
        body:
          "Rozpinana bluza domyka odzieżowy zakres dropu: ta sama czarna baza, frontowe logo i wspólny nadruk z tyłu.",
      },
    ],
  },
  en: {
    eyebrow: "DROP 01 / PRIVATE LIST",
    title: "The first garment-only release.",
    lead:
      "DROP 01 now focuses only on garments: hoodie, T-shirt, and zip hoodie. Each piece carries the Garçonmaires logo on the front and a shared graphic print on the back.",
    status: "COMING SOON",
    city: "Warsaw / garments only / black base",
    heroAlt: "Three black Garçonmaires DROP 01 garments: hoodie, T-shirt, and zip hoodie",
    lineupTitle: "Hoodie / T-shirt / Zip hoodie",
    lineupNote:
      "This is a pre-launch scope preview, not a sales catalogue. Sales stay closed until the public launch.",
    backPrintLabel: "Shared back print",
    backPrintTitle: "One graphic motif across the full drop.",
    backPrintBody:
      "The back print is the visual link between the three pieces. For now it is shown as a motif preview, without prices, variants, or a promised release date.",
    backPrintAlt: "Garçonmaires DROP 01 shared back print graphic motif",
    privateList: "Private list",
    privateTitle: "Enter before the public launch.",
    privateBody:
      "Join for the first signal on the garment-only DROP 01. No public checkout, no open sale, just early access to release information.",
    submit: "Join the list",
    success: "You are on the DROP 01 list.",
    pieces: [
      {
        name: "Hoodie",
        label: "01 / volume",
        body:
          "The strongest silhouette in the drop: black volume, shadow, and the Garçonmaires logo placed on the front.",
      },
      {
        name: "T-shirt",
        label: "02 / base layer",
        body:
          "The clean black base of the first release, carrying the front logo and the same back motif as the hoodies.",
      },
      {
        name: "Zip hoodie",
        label: "03 / split front",
        body:
          "A zip-front layer that completes the garment scope: black base, front logo, and shared back print.",
      },
    ],
  },
} satisfies Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    status: string;
    city: string;
    heroAlt: string;
    lineupTitle: string;
    lineupNote: string;
    backPrintLabel: string;
    backPrintTitle: string;
    backPrintBody: string;
    backPrintAlt: string;
    privateList: string;
    privateTitle: string;
    privateBody: string;
    submit: string;
    success: string;
    pieces: TeaserPiece[];
  }
>;

function CategoryTeaser({
  piece,
  index,
  status,
}: {
  piece: TeaserPiece;
  index: number;
  status: string;
}) {
  return (
    <article className="group border-t border-white/12 pt-5">
      <div className="mb-9 flex items-start justify-between gap-4">
        <span className="font-label text-[10px] tracking-[0.24em] text-white/36 uppercase">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-label text-right text-[10px] tracking-[0.24em] text-white/34 uppercase">
          {status}
        </span>
      </div>
      <p className="font-label text-[10px] tracking-[0.28em] text-white/34 uppercase">
        {piece.label}
      </p>
      <h2 className="mt-3 font-display text-3xl leading-none text-white transition duration-300 group-hover:text-white/72 sm:text-4xl">
        {piece.name}
      </h2>
      <p className="mt-5 max-w-sm text-sm leading-7 text-white/54">{piece.body}</p>
    </article>
  );
}

export function CollectionPage({ locale = "pl" }: { locale?: Locale }) {
  const t = teaserCopy[locale];

  return (
    <div className="bg-black text-white">
      <section className="relative left-1/2 right-1/2 min-h-[calc(100svh-72px)] w-screen -translate-x-1/2 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image
            src="/collection/drop-01-garments-preview.png"
            alt={t.heroAlt}
            fill
            priority
            sizes="100vw"
            className="hero-reveal object-contain object-center opacity-[0.82] saturate-[0.88]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.68)_34%,rgba(0,0,0,0.2)_68%,rgba(0,0,0,0.46)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.055),transparent_24%)]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,#000_0%,rgba(0,0,0,0)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,#000_100%)]" />
        </div>

        <div className="site-shell relative flex min-h-[calc(100svh-72px)] items-end px-4 py-12 md:px-6 md:py-16">
          <div className="max-w-3xl">
            <p className="font-label text-[10px] tracking-[0.34em] text-white/48 uppercase">
              {t.eyebrow}
            </p>
            <h1
              className={`${spaceGrotesk.className} mt-6 max-w-[46rem] text-[3.75rem] leading-[0.84] font-bold tracking-normal text-white sm:text-[6rem] md:text-[7.5rem]`}
            >
              DROP 01
            </h1>
            <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,30rem)_auto] md:items-end">
              <div className="space-y-4 border-l border-white/18 pl-5">
                <h2 className="font-display text-2xl leading-tight text-white sm:text-4xl">
                  {t.title}
                </h2>
                <p className="max-w-xl text-sm leading-7 text-white/68 sm:text-base sm:leading-8">
                  {t.lead}
                </p>
              </div>
              <p className="font-label text-[10px] tracking-[0.24em] text-white/44 uppercase md:text-right">
                {t.city}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell px-4 py-14 md:px-6 md:py-20">
        <div className="mb-10 flex flex-col justify-between gap-5 border-t border-white/10 pt-8 md:flex-row md:items-end">
          <div className="space-y-3">
            <p className="font-label text-[10px] tracking-[0.3em] text-white/36 uppercase">
              {t.status}
            </p>
            <h2 className="font-display max-w-xl text-4xl leading-tight text-white sm:text-5xl">
              {t.lineupTitle}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-white/50">
            {t.lineupNote}
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3">
          {t.pieces.map((piece, index) => (
            <CategoryTeaser
              key={piece.name}
              piece={piece}
              index={index}
              status={t.status}
            />
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="site-shell grid gap-12 px-4 py-16 md:grid-cols-[0.95fr_1.05fr] md:px-6 md:py-24">
          <div className="flex flex-col justify-center border-t border-white/10 pt-6 md:border-t-0 md:pt-0">
            <p className="font-label text-[10px] tracking-[0.3em] text-white/36 uppercase">
              {t.backPrintLabel}
            </p>
            <h2 className="mt-4 max-w-xl font-display text-3xl leading-tight text-white sm:text-5xl">
              {t.backPrintTitle}
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-8 text-white/58 sm:text-base">
              {t.backPrintBody}
            </p>
          </div>
          <div className="group relative min-h-[24rem] overflow-hidden bg-black md:min-h-[34rem]">
            <Image
              src="/collection/drop-01-back-print-preview.png"
              alt={t.backPrintAlt}
              fill
              sizes="(max-width: 768px) 100vw, 54vw"
              className="object-contain opacity-[0.68] saturate-[0.82] transition duration-700 group-hover:scale-[1.012] group-hover:opacity-80"
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.08)_44%,rgba(0,0,0,0.5)_100%)]" />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050505]">
        <div className="site-shell grid gap-10 px-4 py-16 md:grid-cols-[0.78fr_1.22fr] md:px-6 md:py-24">
          <div className="space-y-4">
            <p className="font-label text-[10px] tracking-[0.3em] text-white/36 uppercase">
              {t.privateList}
            </p>
            <h2 className="font-display max-w-xl text-3xl leading-tight text-white sm:text-5xl">
              {t.privateTitle}
            </h2>
            <p className="max-w-xl text-sm leading-8 text-white/60 sm:text-base">
              {t.privateBody}
            </p>
          </div>
          <div className="border-t border-white/10 pt-7 md:border-t-0 md:border-l md:border-white/10 md:pt-1 md:pl-10">
            <NewsletterForm
              source="collection-private-list"
              language={locale}
              variant="section"
              submitLabel={t.submit}
              successMessage={t.success}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
