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
    slug: "noir-kangaroo-hoodie",
    name: "Spades Hoodie",
    category: "Hoodies",
    price: 500,
    tagline: "Heavy cotton fleece cut with a restrained street silhouette.",
    description:
      "A heavyweight kangaroo hoodie with a structured shoulder, clean hem, and tonal Garçonmaires detailing kept deliberately quiet.",
    details: [
      "530gsm brushed cotton fleece",
      "Relaxed straight fit",
      "Kangaroo front pocket",
      "Double-layer hood",
      "Tonal Garçonmaires insignia at chest",
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
    slug: "atelier-signature-tee",
    name: "Spades T-Shirt",
    category: "T-Shirts",
    price: 300,
    tagline: "Crisp jersey, dropped shoulder, clean line branding.",
    description:
      "A premium everyday base layer with a boxy proportion, precise collar, and minimalist front insignia.",
    details: [
      "Compact cotton jersey",
      "Boxy fit with dropped shoulder",
      "Bound neckline",
      "Soft washed finish",
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
    slug: "cathedral-longsleeve",
    name: "Cathedral Longsleeve",
    category: "Long Sleeves",
    price: 240,
    tagline: "Compact jersey with an elongated line and calm attitude.",
    description:
      "A premium longsleeve designed with a slightly elongated sleeve, balanced body width, and a clean monochrome finish.",
    details: [
      "Heavy compact cotton jersey",
      "Straight relaxed fit",
      "Extended sleeve proportion",
      "Tonal print at chest and back neck",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "100% compact cotton",
    featured: true,
    tones: {
      base: "#000000",
      highlight: "#3f3f46",
      edge: "#a1a1aa",
    },
  },
  {
    id: "gm-004",
    slug: "atelier-crew-sweatshirt",
    name: "Atelier Crew Sweatshirt",
    category: "Sweatshirts",
    price: 340,
    tagline: "Dense loopback cotton with a clean, collarless silhouette.",
    description:
      "A heavyweight crewneck sweatshirt cut without excess, focused on volume, drape, and a precise monochrome finish.",
    details: [
      "480gsm loopback cotton",
      "Relaxed body with dropped shoulder",
      "Ribbed collar, cuffs, and hem",
      "Minimal tonal Garçonmaires signature",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "100% cotton",
    featured: true,
    tones: {
      base: "#18181b",
      highlight: "#3f3f46",
      edge: "#71717a",
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
