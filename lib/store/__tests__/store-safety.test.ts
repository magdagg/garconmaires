import { afterEach, describe, expect, it, vi } from "vitest";
import { addCartItem, findOrCreateCart, validateCart } from "../cart";
import { createDefaultStoreDatabase } from "../defaults";
import {
  draftProductDefinitions,
  sandboxProductId,
  seedDraftProducts,
} from "../draft-products";
import {
  calculateDeliveryPrice,
  getTrackingUrl,
  normalizeDeliveryMethods,
} from "../delivery";
import { sendStoreEmail } from "../email";
import {
  releaseExpiredReservations,
  reserveVariantStock,
} from "../inventory";
import {
  createOrderFromCart,
  findOrderForCustomerRequest,
  markOrderPaidFromVerifiedProvider,
  markOrderPaymentFailedOrCancelled,
  markOrderShipped,
} from "../orders";
import {
  createComplaint,
  createReturnRequest,
  validateComplaintProductForOrder,
  validateReturnItemsForOrder,
} from "../operations";
import {
  assertVariantStockIsSafe,
  duplicateSkuValues,
  getProductAdminWarnings,
  normalizeProductImageOrder,
  setPrimaryProductImage,
} from "../product-admin";
import {
  getPublicCatalogStateFromDatabase,
  isPublicProductCandidate,
  toPublicProduct,
} from "../public-catalog";
import type { StoreDatabase } from "../types";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function makeCheckoutDatabase() {
  const database = createDefaultStoreDatabase();
  const product = database.products[0];
  const variant = database.variants.find((item) => item.productId === product.id);

  if (!variant) {
    throw new Error("Missing default variant fixture.");
  }

  database.settings.shopEnabled = true;
  database.settings.shopMode = "PUBLIC_DROP";
  product.status = "active";
  product.isVisible = true;
  variant.stockQuantity = 2;
  variant.reservedQuantity = 0;
  variant.isAvailable = true;

  return { database, product, variant };
}

function checkoutInput() {
  return {
    customer: {
      firstName: "Anna",
      lastName: "Nowak",
      email: "anna@example.com",
      phone: "500600700",
    },
    shippingAddress: {
      firstName: "Anna",
      lastName: "Nowak",
      addressLine1: "Mokotowska 1",
      postalCode: "00-001",
      city: "Warszawa",
      country: "PL" as const,
    },
    acceptedTerms: true,
    acceptedPrivacy: true,
  };
}

function createPendingOrder(database: StoreDatabase) {
  const product = database.products[0];
  const variant = database.variants.find((item) => item.productId === product.id);

  if (!variant) {
    throw new Error("Missing variant fixture.");
  }

  const cart = findOrCreateCart(database, "session-test");
  cart.items = [];
  addCartItem(database, {
    sessionId: cart.sessionId,
    productId: product.id,
    variantId: variant.id,
    quantity: 1,
  });

  return createOrderFromCart({
    database,
    cartId: cart.id,
    input: checkoutInput(),
  }).order;
}

describe("store checkout safety", () => {
  it("calculates delivery prices and free shipping threshold", () => {
    const methods = normalizeDeliveryMethods([]);
    const locker = methods.find((method) => method.id === "inpost_locker");
    const courier = methods.find((method) => method.id === "inpost_courier");

    expect(locker).toMatchObject({
      name: "InPost Paczkomat",
      type: "parcel_locker",
      provider: "inpost",
      price: 1499,
      enabled: true,
    });
    expect(courier).toMatchObject({ price: 1799 });
    expect(
      calculateDeliveryPrice({
        method: locker!,
        subtotal: 10000,
        freeShippingThreshold: 49900,
      }),
    ).toBe(1499);
    expect(
      calculateDeliveryPrice({
        method: locker!,
        subtotal: 49900,
        freeShippingThreshold: 49900,
      }),
    ).toBe(0);
  });

  it("blocks checkout when shopEnabled is false", () => {
    const { database, product, variant } = makeCheckoutDatabase();
    database.settings.shopEnabled = false;
    const cart = findOrCreateCart(database, "session-disabled");

    addCartItem(database, {
      sessionId: cart.sessionId,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
    });

    const validation = validateCart(database, cart);

    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain("Sklep nie jest jeszcze");
  });

  it.each(["draft", "hidden", "sold_out", "archived"] as const)(
    "blocks %s products from public purchase",
    (status) => {
      const { database, product, variant } = makeCheckoutDatabase();
      const cart = findOrCreateCart(database, `session-${status}`);

      product.status = status;
      addCartItem(database, {
        sessionId: cart.sessionId,
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
      });

      const validation = validateCart(database, cart);

      expect(validation.ok).toBe(false);
      expect(validation.errors.join(" ")).toContain(product.name);
    },
  );

  it("creates a pending order with an active stock reservation", () => {
    const { database, variant } = makeCheckoutDatabase();
    const order = createPendingOrder(database);

    expect(order.paymentStatus).toBe("pending");
    expect(order.items[0]).toMatchObject({
      variantId: variant.id,
      sku: variant.sku,
      unitPrice: database.products[0].price,
      quantity: 1,
    });
    expect(order.reservationIds).toHaveLength(1);
    expect(variant.reservedQuantity).toBe(1);
  });

  it("requires parcel locker id for parcel locker delivery", () => {
    const { database, product, variant } = makeCheckoutDatabase();
    const cart = findOrCreateCart(database, "session-locker-missing");

    addCartItem(database, {
      sessionId: cart.sessionId,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
    });

    expect(() =>
      createOrderFromCart({
        database,
        cartId: cart.id,
        input: {
          ...checkoutInput(),
          delivery: { deliveryMethodId: "inpost_locker" },
        },
      }),
    ).toThrow("Paczkomat");
  });

  it("requires phone for delivery", () => {
    const { database, product, variant } = makeCheckoutDatabase();
    const cart = findOrCreateCart(database, "session-phone-missing");

    addCartItem(database, {
      sessionId: cart.sessionId,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
    });

    expect(() =>
      createOrderFromCart({
        database,
        cartId: cart.id,
        input: {
          ...checkoutInput(),
          customer: { ...checkoutInput().customer, phone: "" },
          delivery: { deliveryMethodId: "inpost_courier" },
        },
      }),
    ).toThrow("telefon");
  });

  it("allows a hidden active product only through admin checkout test mode", () => {
    const { database, product, variant } = makeCheckoutDatabase();
    const cart = findOrCreateCart(database, "session-hidden-test-mode");

    database.settings.shopEnabled = false;
    database.settings.shopMode = "PRE_LAUNCH";
    product.status = "active";
    product.isVisible = false;
    variant.stockQuantity = 1;
    variant.reservedQuantity = 0;
    variant.isAvailable = true;

    addCartItem(database, {
      sessionId: cart.sessionId,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
    });

    expect(validateCart(database, cart).ok).toBe(false);
    expect(validateCart(database, cart, { allowDisabledShop: true }).ok).toBe(true);
  });

  it("commits stock exactly once for duplicate paid webhook handling", () => {
    const { database, variant } = makeCheckoutDatabase();
    const order = createPendingOrder(database);

    markOrderPaidFromVerifiedProvider({
      database,
      orderId: order.id,
      providerTransactionId: "tpay_test_paid",
      eventId: "evt_paid_1",
    });
    markOrderPaidFromVerifiedProvider({
      database,
      orderId: order.id,
      providerTransactionId: "tpay_test_paid",
      eventId: "evt_paid_1",
    });

    expect(variant.stockQuantity).toBe(1);
    expect(variant.reservedQuantity).toBe(0);
    expect(database.reservations[0].status).toBe("committed");
  });

  it("does not cancel a paid order after a stale expired webhook", () => {
    const { database, variant } = makeCheckoutDatabase();
    const order = createPendingOrder(database);

    markOrderPaidFromVerifiedProvider({
      database,
      orderId: order.id,
      providerTransactionId: "tpay_test_paid",
      eventId: "evt_paid_1",
    });
    markOrderPaymentFailedOrCancelled(database, order.id, "expired");

    expect(order.paymentStatus).toBe("paid");
    expect(order.orderStatus).toBe("confirmed");
    expect(variant.stockQuantity).toBe(1);
    expect(variant.reservedQuantity).toBe(0);
  });

  it("releases stock after failed payment", () => {
    const { database, variant } = makeCheckoutDatabase();
    const order = createPendingOrder(database);

    markOrderPaymentFailedOrCancelled(database, order.id, "failed");

    expect(variant.stockQuantity).toBe(2);
    expect(variant.reservedQuantity).toBe(0);
    expect(database.reservations[0].status).toBe("released");
  });

  it("releases expired checkout reservations", () => {
    const { database, variant } = makeCheckoutDatabase();
    createPendingOrder(database);
    database.reservations[0].expiresAt = "2026-01-01T00:00:00.000Z";

    const released = releaseExpiredReservations(database);

    expect(released).toHaveLength(1);
    expect(variant.reservedQuantity).toBe(0);
    expect(database.reservations[0].status).toBe("released");
  });

  it("marks an order shipped with tracking details", () => {
    const { database } = makeCheckoutDatabase();
    const order = createPendingOrder(database);
    const shipped = markOrderShipped({
      database,
      orderId: order.id,
      trackingNumber: "1234567890",
      shipmentProvider: "inpost",
      adminNote: "Packed manually.",
    });

    expect(shipped).toMatchObject({
      fulfillmentStatus: "shipped",
      orderStatus: "completed",
      trackingNumber: "1234567890",
    });
    expect(shipped?.delivery).toMatchObject({
      deliveryStatus: "shipped",
      shipmentProvider: "inpost",
      trackingNumber: "1234567890",
      adminNote: "Packed manually.",
    });
    expect(shipped?.delivery.shippedAt).toBeTruthy();
    expect(shipped?.delivery.trackingUrl).toContain("inpost.pl");
  });

  it("builds tracking URL for InPost and falls back safely for manual provider", () => {
    expect(
      getTrackingUrl({ provider: "inpost", trackingNumber: "AB 123" }),
    ).toBe("https://inpost.pl/sledzenie-przesylek?number=AB%20123");
    expect(getTrackingUrl({ provider: "manual", trackingNumber: "AB 123" })).toBeNull();
    expect(getTrackingUrl({ provider: "inpost", trackingNumber: "" })).toBeNull();
  });

  it("skips shipped email safely when Resend is not configured", async () => {
    const { database } = makeCheckoutDatabase();
    const order = createPendingOrder(database);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});

    vi.stubEnv("RESEND_API_KEY", "");
    markOrderShipped({
      database,
      orderId: order.id,
      trackingNumber: "1234567890",
      shipmentProvider: "inpost",
    });
    await expect(sendStoreEmail("order_shipped", { order })).resolves.toBeUndefined();
    expect(info).toHaveBeenCalledWith(
      "[store-email] skipped; RESEND_API_KEY is not configured",
      expect.objectContaining({ template: `Zamówienie wysłane / ${order.orderNumber}` }),
    );
  });

  it("does not oversell the last unit across competing reservations", () => {
    const { database, variant } = makeCheckoutDatabase();
    variant.stockQuantity = 1;

    const first = reserveVariantStock({
      database,
      variantId: variant.id,
      quantity: 1,
      orderId: "ord-first",
    });
    const second = reserveVariantStock({
      database,
      variantId: variant.id,
      quantity: 1,
      orderId: "ord-second",
    });

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(variant.reservedQuantity).toBe(1);
  });
});

describe("draft product seed safety", () => {
  it("seeds real Garçonmaires products as hidden draft products", () => {
    const database = createDefaultStoreDatabase();
    const seeded = seedDraftProducts(database);

    expect(seeded).toHaveLength(3);
    for (const definition of draftProductDefinitions) {
      const product = database.products.find((item) => item.id === definition.product.id);

      expect(product).toMatchObject({
        status: "draft",
        isVisible: false,
        isFeatured: false,
        currency: "PLN",
        dropId: "drop-01",
      });
      expect(product?.technicalDescription).toContain("POTWIERDZIĆ");
    }
    expect(database.products.find((item) => item.id === sandboxProductId)).toBeUndefined();
    expect(database.settings.shopEnabled).toBe(false);
    expect(database.settings.shopMode).toBe("PRE_LAUNCH");
  });

  it("creates product variants and SKUs idempotently", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);
    seedDraftProducts(database);

    const draftProducts = database.products.filter((product) =>
      product.id.startsWith("prod-garconmaires-"),
    );
    const variants = database.variants.filter((variant) =>
      variant.productId.startsWith("prod-garconmaires-"),
    );

    expect(draftProducts).toHaveLength(3);
    expect(variants.map((variant) => variant.sku).sort()).toEqual([
      "GM-EYEWEAR-BLK-ONE",
      "GM-HOODIE-BLK-L",
      "GM-HOODIE-BLK-M",
      "GM-HOODIE-BLK-S",
      "GM-HOODIE-BLK-XL",
      "GM-TSHIRT-BLK-L",
      "GM-TSHIRT-BLK-M",
      "GM-TSHIRT-BLK-S",
      "GM-TSHIRT-BLK-XL",
    ]);
    expect(variants.every((variant) => variant.reservedQuantity === 0)).toBe(true);
    expect(variants.every((variant) => variant.isAvailable === false)).toBe(true);
  });

  it("does not overwrite edited fields, uploaded images, stock or size guides on seed rerun", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);
    const product = database.products.find(
      (item) => item.id === "prod-garconmaires-black-tshirt",
    );
    const variant = database.variants.find((item) => item.productId === product?.id);

    expect(product).toBeTruthy();
    expect(variant).toBeTruthy();
    if (!product || !variant) {
      throw new Error("Missing seeded draft product fixture.");
    }

    product.name = "Edited Tee";
    product.price = 45900;
    product.seoTitle = "Edited SEO";
    product.specifications = { material: "Edited material" };
    product.sizeGuide = {
      apparel: [
        {
          size: "S",
          chestWidth: "52",
          length: "68",
          sleeveLength: "21",
          shoulderWidth: "48",
        },
      ],
    };
    variant.sku = "EDITED-SKU";
    variant.stockQuantity = 7;
    database.images.push({
      id: "img-edited",
      productId: product.id,
      url: "https://example.com/product.jpg",
      alt: "Edited image",
      sortOrder: 0,
      isPrimary: true,
      createdAt: "2026-06-08T00:00:00.000Z",
    });

    seedDraftProducts(database);

    expect(product.name).toBe("Edited Tee");
    expect(product.price).toBe(45900);
    expect(product.seoTitle).toBe("Edited SEO");
    expect(product.specifications?.material).toBe("Edited material");
    expect(product.sizeGuide?.apparel?.[0].chestWidth).toBe("52");
    expect(product.status).toBe("draft");
    expect(product.isVisible).toBe(false);
    expect(product.isFeatured).toBe(false);
    expect(variant.sku).toBe("EDITED-SKU");
    expect(variant.stockQuantity).toBe(7);
    expect(variant.reservedQuantity).toBe(0);
    expect(database.images).toHaveLength(1);
    expect(database.images[0].isPrimary).toBe(true);
  });

  it("keeps product image ordering and primary image deterministic", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);
    database.images.push(
      {
        id: "img-second",
        productId: "prod-garconmaires-eyewear",
        url: "https://example.com/2.jpg",
        alt: "Second",
        sortOrder: 10,
        isPrimary: false,
        createdAt: "2026-06-08T00:00:00.000Z",
      },
      {
        id: "img-first",
        productId: "prod-garconmaires-eyewear",
        url: "https://example.com/1.jpg",
        alt: "First",
        sortOrder: 5,
        isPrimary: false,
        createdAt: "2026-06-08T00:00:00.000Z",
      },
    );

    normalizeProductImageOrder(database, "prod-garconmaires-eyewear");
    setPrimaryProductImage(database, "img-second");

    expect(database.images.find((image) => image.id === "img-first")?.sortOrder).toBe(0);
    expect(database.images.find((image) => image.id === "img-second")?.sortOrder).toBe(1);
    expect(database.images.find((image) => image.id === "img-second")?.isPrimary).toBe(true);
    expect(database.images.find((image) => image.id === "img-first")?.isPrimary).toBe(false);
  });

  it("validates duplicate SKUs and reserved stock safety for admin editing", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);
    const variants = database.variants.filter((variant) =>
      variant.productId.startsWith("prod-garconmaires-"),
    );
    variants[0].sku = variants[1].sku;

    expect(duplicateSkuValues(variants)).toEqual([variants[0].sku]);
    expect(() =>
      assertVariantStockIsSafe({
        sku: "GM-TEST",
        stockQuantity: 0,
        reservedQuantity: 1,
      }),
    ).toThrow("reservedQuantity");
  });

  it("reports admin-only preview and completion warnings without making products public", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);
    const product = database.products.find(
      (item) => item.id === "prod-garconmaires-eyewear",
    );
    const variants = database.variants.filter((variant) => variant.productId === product?.id);

    expect(product?.sizeGuide?.eyewear?.lensWidth).toBe("[to confirm]");
    expect(product).toBeTruthy();
    if (!product) {
      throw new Error("Missing seeded draft product fixture.");
    }

    const warnings = getProductAdminWarnings({
      product,
      variants,
      images: [],
      shopEnabled: database.settings.shopEnabled,
      shopMode: database.settings.shopMode,
    });

    expect(warnings.map((warning) => warning.code)).toContain("missing_images");
    expect(warnings.map((warning) => warning.code)).toContain("placeholder_specs");
    expect(
      database.products.filter(
        (item) => item.id.startsWith("prod-garconmaires-") && item.isVisible,
      ),
    ).toHaveLength(0);
  });

  it("does not allow seeded real products to be purchased during pre-launch", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);
    const product = database.products.find(
      (item) => item.id === "prod-garconmaires-black-tshirt",
    );
    const variant = database.variants.find((item) => item.productId === product?.id);
    const cart = findOrCreateCart(database, "session-draft-product");

    expect(product).toBeTruthy();
    expect(variant).toBeTruthy();
    if (!product || !variant) {
      throw new Error("Missing seeded draft product fixture.");
    }

    variant.stockQuantity = 1;
    addCartItem(database, {
      sessionId: cart.sessionId,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
    });

    expect(validateCart(database, cart).ok).toBe(false);
    expect(validateCart(database, cart, { allowDisabledShop: true }).ok).toBe(false);
  });
});

describe("public storefront catalog gating", () => {
  it("returns a pre-launch collection state with no public products while shop is disabled", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);
    const catalog = getPublicCatalogStateFromDatabase(database);

    expect(catalog.storefrontLive).toBe(false);
    expect(catalog.products).toHaveLength(0);
    expect(database.settings.shopEnabled).toBe(false);
    expect(database.settings.shopMode).toBe("PRE_LAUNCH");
  });

  it("excludes hidden, draft, archived and sandbox products from public queries", () => {
    const database = createDefaultStoreDatabase();

    for (const product of database.products) {
      product.status = "draft";
      product.isVisible = false;
    }
    seedDraftProducts(database);
    database.products.push({
      id: sandboxProductId,
      name: "Sandbox",
      slug: "sandbox",
      shortDescription: "",
      editorialDescription: "",
      technicalDescription: "",
      price: 100,
      currency: "PLN",
      status: "active",
      isVisible: true,
      isFeatured: false,
      categoryId: null,
      dropId: "drop-01",
      createdAt: "2026-06-08T00:00:00.000Z",
      updatedAt: "2026-06-08T00:00:00.000Z",
    });
    database.settings.shopEnabled = true;
    database.settings.shopMode = "PUBLIC_DROP";
    database.drops[0].status = "live";

    const draftProduct = database.products.find(
      (product) => product.id === "prod-garconmaires-black-tshirt",
    );

    expect(draftProduct).toBeTruthy();
    if (!draftProduct) {
      throw new Error("Missing seeded draft product fixture.");
    }

    expect(isPublicProductCandidate(database, draftProduct)).toBe(false);
    expect(
      isPublicProductCandidate(
        database,
        database.products.find((product) => product.id === sandboxProductId)!,
      ),
    ).toBe(false);
    expect(getPublicCatalogStateFromDatabase(database).products).toHaveLength(0);
  });

  it("requires shop enabled, PUBLIC_DROP mode, live drop, active status and visibility", () => {
    const database = createDefaultStoreDatabase();

    for (const product of database.products) {
      product.status = "draft";
      product.isVisible = false;
    }
    seedDraftProducts(database);
    const product = database.products.find(
      (item) => item.id === "prod-garconmaires-black-hoodie",
    );
    const variant = database.variants.find((item) => item.productId === product?.id);

    expect(product).toBeTruthy();
    expect(variant).toBeTruthy();
    if (!product || !variant) {
      throw new Error("Missing seeded draft product fixture.");
    }

    product.status = "active";
    product.isVisible = true;
    variant.stockQuantity = 4;
    variant.reservedQuantity = 1;
    variant.isAvailable = true;

    expect(getPublicCatalogStateFromDatabase(database).products).toHaveLength(0);

    database.settings.shopEnabled = true;
    database.settings.shopMode = "PUBLIC_DROP";
    database.drops.find((drop) => drop.id === "drop-01")!.status = "live";

    const catalog = getPublicCatalogStateFromDatabase(database);
    const productIds = catalog.products.map((item) => item.id);

    expect(catalog.storefrontLive).toBe(true);
    expect(productIds).toEqual([product.id]);
    expect(catalog.products.find((item) => item.id === product.id)).toMatchObject({
      id: product.id,
      slug: product.slug,
      price: 89900,
      dropName: "DROP 01",
    });
    expect(
      catalog.products
        .find((item) => item.id === product.id)
        ?.variants.find((item) => item.id === variant.id),
    ).toMatchObject({
      sku: variant.sku,
      availableStock: 3,
    });
    expect(JSON.stringify(catalog.products[0])).not.toContain("reservedQuantity");
    expect(JSON.stringify(catalog.products[0])).not.toContain("internalNotes");
  });

  it("keeps sitemap product candidates empty for the current hidden pre-launch state", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);

    expect(getPublicCatalogStateFromDatabase(database).products.map((product) => product.slug)).toEqual([]);
  });

  it("sanitizes a public product without leaking reserved stock or internal admin notes", () => {
    const database = createDefaultStoreDatabase();

    seedDraftProducts(database);
    const product = database.products.find(
      (item) => item.id === "prod-garconmaires-eyewear",
    );
    const variant = database.variants.find((item) => item.productId === product?.id);

    expect(product).toBeTruthy();
    expect(variant).toBeTruthy();
    if (!product || !variant) {
      throw new Error("Missing seeded draft product fixture.");
    }

    product.internalNotes = "Supplier secret";
    variant.stockQuantity = 2;
    variant.reservedQuantity = 1;
    variant.isAvailable = true;

    const publicProduct = toPublicProduct(database, product);

    expect(publicProduct.variants[0].availableStock).toBe(1);
    expect(JSON.stringify(publicProduct)).not.toContain("Supplier secret");
    expect(JSON.stringify(publicProduct)).not.toContain("reservedQuantity");
  });
});

describe("post-purchase ownership checks", () => {
  it("validates return requests against the order email and items", () => {
    const { database } = makeCheckoutDatabase();
    const order = createPendingOrder(database);
    const item = order.items[0];

    expect(
      findOrderForCustomerRequest(database, {
        orderNumber: order.orderNumber,
        customerEmail: "wrong@example.com",
      }),
    ).toBeNull();
    expect(
      validateReturnItemsForOrder(order, [
        { productId: item.productId, variantId: item.variantId, quantity: 1 },
      ]),
    ).toBe(true);

    const returnRequest = createReturnRequest(database, {
      orderId: order.id,
      customerEmail: order.customer.email,
      selectedItems: [
        { productId: item.productId, variantId: item.variantId, quantity: 1 },
      ],
    });

    expect(returnRequest.status).toBe("requested");
  });

  it("validates complaint products against the purchased order", () => {
    const { database } = makeCheckoutDatabase();
    const order = createPendingOrder(database);
    const item = order.items[0];

    expect(
      validateComplaintProductForOrder(order, {
        productId: "not-in-order",
        variantId: item.variantId,
      }),
    ).toBe(false);
    expect(
      validateComplaintProductForOrder(order, {
        productId: item.productId,
        variantId: item.variantId,
      }),
    ).toBe(true);

    const complaint = createComplaint(database, {
      orderId: order.id,
      customerEmail: order.customer.email,
      productId: item.productId,
      description: "Szew przy kieszeni rozszedł się po pierwszym użyciu.",
      preferredSolution: "replacement",
    });

    expect(complaint.status).toBe("submitted");
  });
});
