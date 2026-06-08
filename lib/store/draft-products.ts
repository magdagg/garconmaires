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

function apparelSpecs(product: "T-shirt" | "Hoodie") {
  return {
    material:
      product === "T-shirt"
        ? "100% bawełna [to confirm before launch]"
        : "Bawełna / mieszanka bawełny [to confirm before launch]",
    fit: "Oversize / boxy fit [to confirm before launch]",
    color: "Black",
    care: "Prać na lewej stronie w 30°C [to confirm before launch]",
    countryOfManufacture: "[to confirm before launch]",
    packageContents: `${product} [to confirm before launch]`,
    modelSize: "[to confirm before launch]",
    productWeight: "[to confirm before launch]",
    packagingWeight: "[to confirm before launch]",
  };
}

function apparelSizeGuide() {
  return {
    apparel: ["S", "M", "L", "XL"].map((size) => ({
      size,
      chestWidth: "[to confirm]",
      length: "[to confirm]",
      sleeveLength: "[to confirm]",
      shoulderWidth: "[to confirm]",
    })),
  };
}

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
      seoTitle: "Garçonmaires Black T-Shirt | DROP 01",
      seoDescription:
        "Czarny T-shirt Garçonmaires DROP 01. Finalne materiały i wymiary do potwierdzenia przed launchem.",
      internalNotes:
        "Final product copy, measurements, materials, care label and photography to confirm before launch.",
      specifications: apparelSpecs("T-shirt"),
      sizeGuide: apparelSizeGuide(),
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
      seoTitle: "Garçonmaires Black Hoodie | DROP 01",
      seoDescription:
        "Czarna bluza z kapturem Garçonmaires DROP 01. Finalne materiały i wymiary do potwierdzenia przed launchem.",
      internalNotes:
        "Confirm hoodie weight, trims, measurements, care label, model sizing and final campaign images before launch.",
      specifications: apparelSpecs("Hoodie"),
      sizeGuide: apparelSizeGuide(),
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
      seoTitle: "Garçonmaires Eyewear | DROP 01",
      seoDescription:
        "Czarne eyewear Garçonmaires DROP 01. Finalna specyfikacja soczewek i wymiarów do potwierdzenia przed launchem.",
      internalNotes:
        "Confirm lens certification, frame material, dimensions, case/cloth packaging and final photography before launch.",
      specifications: {
        frameMaterial: "Acetate / polycarbonate placeholder [to confirm before launch]",
        lensMaterial: "[to confirm before launch]",
        lensCategoryUv: "UV400 placeholder [to confirm before launch]",
        dimensions: "[to confirm before launch]",
        color: "Black",
        care: "Czyścić miękką ściereczką [to confirm before launch]",
        countryOfManufacture: "[to confirm before launch]",
        packageContents: "Eyewear, case, cloth [to confirm before launch]",
        productWeight: "[to confirm before launch]",
        packagingWeight: "[to confirm before launch]",
      },
      sizeGuide: {
        eyewear: {
          lensWidth: "[to confirm]",
          bridgeWidth: "[to confirm]",
          templeLength: "[to confirm]",
          frameWidth: "[to confirm]",
        },
      },
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
      seoTitle: existingProduct?.seoTitle || definition.product.seoTitle,
      seoDescription:
        existingProduct?.seoDescription || definition.product.seoDescription,
      internalNotes:
        existingProduct?.internalNotes || definition.product.internalNotes,
      specifications:
        existingProduct?.specifications &&
        Object.keys(existingProduct.specifications).length > 0
          ? existingProduct.specifications
          : definition.product.specifications,
      sizeGuide:
        existingProduct?.sizeGuide && Object.keys(existingProduct.sizeGuide).length > 0
          ? existingProduct.sizeGuide
          : definition.product.sizeGuide,
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
