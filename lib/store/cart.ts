import type { Cart, CartItem, StoreDatabase } from "./types";
import { addMinutes, createId, nowIso } from "./ids";
import { getDefaultDeliveryQuotes } from "./delivery";
import { getAvailableStock, isProductPubliclyBuyable, releaseExpiredReservations } from "./inventory";

export type AddCartItemInput = {
  sessionId: string;
  productId: string;
  variantId?: string;
  size?: string;
  quantity: number;
};

function recalculateCart(database: StoreDatabase, cart: Cart) {
  cart.subtotal = cart.items.reduce(
    (sum, item) => sum + item.priceAtTime * item.quantity,
    0,
  );
  cart.deliveryCost =
    getDefaultDeliveryQuotes({
      subtotal: cart.subtotal,
      freeShippingThreshold: database.settings.freeShippingThreshold,
      defaultDeliveryPrice: database.settings.defaultDeliveryPrice,
    })[0]?.price ?? database.settings.defaultDeliveryPrice;
  cart.total = Math.max(0, cart.subtotal + cart.deliveryCost - cart.discount);
  cart.updatedAt = nowIso();
}

export function findOrCreateCart(database: StoreDatabase, sessionId: string) {
  const now = nowIso();
  let cart = database.carts.find((item) => item.sessionId === sessionId);

  if (!cart) {
    cart = {
      id: createId("cart"),
      sessionId,
      items: [],
      subtotal: 0,
      deliveryCost: database.settings.defaultDeliveryPrice,
      discount: 0,
      total: database.settings.defaultDeliveryPrice,
      expiresAt: addMinutes(new Date(), 60 * 24 * 14).toISOString(),
      createdAt: now,
      updatedAt: now,
    };
    database.carts.push(cart);
  }

  return cart;
}

export function validateCart(
  database: StoreDatabase,
  cart: Cart,
  options: { allowDisabledShop?: boolean } = {},
) {
  releaseExpiredReservations(database);

  const errors: string[] = [];

  if (
    !options.allowDisabledShop &&
    (!database.settings.shopEnabled || database.settings.shopMode === "PRE_LAUNCH")
  ) {
    errors.push("Sklep nie jest jeszcze publicznie uruchomiony.");
  }

  if (database.settings.maintenanceMode) {
    errors.push("Sklep jest tymczasowo w trybie konserwacji.");
  }

  for (const item of cart.items) {
    const product = database.products.find((entry) => entry.id === item.productId);
    const variant = database.variants.find((entry) => entry.id === item.variantId);

    if (!product || !variant) {
      errors.push("Jeden z produktów nie jest już dostępny.");
      continue;
    }

    if (!options.allowDisabledShop && !isProductPubliclyBuyable(product)) {
      errors.push(`${product.name} nie jest aktualnie dostępny w sprzedaży.`);
    }

    if (
      options.allowDisabledShop &&
      (product.status !== "active" || product.isVisible)
    ) {
      errors.push(`${product.name} nie jest aktualnie dostępny w sprzedaży.`);
    }

    if (!variant.isAvailable || getAvailableStock(variant) < item.quantity) {
      errors.push(`${product.name} / ${variant.size} jest niedostępny w tej ilości.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function addCartItem(database: StoreDatabase, input: AddCartItemInput) {
  const cart = findOrCreateCart(database, input.sessionId);
  const product = database.products.find((item) => item.id === input.productId);
  const variant = database.variants.find((item) =>
    input.variantId
      ? item.id === input.variantId
      : item.productId === input.productId && item.size === input.size,
  );

  if (!product || !variant) {
    throw new Error("Produkt lub wariant nie istnieje.");
  }

  const priceAtTime = variant.priceOverride ?? product.price;
  const quantity = Math.max(1, Math.min(10, Math.floor(input.quantity)));
  const existing = cart.items.find((item) => item.variantId === variant.id);
  const timestamp = nowIso();

  if (existing) {
    existing.quantity += quantity;
    existing.updatedAt = timestamp;
  } else {
    const item: CartItem = {
      id: createId("cart_item"),
      productId: product.id,
      variantId: variant.id,
      quantity,
      priceAtTime,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    cart.items.push(item);
  }

  recalculateCart(database, cart);

  return cart;
}

export function updateCartItemQuantity(
  database: StoreDatabase,
  sessionId: string,
  itemId: string,
  quantity: number,
) {
  const cart = findOrCreateCart(database, sessionId);

  if (quantity <= 0) {
    cart.items = cart.items.filter((item) => item.id !== itemId);
  } else {
    const item = cart.items.find((entry) => entry.id === itemId);

    if (item) {
      item.quantity = Math.max(1, Math.min(10, Math.floor(quantity)));
      item.updatedAt = nowIso();
    }
  }

  recalculateCart(database, cart);
  return cart;
}

export function serializeCart(database: StoreDatabase, cart: Cart) {
  return {
    ...cart,
    items: cart.items.map((item) => {
      const product = database.products.find((entry) => entry.id === item.productId);
      const variant = database.variants.find((entry) => entry.id === item.variantId);

      return {
        ...item,
        productName: product?.name ?? "Produkt",
        productSlug: product?.slug ?? "",
        size: variant?.size ?? "",
        availableStock: variant ? getAvailableStock(variant) : 0,
      };
    }),
  };
}
