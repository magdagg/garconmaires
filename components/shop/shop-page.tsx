"use client";

import { useState } from "react";
import { categories, products, type ProductCategory } from "@/lib/data/products";
import { ProductCard } from "@/components/ui/product-card";
import { copy, getCategoryLabel, type Locale } from "@/lib/i18n";

type SortOption = "featured" | "price-low" | "price-high" | "name";

export function ShopPage({ locale = "pl" }: { locale?: Locale }) {
  const [category, setCategory] = useState<ProductCategory | "All">("All");
  const [sort, setSort] = useState<SortOption>("featured");
  const t = copy[locale].shop;

  const filteredProducts = products
    .filter((product) => category === "All" || product.category === category)
    .sort((first, second) => {
      if (sort === "price-low") return first.price - second.price;
      if (sort === "price-high") return second.price - first.price;
      if (sort === "name") return first.name.localeCompare(second.name);
      return Number(Boolean(second.featured)) - Number(Boolean(first.featured));
    });

  return (
    <div className="site-shell px-4 py-14 md:px-6 md:py-20">
      <div className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-5">
          <p className="text-xs tracking-[0.34em] text-white/38 uppercase">
            {t.eyebrow}
          </p>
          <h1 className="font-display text-5xl leading-none sm:text-7xl">
            {t.title}
          </h1>
          <p className="max-w-2xl text-sm leading-8 text-white/60 sm:text-base">
            {t.description}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ProductCategory | "All")
            }
            className="border border-white/10 bg-black px-4 py-3 text-xs tracking-[0.24em] uppercase text-white outline-none"
          >
            <option value="All">{t.allCategories}</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {getCategoryLabel(item, locale)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="border border-white/10 bg-black px-4 py-3 text-xs tracking-[0.24em] uppercase text-white outline-none"
          >
            <option value="featured">{t.featured}</option>
            <option value="price-low">{t.priceLow}</option>
            <option value="price-high">{t.priceHigh}</option>
            <option value="name">{t.name}</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid gap-px bg-white/8 md:grid-cols-3">
        {t.notes.map((note) => (
          <div key={note.label} className="bg-black p-5">
            <p className="text-[10px] tracking-[0.28em] text-white/35 uppercase">
              {note.label}
            </p>
            <p className="mt-3 text-sm leading-7 text-white/58">{note.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs tracking-[0.24em] text-white/36 uppercase">
        <p>
          {filteredProducts.length} {t.piecesSuffix}
        </p>
        <p>{t.palette}</p>
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </div>
  );
}
