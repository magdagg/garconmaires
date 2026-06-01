import type {
  AnalyticsEventName,
  Complaint,
  ComplaintSolution,
  DiscountCode,
  LegalSubmission,
  NewsletterSubscriber,
  Order,
  ReturnRequest,
  StoreDatabase,
} from "./types";
import { createId, nowIso } from "./ids";

export function createReturnRequest(
  database: StoreDatabase,
  input: Pick<ReturnRequest, "orderId" | "customerEmail" | "selectedItems" | "reason">,
) {
  const timestamp = nowIso();
  const request: ReturnRequest = {
    id: createId("ret"),
    orderId: input.orderId,
    customerEmail: input.customerEmail,
    selectedItems: input.selectedItems,
    reason: input.reason,
    status: "requested",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  database.returns.unshift(request);
  database.legalSubmissions.unshift({
    id: createId("legal"),
    type: "withdrawal",
    orderId: input.orderId,
    customerEmail: input.customerEmail,
    payload: request,
    documentVersion: database.settings.legalDocumentVersion,
    createdAt: timestamp,
  } satisfies LegalSubmission);

  return request;
}

export function validateReturnItemsForOrder(
  order: Order,
  selectedItems: { productId: string; variantId: string; quantity: number }[],
) {
  if (selectedItems.length === 0) {
    return false;
  }

  return selectedItems.every((item) =>
    order.items.some(
      (orderItem) =>
        orderItem.productId === item.productId &&
        orderItem.variantId === item.variantId &&
        item.quantity > 0 &&
        item.quantity <= orderItem.quantity,
    ),
  );
}

export function createComplaint(
  database: StoreDatabase,
  input: {
    orderId: string;
    customerEmail: string;
    productId: string;
    description: string;
    imageUrls?: string[];
    preferredSolution: ComplaintSolution;
  },
) {
  const timestamp = nowIso();
  const complaint: Complaint = {
    id: createId("cmp"),
    orderId: input.orderId,
    customerEmail: input.customerEmail,
    productId: input.productId,
    description: input.description,
    imageUrls: input.imageUrls ?? [],
    preferredSolution: input.preferredSolution,
    status: "submitted",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  database.complaints.unshift(complaint);
  database.legalSubmissions.unshift({
    id: createId("legal"),
    type: "complaint",
    orderId: input.orderId,
    customerEmail: input.customerEmail,
    payload: complaint,
    documentVersion: database.settings.legalDocumentVersion,
    createdAt: timestamp,
  });

  return complaint;
}

export function validateComplaintProductForOrder(
  order: Order,
  input: { productId: string; variantId?: string | null },
) {
  return order.items.some(
    (item) =>
      item.productId === input.productId &&
      (!input.variantId || item.variantId === input.variantId),
  );
}

export function upsertNewsletterSubscriber(
  database: StoreDatabase,
  input: {
    email: string;
    consent: boolean;
    source: string;
    earlyAccess?: boolean;
    tags?: string[];
  },
) {
  const email = input.email.trim().toLowerCase();
  const timestamp = nowIso();
  const existing = database.newsletterSubscribers.find(
    (subscriber) => subscriber.email === email,
  );

  if (existing) {
    existing.consent = input.consent;
    existing.consentTimestamp = timestamp;
    existing.source = input.source;
    existing.earlyAccess = Boolean(input.earlyAccess ?? existing.earlyAccess);
    existing.tags = Array.from(new Set([...existing.tags, ...(input.tags ?? [])]));
    existing.updatedAt = timestamp;
    return existing;
  }

  const subscriber: NewsletterSubscriber = {
    id: createId("sub"),
    email,
    consent: input.consent,
    consentTimestamp: timestamp,
    source: input.source,
    status: "pending",
    earlyAccess: Boolean(input.earlyAccess),
    tags: input.tags ?? [],
    confirmationToken: createId("confirm"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  database.newsletterSubscribers.unshift(subscriber);
  return subscriber;
}

export function createDiscountCode(
  database: StoreDatabase,
  input: Omit<DiscountCode, "id" | "usedCount" | "createdAt" | "updatedAt">,
) {
  const timestamp = nowIso();
  const discount: DiscountCode = {
    ...input,
    id: createId("disc"),
    code: input.code.trim().toUpperCase(),
    usedCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  database.discounts.unshift(discount);
  return discount;
}

export function trackAnalyticsEvent(
  database: StoreDatabase,
  input: {
    name: AnalyticsEventName;
    sessionId?: string | null;
    customerEmail?: string | null;
    orderId?: string | null;
    productId?: string | null;
    data?: Record<string, unknown>;
  },
) {
  const event = {
    id: createId("ana"),
    name: input.name,
    sessionId: input.sessionId ?? null,
    customerEmail: input.customerEmail ?? null,
    orderId: input.orderId ?? null,
    productId: input.productId ?? null,
    data: input.data ?? {},
    createdAt: nowIso(),
  };

  database.analyticsEvents.unshift(event);
  return event;
}
