import type {
  ConsentLog,
  CustomerData,
  Delivery,
  InvoiceData,
  Order,
  OrderItemSnapshot,
  PaymentTransaction,
  ShippingAddress,
  StoreDatabase,
} from "./types";
import { createId, nowIso } from "./ids";
import { createPendingDelivery } from "./delivery";
import { commitReservations, releaseReservations, reserveVariantStock } from "./inventory";
import { getDefaultPaymentProvider } from "./payments";

export type CheckoutCustomerInput = {
  customer?: Partial<CustomerData>;
  shippingAddress?: Partial<ShippingAddress>;
  invoice?: Partial<InvoiceData>;
  delivery?: Partial<Delivery>;
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  marketingConsent?: boolean;
};

function getNextOrderNumber(database: StoreDatabase) {
  const year = new Date().getFullYear();
  const yearPrefix = `GM-${year}-`;
  const max = database.orders
    .filter((order) => order.orderNumber.startsWith(yearPrefix))
    .map((order) => Number.parseInt(order.orderNumber.replace(yearPrefix, ""), 10))
    .filter(Number.isFinite)
    .reduce((current, value) => Math.max(current, value), 0);

  return `${yearPrefix}${String(max + 1).padStart(4, "0")}`;
}

function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Brak wymaganego pola: ${field}.`);
  }

  return value.trim();
}

export function createOrderFromCart({
  database,
  cartId,
  input,
}: {
  database: StoreDatabase;
  cartId: string;
  input: CheckoutCustomerInput;
}) {
  const cart = database.carts.find((item) => item.id === cartId);

  if (!cart || cart.items.length === 0) {
    throw new Error("Koszyk jest pusty.");
  }

  if (!input.acceptedTerms || !input.acceptedPrivacy) {
    throw new Error("Akceptacja regulaminu i polityki prywatności jest wymagana.");
  }

  const customer: CustomerData = {
    firstName: requireText(input.customer?.firstName, "imię"),
    lastName: requireText(input.customer?.lastName, "nazwisko"),
    email: requireText(input.customer?.email, "e-mail"),
    phone: requireText(input.customer?.phone, "telefon"),
  };

  const shippingAddress: ShippingAddress = {
    firstName: requireText(
      input.shippingAddress?.firstName ?? customer.firstName,
      "imię odbiorcy",
    ),
    lastName: requireText(
      input.shippingAddress?.lastName ?? customer.lastName,
      "nazwisko odbiorcy",
    ),
    addressLine1: requireText(input.shippingAddress?.addressLine1, "adres"),
    addressLine2: input.shippingAddress?.addressLine2?.trim() || undefined,
    postalCode: requireText(input.shippingAddress?.postalCode, "kod pocztowy"),
    city: requireText(input.shippingAddress?.city, "miasto"),
    country: "PL",
  };

  const invoice: InvoiceData = {
    wantsInvoice: Boolean(input.invoice?.wantsInvoice),
    companyName: input.invoice?.companyName?.trim(),
    nip: input.invoice?.nip?.trim(),
    companyAddress: input.invoice?.companyAddress?.trim(),
  };

  const delivery: Delivery = createPendingDelivery({
    method: input.delivery?.deliveryMethod ?? "inpost_courier",
    price: cart.deliveryCost,
    parcelLockerId: input.delivery?.parcelLockerId,
    parcelLockerAddress: input.delivery?.parcelLockerAddress,
  });

  const orderId = createId("ord");
  const reservationIds: string[] = [];
  const items: OrderItemSnapshot[] = cart.items.map((cartItem) => {
    const product = database.products.find((item) => item.id === cartItem.productId);
    const variant = database.variants.find((item) => item.id === cartItem.variantId);

    if (!product || !variant) {
      throw new Error("Jeden z produktów nie jest już dostępny.");
    }

    const reservation = reserveVariantStock({
      database,
      variantId: variant.id,
      quantity: cartItem.quantity,
      cartId: cart.id,
      orderId,
      minutes: 30,
    });

    if (!reservation) {
      throw new Error(`${product.name} / ${variant.size} jest niedostępny.`);
    }

    reservationIds.push(reservation.id);

    return {
      productId: product.id,
      variantId: variant.id,
      sku: variant.sku,
      name: product.name,
      slug: product.slug,
      size: variant.size,
      quantity: cartItem.quantity,
      unitPrice: cartItem.priceAtTime,
      total: cartItem.priceAtTime * cartItem.quantity,
      currency: "PLN",
    };
  });

  const timestamp = nowIso();
  const consentLog: ConsentLog = {
    termsAcceptedAt: timestamp,
    privacyAcceptedAt: timestamp,
    newsletterConsentAt: input.marketingConsent ? timestamp : null,
    marketingConsentAt: input.marketingConsent ? timestamp : null,
    legalDocumentVersion: database.settings.legalDocumentVersion,
  };

  const order: Order = {
    id: orderId,
    orderNumber: getNextOrderNumber(database),
    customer,
    shippingAddress,
    invoice,
    delivery,
    items,
    subtotal: cart.subtotal,
    deliveryCost: cart.deliveryCost,
    discount: cart.discount,
    total: cart.total,
    currency: "PLN",
    provider: getDefaultPaymentProvider(),
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    orderStatus: "new",
    trackingNumber: null,
    consentLog,
    reservationIds,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const payment: PaymentTransaction = {
    id: createId("pay"),
    orderId: order.id,
    provider: order.provider,
    paymentMethod: "unknown",
    paymentUrl: null,
    providerTransactionId: null,
    providerPaymentId: null,
    providerCustomerId: null,
    status: "pending",
    amount: order.total,
    currency: "PLN",
    rawProviderPayload: null,
    rawEventIds: [],
    paidAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  database.orders.unshift(order);
  database.payments.unshift(payment);

  return { order, payment };
}

export function markOrderPaymentStarted(
  database: StoreDatabase,
  orderId: string,
  paymentUrl: string | null,
  providerTransactionId: string | null,
) {
  const payment = database.payments.find((item) => item.orderId === orderId);

  if (payment) {
    payment.paymentUrl = paymentUrl;
    payment.providerTransactionId = providerTransactionId;
    payment.updatedAt = nowIso();
  }
}

export function markOrderPaidFromVerifiedProvider({
  database,
  orderId,
  providerTransactionId,
  eventId,
}: {
  database: StoreDatabase;
  orderId: string;
  providerTransactionId: string | null;
  eventId: string;
}) {
  const order = database.orders.find((item) => item.id === orderId);
  const payment = database.payments.find((item) => item.orderId === orderId);

  if (!order || !payment || payment.status === "paid") {
    return order ?? null;
  }

  const timestamp = nowIso();
  order.paymentStatus = "paid";
  order.orderStatus = "confirmed";
  order.fulfillmentStatus = "packing";
  order.updatedAt = timestamp;
  payment.status = "paid";
  payment.providerTransactionId =
    providerTransactionId ?? payment.providerTransactionId;
  payment.rawEventIds = Array.from(new Set([...payment.rawEventIds, eventId]));
  payment.paidAt = timestamp;
  payment.updatedAt = timestamp;

  commitReservations(database, order.reservationIds);

  return order;
}

export function markOrderPaymentFailedOrCancelled(
  database: StoreDatabase,
  orderId: string,
  status: "failed" | "cancelled" | "expired",
) {
  const order = database.orders.find((item) => item.id === orderId);
  const payment = database.payments.find((item) => item.orderId === orderId);

  if (!order) {
    return null;
  }

  if (order.paymentStatus === "paid") {
    return order;
  }

  order.paymentStatus = status;
  order.orderStatus =
    status === "cancelled" || status === "expired"
      ? "cancelled"
      : order.orderStatus;
  order.updatedAt = nowIso();
  releaseReservations(database, order.reservationIds);

  if (payment) {
    payment.status = status;
    payment.updatedAt = nowIso();
  }

  return order;
}

export function resolveOrderFromProviderReference(
  database: StoreDatabase,
  input: { orderId?: string | null; providerTransactionId?: string | null },
) {
  const orderId = input.orderId;

  if (orderId) {
    return database.orders.find((order) => order.id === orderId) ?? null;
  }

  const payment = database.payments.find(
    (item) => item.providerTransactionId === input.providerTransactionId,
  );

  return payment
    ? database.orders.find((order) => order.id === payment.orderId) ?? null
    : null;
}

export function findOrderForCustomerRequest(
  database: StoreDatabase,
  input: { orderId?: string; orderNumber?: string; customerEmail?: string },
) {
  const email = input.customerEmail?.trim().toLowerCase();
  const order = database.orders.find((candidate) => {
    const idMatches = input.orderId ? candidate.id === input.orderId : false;
    const numberMatches = input.orderNumber
      ? candidate.orderNumber === input.orderNumber
      : false;

    return idMatches || numberMatches;
  });

  if (!order || !email || order.customer.email.toLowerCase() !== email) {
    return null;
  }

  return order;
}
