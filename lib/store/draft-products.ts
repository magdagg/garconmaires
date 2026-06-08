import { nowIso } from "./ids";
import type {
  Drop,
  Product,
  ProductCategory,
  ProductVariant,
  StoreDatabase,
} from "./types";

export const draftDropId = "drop-01";
export const sandboxProductId = "prod-tpay-sandbox-test";

export const draftProductIds = [
  "prod-garconmaires-black-tshirt",
  "prod-garconmaires-black-hoodie",
  "prod-garconmaires-eyewear",
] as const;

type DraftProductDefinition = {
  product: Omit<Product, "createdAt" | "updatedAt">;
  category: ProductCategory;
  variants: Array<Omit<ProductVariant, "createdAt" | "updatedAt">>;
};

export const draftProductDefinitions: DraftProductDefinition[] = [
  {
    category: {
      id: "cat-tops",
      name: "Tops",
      slug: "tops",
      description: "T-shirty i górne warstwy Garçonmaires.",
      createdAt: "",
      updatedAt: "",
    },
    product: {
      id: "prod-garconmaires-black-tshirt",
      name: "Garçonmaires Black T-Shirt",
      slug: "garconmaires-black-t-shirt",
      shortDescription: "Czarny cięższy T-shirt z oszczędnym znakiem Garçonmaires.",
      editorialDescription:
        "Minimalny element DROP 01. Czarna forma, mocniejsza gramatura i spokojny znak Garçonmaires budują bazę garderoby bez zbędnego gestu.",
      technicalDescription:
        [
          "Materiał: 100% bawełna [POTWIERDZIĆ FINALNĄ KOMPOZYCJĘ].",
          "Krój: oversize / boxy fit [POTWIERDZIĆ FINALNE WYMIARY].",
          "Pielęgnacja: prać na lewej stronie w 30°C [POTWIERDZIĆ Z METKĄ].",
          "SEO title placeholder: Garçonmaires Black T-Shirt.",
          "SEO description placeholder: czarny T-shirt Garçonmaires DROP 01.",
        ].join("\n"),
      price: 44900,
      currency: "PLN",
      status: "draft",
      isVisible: false,
      isFeatured: false,
      categoryId: "cat-tops",
      dropId: draftDropId,
    },
    variants: ["S", "M", "L", "XL"].map((size) => ({
      id: `var-garconmaires-black-tshirt-${size.toLowerCase()}`,
      productId: "prod-garconmaires-black-tshirt",
      size,
      sku: `GM-TSHIRT-BLK-${size}`,
      stockQuantity: 0,
      reservedQuantity: 0,
      isAvailable: false,
      priceOverride: null,
    })),
  },
  {
    category: {
      id: "cat-hoodies",
      name: "Hoodies",
      slug: "hoodies",
      description: "Bluzy i warstwy dropowe Garçonmaires.",
      createdAt: "",
      updatedAt: "",
    },
    product: {
      id: "prod-garconmaires-black-hoodie",
      name: "Garçonmaires Black Hoodie",
      slug: "garconmaires-black-hoodie",
      shortDescription: "Czarna bluza z kapturem z warszawskim znakiem Garçonmaires.",
      editorialDescription:
        "Drop-oriented hoodie w czerni: zamknięta sylwetka, cięższy charakter i znak Garçonmaires Warsaw prowadzony oszczędnie, bez nadmiaru.",
      technicalDescription:
        [
          "Materiał: bawełna / mieszanka bawełny [POTWIERDZIĆ FINALNĄ KOMPOZYCJĘ].",
          "Krój: oversize / boxy fit [POTWIERDZIĆ FINALNE WYMIARY].",
          "Pielęgnacja: prać na lewej stronie w 30°C [POTWIERDZIĆ Z METKĄ].",
          "SEO title placeholder: Garçonmaires Black Hoodie.",
          "SEO description placeholder: czarna bluza Garçonmaires DROP 01.",
        ].join("\n"),
      price: 89900,
      currency: "PLN",
      status: "draft",
      isVisible: false,
      isFeatured: false,
      categoryId: "cat-hoodies",
      dropId: draftDropId,
    },
    variants: ["S", "M", "L", "XL"].map((size) => ({
      id: `var-garconmaires-black-hoodie-${size.toLowerCase()}`,
      productId: "prod-garconmaires-black-hoodie",
      size,
      sku: `GM-HOODIE-BLK-${size}`,
      stockQuantity: 0,
      reservedQuantity: 0,
      isAvailable: false,
      priceOverride: null,
    })),
  },
  {
    category: {
      id: "cat-accessories",
      name: "Accessories",
      slug: "accessories",
      description: "Akcesoria i dodatki Garçonmaires.",
      createdAt: "",
      updatedAt: "",
    },
    product: {
      id: "prod-garconmaires-eyewear",
      name: "Garçonmaires Eyewear",
      slug: "garconmaires-eyewear",
      shortDescription: "Czarne prostokątne eyewear jako akcesorium DROP 01.",
      editorialDescription:
        "Akcesorium o zwartej, prostokątnej linii. Czerń, subtelny detal i spokojna obecność w języku Garçonmaires.",
      technicalDescription:
        [
          "Materiał: acetate / polycarbonate placeholder [POTWIERDZIĆ FINALNĄ SPECYFIKACJĘ].",
          "Soczewki: UV400 placeholder [POTWIERDZIĆ CERTYFIKACJĘ].",
          "Pielęgnacja: czyścić miękką ściereczką.",
          "SEO title placeholder: Garçonmaires Eyewear.",
          "SEO description placeholder: czarne eyewear Garçonmaires DROP 01.",
        ].join("\n"),
      price: 49900,
      currency: "PLN",
      status: "draft",
      isVisible: false,
      isFeatured: false,
      categoryId: "cat-accessories",
      dropId: draftDropId,
    },
    variants: [
      {
        id: "var-garconmaires-eyewear-one-size",
        productId: "prod-garconmaires-eyewear",
        size: "ONE SIZE",
        sku: "GM-EYEWEAR-BLK-ONE",
        stockQuantity: 0,
        reservedQuantity: 0,
        isAvailable: false,
        priceOverride: null,
      },
    ],
  },
];

export function seedDraftProducts(database: StoreDatabase) {
  const timestamp = nowIso();
  const existingDrop = database.drops.find((item) => item.id === draftDropId);
  const drop: Drop = {
    id: draftDropId,
    name: "DROP 01",
    slug: "drop-01",
    status: existingDrop?.status === "draft" ? existingDrop.status : "draft",
    launchDate: existingDrop?.launchDate ?? null,
    endDate: existingDrop?.endDate ?? null,
    description:
      existingDrop?.description ||
      "Pierwszy drop Garçonmaires. Produkty pozostają ukryte do czasu launchu.",
    isPasswordProtected: existingDrop?.isPasswordProtected ?? false,
    earlyAccessEnabled: existingDrop?.earlyAccessEnabled ?? false,
    createdAt: existingDrop?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  if (existingDrop) {
    Object.assign(existingDrop, drop);
  } else {
    database.drops.unshift(drop);
  }

  for (const definition of draftProductDefinitions) {
    const existingCategory = database.categories.find(
      (item) => item.id === definition.category.id,
    );
    const category = {
      ...definition.category,
      createdAt: existingCategory?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    if (existingCategory) {
      Object.assign(existingCategory, category);
    } else {
      database.categories.push(category);
    }

    const existingProduct = database.products.find(
      (item) => item.id === definition.product.id,
    );
    const product: Product = {
      ...definition.product,
      ...existingProduct,
      status: existingProduct?.status === "archived" ? "archived" : "draft",
      isVisible: false,
      isFeatured: false,
      currency: definition.product.currency,
      categoryId: existingProduct?.categoryId || definition.product.categoryId,
      dropId: existingProduct?.dropId || definition.product.dropId,
      createdAt: existingProduct?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    if (existingProduct) {
      Object.assign(existingProduct, product);
    } else {
      database.products.push(product);
    }

    for (const variantDefinition of definition.variants) {
      const existingVariant = database.variants.find(
        (item) => item.id === variantDefinition.id,
      );
      const variant: ProductVariant = {
        ...variantDefinition,
        ...existingVariant,
        productId: variantDefinition.productId,
        reservedQuantity: existingVariant?.reservedQuantity ?? 0,
        stockQuantity: existingVariant?.stockQuantity ?? variantDefinition.stockQuantity,
        isAvailable: false,
        createdAt: existingVariant?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };

      if (existingVariant) {
        Object.assign(existingVariant, variant);
      } else {
        database.variants.push(variant);
      }
    }
  }

  database.settings.shopEnabled = false;
  database.settings.shopMode = "PRE_LAUNCH";
  database.settings.updatedAt = timestamp;

  return draftProductDefinitions.map((definition) => definition.product.id);
}
