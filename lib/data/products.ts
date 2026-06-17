export type ProductCategory =
  | "T-Shirts"
  | "Long Sleeves"
  | "Sweatshirts"
  | "Hoodies";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  imageAlt: string;
  tagline: string;
  description: string;
  details: string[];
  sizes: string[];
  material: string;
  featured?: boolean;
  tones: {
    base: string;
    highlight: string;
    edge: string;
  };
};

export const categories: ProductCategory[] = [
  "T-Shirts",
  "Long Sleeves",
  "Sweatshirts",
  "Hoodies",
];

export const products: Product[] = [
  {
    id: "gm-001",
    slug: "drop-01-hoodie",
    name: "Hoodie",
    category: "Hoodies",
    price: 500,
    imageUrl: "/collection/drop-hoodie-01.png",
    imageAlt: "Black Garçonmaires hoodie with front logo",
    tagline: "Heavy cotton fleece cut with a restrained street silhouette.",
    description:
      "A heavyweight hooded silhouette for DROP 01, built around black cotton, a front Garçonmaires logo and the shared back print motif.",
    details: [
      "530gsm brushed cotton fleece",
      "Relaxed straight fit",
      "Kangaroo front pocket",
      "Double-layer hood",
      "Garçonmaires front logo",
      "Shared DROP 01 back print motif",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "100% cotton",
    featured: true,
    tones: {
      base: "#09090b",
      highlight: "#27272a",
      edge: "#52525b",
    },
  },
  {
    id: "gm-002",
    slug: "drop-01-t-shirt",
    name: "T-shirt",
    category: "T-Shirts",
    price: 300,
    imageUrl: "/collection/drop-tee-01.png",
    imageAlt: "Black Garçonmaires t-shirt with front logo",
    tagline: "Crisp jersey, dropped shoulder, clean line branding.",
    description:
      "A compact black jersey base layer for DROP 01, with a front Garçonmaires logo and the same graphic back motif as the hoodies.",
    details: [
      "Compact cotton jersey",
      "Boxy fit with dropped shoulder",
      "Bound neckline",
      "Soft washed finish",
      "Garçonmaires front logo",
      "Shared DROP 01 back print motif",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "100% organic cotton",
    featured: true,
    tones: {
      base: "#fafafa",
      highlight: "#d4d4d8",
      edge: "#71717a",
    },
  },
  {
    id: "gm-003",
    slug: "drop-01-zip-hoodie",
    name: "Zip hoodie",
    category: "Hoodies",
    price: 540,
    imageUrl: "/collection/drop-zip-hoodie-01.png",
    imageAlt: "Black Garçonmaires zip hoodie with front logo",
    tagline: "A split-front hooded layer with the same quiet black base.",
    description:
      "A zip hoodie for the garment-only DROP 01 preview: black base, restrained front logo placement and the shared back print motif.",
    details: [
      "Heavy cotton fleece",
      "Relaxed dropped shoulder",
      "Full front zip",
      "Ribbed cuffs and hem",
      "Garçonmaires front logo",
      "Shared DROP 01 back print motif",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "100% cotton",
    featured: true,
    tones: {
      base: "#000000",
      highlight: "#3f3f46",
      edge: "#a1a1aa",
    },
  },
];

export const featuredProducts = products.filter((product) => product.featured);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product) {
  return products
    .filter(
      (candidate) =>
        candidate.slug !== product.slug &&
        (candidate.category === product.category || candidate.featured),
    )
    .slice(0, 4);
}
