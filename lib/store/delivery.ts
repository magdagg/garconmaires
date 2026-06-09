import type {
  Delivery,
  DeliveryMethod,
  DeliveryMethodSetting,
  DeliveryProvider,
  Order,
  ShippingAddress,
  StoreSettings,
} from "./types";

export type DeliveryQuote = {
  method: DeliveryMethod;
  provider: DeliveryProvider;
  price: number;
  currency: "PLN";
  label: string;
  estimatedDeliveryTime: string;
};

export type CheckoutDeliveryInput = {
  deliveryMethodId?: string | null;
  deliveryMethod?: DeliveryMethod | null;
  parcelLockerId?: string | null;
  parcelLockerName?: string | null;
  parcelLockerAddress?: string | null;
  adminNote?: string | null;
};

export type InPostDeliveryAdapter = {
  createShipment: (order: Order) => Promise<{ trackingNumber: string; labelUrl?: string | null }>;
  getTracking: (order: Order) => Promise<{ status: string; trackingUrl?: string | null }>;
  createLabel: (order: Order) => Promise<{ labelUrl: string }>;
  cancelShipment: (order: Order) => Promise<void>;
  findParcelLocker?: (query: string) => Promise<Array<{ id: string; name: string; address: string }>>;
};

export const defaultDeliveryMethods: DeliveryMethodSetting[] = [
  {
    id: "inpost_locker",
    name: "InPost Paczkomat",
    type: "parcel_locker",
    provider: "inpost",
    description: "Odbiór w wybranym Paczkomacie InPost.",
    nameEn: "InPost Parcel Locker",
    descriptionEn: "Pickup from a selected InPost parcel locker.",
    serviceCode: "inpost_locker_standard",
    freeShippingEligible: true,
    requiresParcelLocker: true,
    requiresShippingAddress: false,
    price: 1499,
    currency: "PLN",
    estimatedDeliveryTime: "1-3 dni robocze",
    estimatedDeliveryTimeEn: "1-3 business days",
    enabled: true,
    displayOrder: 10,
  },
  {
    id: "inpost_courier",
    name: "Kurier",
    type: "courier",
    provider: "inpost",
    description: "Dostawa kurierska pod adres.",
    nameEn: "Courier",
    descriptionEn: "Courier delivery to an address.",
    serviceCode: "inpost_courier_standard",
    freeShippingEligible: true,
    requiresParcelLocker: false,
    requiresShippingAddress: true,
    price: 1799,
    currency: "PLN",
    estimatedDeliveryTime: "1-3 dni robocze",
    estimatedDeliveryTimeEn: "1-3 business days",
    enabled: true,
    displayOrder: 20,
  },
  {
    id: "courier",
    name: "Odbiór osobisty",
    type: "manual_pickup",
    provider: "manual",
    description: "Placeholder do ręcznego odbioru.",
    nameEn: "Manual pickup",
    descriptionEn: "Manual pickup placeholder.",
    serviceCode: undefined,
    freeShippingEligible: false,
    requiresParcelLocker: false,
    requiresShippingAddress: false,
    price: 0,
    currency: "PLN",
    estimatedDeliveryTime: "Do ustalenia",
    estimatedDeliveryTimeEn: "To be arranged",
    enabled: false,
    displayOrder: 30,
  },
];

function isDeliveryMethodId(value: unknown): value is DeliveryMethod {
  return (
    value === "inpost_locker" ||
    value === "inpost_courier" ||
    value === "courier"
  );
}

function normalizeDeliveryMethodSetting(
  value: Partial<DeliveryMethodSetting>,
): DeliveryMethodSetting | null {
  if (!isDeliveryMethodId(value.id)) {
    return null;
  }

  const fallback = defaultDeliveryMethods.find((item) => item.id === value.id);

  if (!fallback) {
    return null;
  }

  return {
    id: value.id,
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : fallback.name,
    type: value.type ?? fallback.type,
    provider: value.provider === "manual" ? "manual" : fallback.provider,
    description:
      typeof value.description === "string" ? value.description : fallback.description,
    nameEn: typeof value.nameEn === "string" ? value.nameEn : fallback.nameEn,
    descriptionEn:
      typeof value.descriptionEn === "string"
        ? value.descriptionEn
        : fallback.descriptionEn,
    serviceCode:
      typeof value.serviceCode === "string" ? value.serviceCode : fallback.serviceCode,
    freeShippingEligible: Boolean(
      value.freeShippingEligible ?? fallback.freeShippingEligible,
    ),
    requiresParcelLocker: Boolean(
      value.requiresParcelLocker ?? fallback.requiresParcelLocker,
    ),
    requiresShippingAddress: Boolean(
      value.requiresShippingAddress ?? fallback.requiresShippingAddress,
    ),
    price: Number.isFinite(value.price) ? Math.max(0, Number(value.price)) : fallback.price,
    currency: "PLN",
    estimatedDeliveryTime:
      typeof value.estimatedDeliveryTime === "string" && value.estimatedDeliveryTime.trim()
        ? value.estimatedDeliveryTime.trim()
        : fallback.estimatedDeliveryTime,
    estimatedDeliveryTimeEn:
      typeof value.estimatedDeliveryTimeEn === "string" &&
      value.estimatedDeliveryTimeEn.trim()
        ? value.estimatedDeliveryTimeEn.trim()
        : fallback.estimatedDeliveryTimeEn,
    enabled: Boolean(value.enabled ?? fallback.enabled),
    displayOrder: Number.isFinite(value.displayOrder)
      ? Number(value.displayOrder)
      : fallback.displayOrder,
  };
}

export function normalizeDeliveryMethods(input: unknown): DeliveryMethodSetting[] {
  const configured = Array.isArray(input)
    ? input
        .map((item) => normalizeDeliveryMethodSetting(item as Partial<DeliveryMethodSetting>))
        .filter((item): item is DeliveryMethodSetting => Boolean(item))
    : [];
  const merged = defaultDeliveryMethods.map(
    (fallback) => configured.find((item) => item.id === fallback.id) ?? fallback,
  );

  return merged.sort((left, right) => left.displayOrder - right.displayOrder);
}

export function getDeliveryMethods(settings: Pick<StoreSettings, "deliveryMethods">) {
  return normalizeDeliveryMethods(settings.deliveryMethods);
}

export function calculateDeliveryPrice({
  method,
  subtotal,
  freeShippingThreshold,
}: {
  method: DeliveryMethodSetting;
  subtotal: number;
  freeShippingThreshold: number;
}) {
  return freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
    ? 0
    : method.price;
}

export function getDefaultDeliveryQuotes({
  subtotal,
  freeShippingThreshold,
  defaultDeliveryPrice,
  deliveryMethods,
}: {
  subtotal: number;
  freeShippingThreshold: number;
  defaultDeliveryPrice: number;
  deliveryMethods?: DeliveryMethodSetting[];
}): DeliveryQuote[] {
  const methods = normalizeDeliveryMethods(deliveryMethods);

  return methods
    .filter((method) => method.enabled)
    .map((method) => {
      const price = calculateDeliveryPrice({ method, subtotal, freeShippingThreshold });

      return {
        method: method.id,
        provider: method.provider,
        price: method.id === "inpost_courier" && method.price === 0 ? defaultDeliveryPrice : price,
        currency: "PLN",
        label: price === 0 ? `${method.name} - gratis` : method.name,
        estimatedDeliveryTime: method.estimatedDeliveryTime,
      };
    });
}

export function selectDeliveryMethod({
  settings,
  delivery,
}: {
  settings: Pick<StoreSettings, "deliveryMethods">;
  delivery?: CheckoutDeliveryInput | null;
}) {
  const methods = getDeliveryMethods(settings);
  const requestedId = delivery?.deliveryMethodId ?? delivery?.deliveryMethod;
  const method =
    (requestedId ? methods.find((item) => item.id === requestedId && item.enabled) : null) ??
    methods.find((item) => item.id === "inpost_courier" && item.enabled) ??
    methods.find((item) => item.enabled);

  if (!method) {
    throw new Error("Brak dostępnej metody dostawy.");
  }

  return method;
}

export function validateDeliverySelection({
  method,
  delivery,
  customer,
  shippingAddress,
}: {
  method: DeliveryMethodSetting;
  delivery?: CheckoutDeliveryInput | null;
  customer: { email?: string | null; phone?: string | null };
  shippingAddress?: Partial<ShippingAddress> | null;
}) {
  if (!customer.email?.trim()) {
    throw new Error("Adres e-mail jest wymagany do dostawy.");
  }

  if (!customer.phone?.trim()) {
    throw new Error("Telefon jest wymagany do dostawy.");
  }

  if (method.type === "parcel_locker" && !delivery?.parcelLockerId?.trim()) {
    throw new Error("Wybierz Paczkomat InPost dla tej metody dostawy.");
  }

  if (method.type === "courier") {
    const requiredAddress = [
      shippingAddress?.addressLine1,
      shippingAddress?.postalCode,
      shippingAddress?.city,
    ];

    if (requiredAddress.some((value) => !value?.trim())) {
      throw new Error("Adres dostawy jest wymagany dla przesyłki kurierskiej.");
    }
  }
}

export function createPendingDelivery(input: {
  method: DeliveryMethodSetting;
  price: number;
  parcelLockerId?: string | null;
  parcelLockerName?: string | null;
  parcelLockerAddress?: string | null;
  adminNote?: string | null;
}): Delivery {
  return {
    deliveryMethod: input.method.id,
    shipmentProvider: input.method.provider,
    parcelLockerId: input.parcelLockerId ?? null,
    parcelLockerName: input.parcelLockerName ?? null,
    parcelLockerAddress: input.parcelLockerAddress ?? null,
    deliveryPrice: input.price,
    trackingNumber: null,
    trackingUrl: null,
    labelUrl: null,
    shippedAt: null,
    adminNote: input.adminNote ?? null,
    deliveryStatus: "pending",
  };
}

export function getTrackingUrl(input: {
  provider?: DeliveryProvider | string | null;
  trackingNumber?: string | null;
}) {
  const trackingNumber = input.trackingNumber?.trim();

  if (!trackingNumber) {
    return null;
  }

  if (input.provider === "inpost") {
    return `https://inpost.pl/sledzenie-przesylek?number=${encodeURIComponent(trackingNumber)}`;
  }

  return null;
}
