export type ProductStatus = "draft" | "hidden" | "active" | "sold_out" | "archived";
export type DropStatus = "draft" | "upcoming" | "early_access" | "live" | "closed" | "archived";
export type ShopMode = "PRE_LAUNCH" | "EARLY_ACCESS" | "PUBLIC_DROP" | "CLOSED";
export type PaymentProvider = "przelewy24" | "payu" | "tpay";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded" | "partially_refunded";
export type FulfillmentStatus = "unfulfilled" | "packing" | "shipped" | "delivered" | "returned";
export type OrderStatus = "new" | "confirmed" | "processing" | "completed" | "cancelled";
export type DeliveryMethod = "inpost_locker" | "inpost_courier" | "courier";
export type DeliveryStatus = "pending" | "label_created" | "shipped" | "delivered" | "returned";
export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected";
export type ComplaintStatus = "submitted" | "under_review" | "accepted" | "rejected" | "resolved";
export type ComplaintSolution = "repair" | "replacement" | "refund" | "price_reduction";
export type NewsletterStatus = "pending" | "confirmed" | "unsubscribed";
export type DiscountType = "percentage" | "fixed_amount" | "free_shipping";
export type AnalyticsEventName =
  | "view_product"
  | "add_to_cart"
  | "begin_checkout"
  | "payment_started"
  | "payment_success"
  | "payment_failed"
  | "purchase"
  | "newsletter_signup";

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type Drop = {
  id: string;
  name: string;
  slug: string;
  status: DropStatus;
  launchDate: string | null;
  endDate: string | null;
  description: string;
  isPasswordProtected: boolean;
  earlyAccessEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  editorialDescription: string;
  technicalDescription: string;
  price: number;
  currency: "PLN";
  status: ProductStatus;
  isVisible: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  dropId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  size: string;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  isAvailable: boolean;
  priceOverride?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceAtTime: number;
  createdAt: string;
  updatedAt: string;
};

export type Cart = {
  id: string;
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  deliveryCost: number;
  discount: number;
  total: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryReservation = {
  id: string;
  cartId: string | null;
  orderId: string | null;
  variantId: string;
  quantity: number;
  status: "active" | "released" | "committed";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type ShippingAddress = {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  country: "PL";
};

export type InvoiceData = {
  wantsInvoice: boolean;
  companyName?: string;
  nip?: string;
  companyAddress?: string;
};

export type ConsentLog = {
  termsAcceptedAt: string;
  privacyAcceptedAt: string;
  newsletterConsentAt: string | null;
  marketingConsentAt: string | null;
  legalDocumentVersion: string;
};

export type Delivery = {
  deliveryMethod: DeliveryMethod;
  parcelLockerId: string | null;
  parcelLockerAddress: string | null;
  deliveryPrice: number;
  trackingNumber: string | null;
  labelUrl: string | null;
  deliveryStatus: DeliveryStatus;
};

export type OrderItemSnapshot = {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  slug: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: "PLN";
};

export type Order = {
  id: string;
  orderNumber: string;
  customer: CustomerData;
  shippingAddress: ShippingAddress;
  invoice: InvoiceData;
  delivery: Delivery;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryCost: number;
  discount: number;
  total: number;
  currency: "PLN";
  provider: PaymentProvider;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  orderStatus: OrderStatus;
  trackingNumber: string | null;
  consentLog: ConsentLog;
  reservationIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type PaymentTransaction = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  paymentMethod: "blik" | "fast_transfer" | "card" | "apple_pay" | "google_pay" | "unknown";
  paymentUrl: string | null;
  providerTransactionId: string | null;
  providerPaymentId: string | null;
  providerCustomerId: string | null;
  status: PaymentStatus;
  amount: number;
  currency: "PLN";
  rawProviderPayload?: Record<string, unknown> | null;
  rawEventIds: string[];
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  customerEmail: string;
  selectedItems: { orderItemId?: string; productId: string; variantId: string; quantity: number }[];
  reason?: string;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
};

export type Complaint = {
  id: string;
  orderId: string;
  customerEmail: string;
  productId: string;
  description: string;
  imageUrls: string[];
  preferredSolution: ComplaintSolution;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  consent: boolean;
  consentTimestamp: string;
  source: string;
  status: NewsletterStatus;
  earlyAccess: boolean;
  tags: string[];
  confirmationToken?: string;
  createdAt: string;
  updatedAt: string;
};

export type DiscountCode = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  minimumOrderValue: number | null;
  appliesToProductIds: string[];
  appliesToDropId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettings = {
  storeName: string;
  contactEmail: string;
  supportEmail: string;
  sellerName: string;
  sellerAddress: string;
  nip: string;
  regon: string;
  returnAddress: string;
  defaultCurrency: "PLN";
  defaultCountry: "PL";
  freeShippingThreshold: number;
  defaultDeliveryPrice: number;
  shopEnabled: boolean;
  maintenanceMode: boolean;
  shopMode: ShopMode;
  legalDocumentVersion: string;
  updatedAt: string;
};

export type LegalSubmission = {
  id: string;
  type: "withdrawal" | "complaint";
  orderId: string;
  customerEmail: string;
  payload: Record<string, unknown>;
  documentVersion: string;
  createdAt: string;
};

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  sessionId: string | null;
  customerEmail?: string | null;
  orderId?: string | null;
  productId?: string | null;
  data: Record<string, unknown>;
  createdAt: string;
};

export type StoreDatabase = {
  products: Product[];
  variants: ProductVariant[];
  images: ProductImage[];
  categories: ProductCategory[];
  drops: Drop[];
  carts: Cart[];
  reservations: InventoryReservation[];
  orders: Order[];
  payments: PaymentTransaction[];
  returns: ReturnRequest[];
  complaints: Complaint[];
  newsletterSubscribers: NewsletterSubscriber[];
  discounts: DiscountCode[];
  settings: StoreSettings;
  legalSubmissions: LegalSubmission[];
  analyticsEvents: AnalyticsEvent[];
  processedWebhookEvents: string[];
};
