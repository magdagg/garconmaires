import { describe, expect, it } from "vitest";
import { addCartItem, findOrCreateCart, validateCart } from "../cart";
import { createDefaultStoreDatabase } from "../defaults";
import {
  releaseExpiredReservations,
  reserveVariantStock,
} from "../inventory";
import {
  createOrderFromCart,
  findOrderForCustomerRequest,
  markOrderPaidFromVerifiedProvider,
  markOrderPaymentFailedOrCancelled,
} from "../orders";
import {
  createComplaint,
  createReturnRequest,
  validateComplaintProductForOrder,
  validateReturnItemsForOrder,
} from "../operations";
import type { StoreDatabase } from "../types";

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
