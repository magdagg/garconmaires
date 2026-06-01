import type { Delivery, DeliveryMethod } from "./types";

export type DeliveryProvider = "inpost" | "manual";

export type DeliveryQuote = {
  method: DeliveryMethod;
  provider: DeliveryProvider;
  price: number;
  currency: "PLN";
  label: string;
};

export function getDefaultDeliveryQuotes({
  subtotal,
  freeShippingThreshold,
  defaultDeliveryPrice,
}: {
  subtotal: number;
  freeShippingThreshold: number;
  defaultDeliveryPrice: number;
}): DeliveryQuote[] {
  const price = subtotal >= freeShippingThreshold ? 0 : defaultDeliveryPrice;

  return [
    {
      method: "inpost_courier",
      provider: "inpost",
      price,
      currency: "PLN",
      label: price === 0 ? "InPost kurier - gratis" : "InPost kurier",
    },
    {
      method: "inpost_locker",
      provider: "inpost",
      price,
      currency: "PLN",
      label: price === 0 ? "InPost Paczkomat - gratis" : "InPost Paczkomat",
    },
  ];
}

export function createPendingDelivery(input: {
  method: DeliveryMethod;
  price: number;
  parcelLockerId?: string | null;
  parcelLockerAddress?: string | null;
}): Delivery {
  return {
    deliveryMethod: input.method,
    parcelLockerId: input.parcelLockerId ?? null,
    parcelLockerAddress: input.parcelLockerAddress ?? null,
    deliveryPrice: input.price,
    trackingNumber: null,
    labelUrl: null,
    deliveryStatus: "pending",
  };
}
