import type { Order } from "@/lib/store/types";
import { getShippingTrackingUrl, safeJson, sanitizeProviderError } from "../tracking";
import type {
  ParcelLockerSearchResult,
  ShipmentOperationResult,
  ShipmentRecord,
  ShippingConfigStatus,
  ShippingProvider,
} from "../types";

const sandboxBaseUrl = "https://sandbox-api-shipx-pl.easypack24.net";
const productionBaseUrl = "https://api-shipx-pl.easypack24.net";
const pointsSandboxBaseUrl = "https://sandbox-api-gateway-pl.easypack24.net";
const pointsProductionBaseUrl = "https://api-shipx-pl.easypack24.net";

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function getInPostConfig() {
  const environment: "sandbox" | "production" =
    env("INPOST_ENV") === "production" ? "production" : "sandbox";
  const testMode =
    env("INPOST_TEST_MODE") === "true" ||
    environment === "sandbox" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV !== "production";
  const apiToken = env("INPOST_API_TOKEN");
  const organizationId = env("INPOST_ORGANIZATION_ID");
  const defaultSenderId = env("INPOST_DEFAULT_SENDER_ID");
  const defaultService =
    env("INPOST_DEFAULT_SERVICE") ||
    (environment === "production" ? "inpost_locker_standard" : "inpost_locker_standard");
  const labelFormat: "pdf" | "zpl" =
    env("INPOST_LABEL_FORMAT") === "zpl" ? "zpl" : "pdf";
  const baseUrl = environment === "production" ? productionBaseUrl : sandboxBaseUrl;
  const pointsBaseUrl =
    environment === "production" ? pointsProductionBaseUrl : pointsSandboxBaseUrl;

  return {
    environment,
    testMode,
    apiToken,
    organizationId,
    defaultSenderId,
    defaultService,
    labelFormat,
    baseUrl,
    pointsBaseUrl,
  };
}

export function getInPostPublicConfigStatus(): ShippingConfigStatus {
  const config = getInPostConfig();
  const missing = [
    !config.apiToken ? "INPOST_API_TOKEN" : null,
    !config.organizationId ? "INPOST_ORGANIZATION_ID" : null,
  ].filter((item): item is string => Boolean(item));
  const warnings: string[] = [];

  if (config.environment === "production" && process.env.VERCEL_ENV === "preview") {
    warnings.push("Production InPost mode is forbidden from Vercel Preview.");
  }

  if (config.environment === "production" && config.testMode) {
    warnings.push("INPOST_TEST_MODE=true while INPOST_ENV=production.");
  }

  return {
    provider: "inpost",
    configured: missing.length === 0,
    enabled:
      missing.length === 0 &&
      !(config.environment === "production" && process.env.VERCEL_ENV === "preview"),
    environment: config.environment,
    testMode: config.testMode,
    apiTokenPresent: Boolean(config.apiToken),
    organizationIdPresent: Boolean(config.organizationId),
    defaultSenderIdPresent: Boolean(config.defaultSenderId),
    defaultService: config.defaultService,
    labelFormat: config.labelFormat,
    missing,
    warnings,
  };
}

function assertInPostConfigured() {
  const status = getInPostPublicConfigStatus();

  if (!status.configured) {
    throw new Error(`InPost is not configured. Missing: ${status.missing.join(", ")}.`);
  }

  if (status.environment === "production" && process.env.VERCEL_ENV === "preview") {
    throw new Error("Refusing to create production InPost shipments from Preview.");
  }

  return getInPostConfig();
}

function splitStreet(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  const match = text.match(/^(.*?)(?:\s+(\d+[A-Za-z]?(?:[/-]\d+[A-Za-z]?)?))?$/);

  return {
    street: match?.[1]?.trim() || text || null,
    buildingNumber: match?.[2]?.trim() || null,
  };
}

function requireLockerOrder(order: Order) {
  if (order.delivery.deliveryMethod !== "inpost_locker") {
    throw new Error("InPost Paczkomat shipment requires the InPost locker delivery method.");
  }

  if (!order.customer.email.trim()) {
    throw new Error("Recipient email is required for InPost shipment creation.");
  }

  if (!order.customer.phone.trim()) {
    throw new Error("Recipient phone is required for InPost shipment creation.");
  }

  if (!order.delivery.parcelLockerId?.trim()) {
    throw new Error("Parcel locker ID is required before creating an InPost locker shipment.");
  }
}

function requireCourierOrder(order: Order) {
  if (!order.customer.email.trim()) {
    throw new Error("Recipient email is required for InPost courier shipment creation.");
  }

  if (!order.customer.phone.trim()) {
    throw new Error("Recipient phone is required for InPost courier shipment creation.");
  }

  if (
    !order.shippingAddress.addressLine1.trim() ||
    !order.shippingAddress.postalCode.trim() ||
    !order.shippingAddress.city.trim()
  ) {
    throw new Error("Recipient street, postal code and city are required for InPost courier shipment creation.");
  }
}

function assertOrderCanShip(order: Order) {
  if (order.orderStatus === "cancelled") {
    throw new Error("Cancelled orders cannot receive API shipments.");
  }

  if (order.fulfillmentStatus === "returned") {
    throw new Error("Returned orders cannot receive API shipments.");
  }

  if (order.fulfillmentStatus === "shipped" || order.fulfillmentStatus === "delivered") {
    throw new Error("Order is already shipped or delivered.");
  }

  if (order.delivery.deliveryStatus === "returned") {
    throw new Error("Returned deliveries cannot receive API shipments.");
  }
}

function createShipmentRequestBody(order: Order) {
  const isLocker = order.delivery.deliveryMethod === "inpost_locker";
  const address = splitStreet(order.shippingAddress.addressLine1);
  const config = getInPostConfig();

  if (isLocker) {
    requireLockerOrder(order);
  } else {
    requireCourierOrder(order);
  }

  return {
    receiver: {
      first_name: order.customer.firstName,
      last_name: order.customer.lastName,
      email: order.customer.email,
      phone: order.customer.phone,
      ...(isLocker
        ? {}
        : {
            address: {
              street: address.street,
              building_number: address.buildingNumber ?? "1",
              city: order.shippingAddress.city,
              post_code: order.shippingAddress.postalCode,
              country_code: order.shippingAddress.country,
            },
          }),
    },
    parcels: [
      {
        template: "medium",
      },
    ],
    service: isLocker ? config.defaultService : "inpost_courier_standard",
    reference: order.orderNumber,
    custom_attributes: isLocker
      ? {
          target_point: order.delivery.parcelLockerId,
        }
      : undefined,
    external_customer_id: order.id,
  };
}

async function inpostFetch(path: string, init: RequestInit = {}) {
  const config = assertInPostConfigured();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    throw new Error(
      `InPost API ${response.status}: ${sanitizeProviderError(safeJson(payload))}`,
    );
  }

  return payload;
}

function normalizeInPostShipment(payload: unknown): ShipmentOperationResult {
  const data =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  const trackingNumber =
    typeof data.tracking_number === "string"
      ? data.tracking_number
      : typeof data.trackingNumber === "string"
        ? data.trackingNumber
        : null;
  const providerShipmentId =
    typeof data.id === "string" || typeof data.id === "number"
      ? String(data.id)
      : null;
  const status =
    typeof data.status === "string" && data.status.includes("delivered")
      ? "delivered"
      : typeof data.status === "string" && data.status.includes("cancel")
        ? "cancelled"
        : trackingNumber
          ? "created"
          : "created";

  return {
    status,
    providerShipmentId,
    providerTrackingNumber: trackingNumber,
    trackingUrl: getShippingTrackingUrl({
      provider: "inpost",
      trackingNumber,
    }),
    providerRequestSummary: {
      inpostStatus: data.status ?? null,
      service: data.service ?? null,
    },
  };
}

function mapInPostStatus(value: unknown): ShipmentOperationResult["status"] {
  const status = typeof value === "string" ? value.toLowerCase() : "";

  if (status.includes("delivered")) return "delivered";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("label")) return "label_created";
  if (status.includes("dispatch") || status.includes("transit")) return "in_transit";
  if (status.includes("created") || status.includes("confirmed")) return "created";
  if (status.includes("error") || status.includes("reject")) return "failed";

  return "created";
}

function requireProviderShipmentId(shipment?: ShipmentRecord | null) {
  const id = shipment?.providerShipmentId?.trim();

  if (!id) {
    throw new Error("Provider shipment ID is required for this InPost action.");
  }

  return id;
}

function normalizePoint(value: unknown): ParcelLockerSearchResult | null {
  if (!value || typeof value !== "object") return null;
  const point = value as Record<string, unknown>;
  const name = typeof point.name === "string" ? point.name : "";
  const address = point.address as Record<string, unknown> | undefined;
  const details = point.address_details as Record<string, unknown> | undefined;
  const location = point.location as Record<string, unknown> | undefined;

  if (!name) return null;

  return {
    id: name,
    name:
      typeof point.display_name === "string" && point.display_name.trim()
        ? point.display_name
        : name,
    address: [address?.line1, address?.line2].filter(Boolean).join(", ") || name,
    city: typeof details?.city === "string" ? details.city : null,
    postalCode: typeof details?.post_code === "string" ? details.post_code : null,
    latitude:
      typeof location?.latitude === "number" ? location.latitude : Number(location?.latitude) || null,
    longitude:
      typeof location?.longitude === "number" ? location.longitude : Number(location?.longitude) || null,
  };
}

export function inpostProvider(): ShippingProvider {
  return {
    id: "inpost",
    displayName: "InPost ShipX",
    supportsParcelLockers: true,
    supportsCourier: true,
    supportsLabels: true,
    supportsCancellation: true,
    validateConfig: getInPostPublicConfigStatus,
    getPublicConfigStatus: getInPostPublicConfigStatus,
    async createShipment({ order, shipment }) {
      assertOrderCanShip(order);

      if (shipment && shipment.providerShipmentId) {
        throw new Error("This order already has an InPost shipment.");
      }

      const config = assertInPostConfigured();
      const body = createShipmentRequestBody(order);
      const payload = await inpostFetch(
        `/v1/organizations/${encodeURIComponent(config.organizationId)}/shipments`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      return {
        ...normalizeInPostShipment(payload),
        serviceCode: String(body.service ?? config.defaultService),
        providerRequestSummary: {
          service: body.service,
          deliveryMethod: order.delivery.deliveryMethod,
          targetPoint: order.delivery.parcelLockerId ?? null,
        },
      };
    },
    async getShipment({ shipment }) {
      const id = requireProviderShipmentId(shipment);
      const payload = await inpostFetch(`/v1/shipments/${encodeURIComponent(id)}`);

      return normalizeInPostShipment(payload);
    },
    async getTracking({ shipment }) {
      const id = requireProviderShipmentId(shipment);
      const payload = await inpostFetch(`/v1/shipments/${encodeURIComponent(id)}`);
      const data =
        typeof payload === "object" && payload !== null
          ? (payload as Record<string, unknown>)
          : {};
      const trackingNumber =
        typeof data.tracking_number === "string"
          ? data.tracking_number
          : shipment?.providerTrackingNumber ?? null;
      const status = mapInPostStatus(data.status);

      return {
        status,
        providerShipmentId: id,
        providerTrackingNumber: trackingNumber,
        trackingUrl: getShippingTrackingUrl({
          provider: "inpost",
          trackingNumber,
        }),
        deliveredAt: status === "delivered" ? new Date().toISOString() : null,
        providerRequestSummary: {
          inpostStatus: data.status ?? null,
        },
      };
    },
    async createLabel({ shipment }) {
      const id = requireProviderShipmentId(shipment);
      const config = assertInPostConfigured();
      const payload = await inpostFetch(
        `/v1/organizations/${encodeURIComponent(config.organizationId)}/shipments/${encodeURIComponent(id)}/label?format=${config.labelFormat}`,
      );
      const labelUrl =
        typeof payload === "object" &&
        payload !== null &&
        typeof (payload as Record<string, unknown>).url === "string"
          ? String((payload as Record<string, unknown>).url)
          : null;

      return {
        status: "label_created",
        providerShipmentId: id,
        labelUrl,
        labelFormat: config.labelFormat,
        providerRequestSummary: {
          labelFormat: config.labelFormat,
          labelUrlPresent: Boolean(labelUrl),
        },
      };
    },
    async cancelShipment({ shipment }) {
      if (shipment?.status === "delivered") {
        throw new Error("Delivered shipments cannot be cancelled.");
      }

      const id = requireProviderShipmentId(shipment);
      const payload = await inpostFetch(`/v1/shipments/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      return {
        status: "cancelled",
        providerShipmentId: id,
        cancelledAt: new Date().toISOString(),
        providerRequestSummary: safeJson(payload) as Record<string, unknown>,
      };
    },
    async findParcelLockers(query) {
      const trimmed = query.trim();

      if (trimmed.length < 2) {
        return [];
      }

      const config = getInPostConfig();
      const url = new URL("/v1/points", config.pointsBaseUrl);
      url.searchParams.set("type", "parcel_locker");
      url.searchParams.set("status", "Operating");
      url.searchParams.set("per_page", "10");
      url.searchParams.set("query", trimmed);

      const response = await fetch(url.toString(), {
        headers: config.apiToken
          ? {
              Authorization: `Bearer ${config.apiToken}`,
              Accept: "application/json",
            }
          : { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          `InPost parcel locker search failed: ${sanitizeProviderError(safeJson(payload))}`,
        );
      }

      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.items)
          ? payload.items
          : [];

      return items
        .map((item: unknown) => normalizePoint(item))
        .filter(
          (item: ParcelLockerSearchResult | null): item is ParcelLockerSearchResult =>
            Boolean(item),
        );
    },
  };
}
