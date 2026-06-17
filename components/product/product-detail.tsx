import type { Locale } from "@/lib/i18n";
import type { Product } from "@/lib/data/products";
import type { PublicProduct } from "@/lib/store/public-catalog";
import { formatPrice } from "@/lib/utils";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";

type ProductDetailProps = {
  product: PublicProduct;
  demoProduct?: Product | null;
  locale?: Locale;
  storefrontLive: boolean;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      adminSafe: "Product showroom",
      size: "Size",
      available: "Available",
      soldOut: "Unavailable",
      addToCart: "Add to cart",
      previewPrice: "Preview price",
      gated: "Purchasing stays locked until DROP 01 is opened separately.",
      materials: "Materials and care",
      specs: "Specifications",
      sizeGuide: "Size guide",
      delivery: "Delivery",
      returns: "Returns",
      visualLabel: "Garment preview",
      thumbLabel: "Visual study",
      deliveryBody:
        "Delivery methods will be confirmed for the public launch. The preview flow shows the order layout only.",
      returnsBody:
        "Returns and complaints follow the published legal terms for Poland and the EU.",
    };
  }

  return {
    adminSafe: "Showroom produktu",
    size: "Rozmiar",
    available: "Dostępne",
    soldOut: "Niedostępne",
    addToCart: "Dodaj do koszyka",
    previewPrice: "Cena testowa",
    gated: "Zakup pozostaje zablokowany do osobnej decyzji o otwarciu DROP 01.",
    materials: "Materiały i pielęgnacja",
    specs: "Specyfikacja",
    sizeGuide: "Tabela rozmiarów",
    delivery: "Dostawa",
    returns: "Zwroty",
    visualLabel: "Preview produktu",
    thumbLabel: "Studium wizualne",
    deliveryBody:
      "Metody dostawy zostaną potwierdzone przy publicznym launchu. Preview pokazuje wyłącznie układ zamówienia.",
    returnsBody:
      "Zwroty i reklamacje działają zgodnie z opublikowanymi dokumentami prawnymi dla Polski i UE.",
  };
}

function primaryImage(product: PublicProduct) {
  return product.images.find((image) => image.isPrimary) ?? product.images[0];
}

function specificationRows(product: PublicProduct) {
  return Object.entries(product.specifications).filter(([, value]) => value);
}

export function ProductDetail({
  product,
  demoProduct = null,
  locale = "pl",
  storefrontLive,
}: ProductDetailProps) {
  const t = copy(locale);
  const image = primaryImage(product);
  const variants = product.variants;
  const hasAvailableVariant = variants.some((variant) => variant.isAvailable);
  const canPurchase = storefrontLive && hasAvailableVariant;
  const demoEnabled = Boolean(demoProduct);
  const specRows = specificationRows(product);

  return (
    <main className="bg-black text-white">
      <section className="site-shell grid gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <div className="grain relative aspect-[4/5] min-h-[34rem] overflow-hidden border border-white/10 bg-[#030303] md:min-h-[44rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.085),transparent_27%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_32%)]" />
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={image.alt}
                className="absolute inset-0 h-full w-full object-contain p-6 md:p-10"
              />
            ) : (
              <div className="flex h-full items-end justify-between border border-white/10 p-8">
                <p className="font-label text-[10px] tracking-[0.3em] text-white/35 uppercase">
                  {product.dropName ?? "DROP 01"}
                </p>
                <p className="text-right text-5xl leading-none text-white/50">
                  Garçonmaires
                </p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/58 to-transparent" />
            <div className="absolute inset-x-6 top-6 flex items-center justify-between gap-4 border-t border-white/12 pt-4">
              <p className="font-label text-[10px] tracking-[0.28em] text-white/38 uppercase">
                {t.visualLabel}
              </p>
              <p className="font-label text-right text-[10px] tracking-[0.24em] text-white/34 uppercase">
                {product.dropName ?? "DROP 01"}
              </p>
            </div>
          </div>
          {product.images.length > 1 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {product.images.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-[4/5] overflow-hidden border border-white/8 bg-[#030303]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.alt}
                    className="h-full w-full object-contain p-3 opacity-[0.82] transition duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
                  />
                  <p className="absolute inset-x-3 bottom-3 font-label text-[8px] tracking-[0.2em] text-white/30 uppercase">
                    {t.thumbLabel}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 border-b border-white/10 pb-8">
            <p className="font-label text-[10px] tracking-[0.32em] text-white/35 uppercase">
              {product.dropName ?? t.adminSafe}
            </p>
            <h1 className="font-display text-5xl leading-none sm:text-6xl">
              {product.name}
            </h1>
            <div className="space-y-1">
              <p className="font-label text-[9px] tracking-[0.22em] text-white/32 uppercase">
                {demoEnabled ? t.previewPrice : "Price"}
              </p>
              <p className="text-lg tracking-[0.14em] text-white/76">
                {formatPrice(product.price / 100, locale)}
              </p>
            </div>
            <p className="max-w-xl text-sm leading-8 text-white/62 sm:text-base">
              {product.shortDescription}
            </p>
          </div>

          {!demoEnabled ? (
            <div className="space-y-4">
              <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
                {t.size}
              </p>
              <div className="flex flex-wrap gap-3">
                {variants.map((variant) => (
                  <span
                    key={variant.id}
                    className={
                      variant.isAvailable
                        ? "border border-white/28 px-4 py-3 text-xs tracking-[0.22em] text-white uppercase"
                        : "border border-white/10 px-4 py-3 text-xs tracking-[0.22em] text-white/35 uppercase"
                    }
                  >
                    {variant.size}
                  </span>
                ))}
              </div>
              <p className="text-xs leading-6 text-white/45">
                {hasAvailableVariant ? t.available : t.soldOut}
              </p>
            </div>
          ) : null}

          {demoProduct ? (
            <ProductPurchasePanel product={demoProduct} locale={locale} />
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                disabled={!canPurchase}
                className={
                  canPurchase
                    ? "w-full bg-white px-6 py-4 text-xs tracking-[0.28em] uppercase text-black"
                    : "w-full border border-white/12 px-6 py-4 text-xs tracking-[0.28em] uppercase text-white/35"
                }
              >
                {t.addToCart}
              </button>
              {!canPurchase ? (
                <p className="text-xs leading-6 text-white/45">{t.gated}</p>
              ) : null}
            </div>
          )}

          <div className="grid gap-px bg-white/8">
            <section className="bg-black p-5">
              <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
                {t.materials}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/70">
                {product.technicalDescription}
              </p>
            </section>

            {specRows.length ? (
              <section className="bg-black p-5">
                <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
                  {t.specs}
                </p>
                <dl className="mt-3 grid gap-3 text-sm leading-6 text-white/66">
                  {specRows.map(([key, value]) => (
                    <div key={key} className="grid gap-2 border-t border-white/8 pt-3 md:grid-cols-[0.45fr_1fr]">
                      <dt className="text-white/36">{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {product.sizeGuide ? (
              <section className="bg-black p-5">
                <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
                  {t.sizeGuide}
                </p>
                <pre className="mt-3 overflow-auto text-xs leading-6 text-white/62">
                  {JSON.stringify(product.sizeGuide, null, 2)}
                </pre>
              </section>
            ) : null}

            <section className="bg-black p-5">
              <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
                {t.delivery}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">{t.deliveryBody}</p>
            </section>

            <section className="bg-black p-5">
              <p className="font-label text-[10px] tracking-[0.28em] text-white/36 uppercase">
                {t.returns}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">{t.returnsBody}</p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
