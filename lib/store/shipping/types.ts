import type { Order } from "@/lib/store/types";

export type ShippingProviderId =
  | "manual"
  | "inpost"
  | "dpd"
  | "dhl"
  | "gls"
  | "ups"
  | "pocztex"
  | "orlen_paczka"
  | "other";

export type ShipmentStatus =
  | "draft"
  | "created"
  | "label_created"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "failed";

export type ShipmentRecord = {
  id: string;
  orderId: string;
  provider: ShippingProviderId;
  providerShipmentId: string | null;
  providerTrackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  labelBlobPath: string | null;
  labelFormat: string | null;
  status: ShipmentStatus;
  serviceCode: string | null;
  deliveryMethodId: string | null;
  parcelLockerId: string | null;
  parcelLockerName: string | null;
  parcelLockerAddress: string | null;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientStreet: string | null;
  recipientBuilding: string | null;
  recipientApartment: string | null;
  recipientPostalCode: string | null;
  recipientCity: string | null;
  recipientCountry: string | null;
  senderAddress: Record<string, unknown> | null;
  providerRequestSummary: Record<string, unknown> | null;
  providerErrorSummary: string | null;
  createdAt: string;
  updatedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
};

export type ParcelLockerSearchResult = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type ShippingConfigStatus = {
  provider: ShippingProviderId;
  configured: boolean;
  enabled: boolean;
  environment: "sandbox" | "production" | "manual" | "placeholder";
  testMode: boolean;
  apiTokenPresent: boolean;
  organizationIdPresent: boolean;
  defaultSenderIdPresent?: boolean;
  defaultService: string | null;
  labelFormat: "pdf" | "zpl";
  missing: string[];
  warnings: string[];
};

export type ShipmentOperationResult = {
  status: ShipmentStatus;
  providerShipmentId?: string | null;
  providerTrackingNumber?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  labelFormat?: string | null;
  serviceCode?: string | null;
  providerRequestSummary?: Record<string, unknown> | null;
  providerErrorSummary?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
};

export type ShippingProvider = {
  id: ShippingProviderId;
  displayName: string;
  supportsParcelLockers: boolean;
  supportsCourier: boolean;
  supportsLabels: boolean;
  supportsCancellation: boolean;
  validateConfig: () => ShippingConfigStatus;
  getPublicConfigStatus: () => ShippingConfigStatus;
  createShipment: (input: { order: Order; shipment?: ShipmentRecord | null }) => Promise<ShipmentOperationResult>;
  getShipment: (input: { order: Order; shipment?: ShipmentRecord | null }) => Promise<ShipmentOperationResult>;
  getTracking: (input: { order: Order; shipment?: ShipmentRecord | null }) => Promise<ShipmentOperationResult>;
  createLabel: (input: { order: Order; shipment?: ShipmentRecord | null }) => Promise<ShipmentOperationResult>;
  cancelShipment: (input: { order: Order; shipment?: ShipmentRecord | null }) => Promise<ShipmentOperationResult>;
  findParcelLockers?: (query: string) => Promise<ParcelLockerSearchResult[]>;
};
