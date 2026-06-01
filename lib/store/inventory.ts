import type {
  InventoryReservation,
  Product,
  ProductVariant,
  StoreDatabase,
} from "./types";
import { addMinutes, createId, nowIso } from "./ids";

export function getAvailableStock(variant: ProductVariant) {
  return Math.max(0, variant.stockQuantity - variant.reservedQuantity);
}

export function isProductPubliclyBuyable(product: Product) {
  return product.isVisible && product.status === "active";
}

export function releaseExpiredReservations(database: StoreDatabase) {
  const now = Date.now();
  const releasedIds: string[] = [];

  database.reservations = database.reservations.map((reservation) => {
    if (
      reservation.status !== "active" ||
      new Date(reservation.expiresAt).getTime() > now
    ) {
      return reservation;
    }

    const variant = database.variants.find(
      (item) => item.id === reservation.variantId,
    );

    if (variant) {
      variant.reservedQuantity = Math.max(
        0,
        variant.reservedQuantity - reservation.quantity,
      );
      variant.updatedAt = nowIso();
    }

    releasedIds.push(reservation.id);

    return {
      ...reservation,
      status: "released",
      updatedAt: nowIso(),
    };
  });

  return releasedIds;
}

export function syncProductSoldOutStatus(database: StoreDatabase, productId: string) {
  const product = database.products.find((item) => item.id === productId);

  if (!product || product.status === "draft" || product.status === "archived") {
    return;
  }

  const variants = database.variants.filter((item) => item.productId === productId);
  const hasAvailableVariant = variants.some(
    (variant) => variant.isAvailable && getAvailableStock(variant) > 0,
  );

  if (!hasAvailableVariant && product.status === "active") {
    product.status = "sold_out";
    product.updatedAt = nowIso();
  }
}

export function reserveVariantStock({
  database,
  variantId,
  quantity,
  cartId,
  orderId,
  minutes = 30,
}: {
  database: StoreDatabase;
  variantId: string;
  quantity: number;
  cartId?: string | null;
  orderId?: string | null;
  minutes?: number;
}) {
  releaseExpiredReservations(database);

  const variant = database.variants.find((item) => item.id === variantId);

  if (!variant || !variant.isAvailable || getAvailableStock(variant) < quantity) {
    return null;
  }

  const timestamp = nowIso();
  const reservation: InventoryReservation = {
    id: createId("res"),
    cartId: cartId ?? null,
    orderId: orderId ?? null,
    variantId,
    quantity,
    status: "active",
    expiresAt: addMinutes(new Date(), minutes).toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  variant.reservedQuantity += quantity;
  variant.updatedAt = timestamp;
  database.reservations.push(reservation);

  return reservation;
}

export function releaseReservations(database: StoreDatabase, reservationIds: string[]) {
  const timestamp = nowIso();

  for (const reservation of database.reservations) {
    if (!reservationIds.includes(reservation.id) || reservation.status !== "active") {
      continue;
    }

    const variant = database.variants.find(
      (item) => item.id === reservation.variantId,
    );

    if (variant) {
      variant.reservedQuantity = Math.max(
        0,
        variant.reservedQuantity - reservation.quantity,
      );
      variant.updatedAt = timestamp;
    }

    reservation.status = "released";
    reservation.updatedAt = timestamp;
  }
}

export function commitReservations(database: StoreDatabase, reservationIds: string[]) {
  const timestamp = nowIso();

  for (const reservation of database.reservations) {
    if (!reservationIds.includes(reservation.id) || reservation.status !== "active") {
      continue;
    }

    const variant = database.variants.find(
      (item) => item.id === reservation.variantId,
    );

    if (variant) {
      variant.reservedQuantity = Math.max(
        0,
        variant.reservedQuantity - reservation.quantity,
      );
      variant.stockQuantity = Math.max(0, variant.stockQuantity - reservation.quantity);
      variant.updatedAt = timestamp;
      syncProductSoldOutStatus(database, variant.productId);
    }

    reservation.status = "committed";
    reservation.updatedAt = timestamp;
  }
}
