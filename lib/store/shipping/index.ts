import { getPrisma } from "@/lib/prisma";
import { createId } from "@/lib/store/ids";
import type { Order } from "@/lib/store/types";
import { manualProvider } from "./providers/manual";
import { inpostProvider } from "./providers/inpost";
import { getShippingTrackingUrl, sanitizeProviderError, safeJson } from "./tracking";
import type {
  ShipmentOperationResult,
  ShipmentRecord,
  ShipmentStatus,
  ShippingConfigStatus,
  ShippingProvider,
  ShippingProviderId,
} from "./types";

export type { ParcelLockerSearchResult, ShipmentRecord, ShippingConfigStatus } from "./types";
export { getShippingTrackingUrl } from "./tracking";
export { getInPostPublicConfigStatus } from "./providers/inpost";

const providers: Record<"manual" | "inpost", () => ShippingProvider> = {
  manual: manualProvider,
  inpost: inpostProvider,
};

export function getShippingProvider(id: string | null | undefined) {
  if (id === "inpost") {
    return providers.inpost();
  }

  return providers.manual();
}

export function getShippingProviderDiagnostics(): ShippingConfigStatus[] {
  return [providers.manual().getPublicConfigStatus(), providers.inpost().getPublicConfigStatus()];
}

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function mapShipmentRecord(item: {
  id: string;
  orderId: string;
  provider: string;
  providerShipmentId: string | null;
  providerTrackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  labelBlobPath: string | null;
  labelFormat: string | null;
  status: string;
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
  senderAddress: unknown;
  providerRequestSummary: unknown;
  providerErrorSummary: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  shippedAt: Date | string | null;
  deliveredAt: Date | string | null;
  cancelledAt: Date | string | null;
}): ShipmentRecord {
  return {
    ...item,
    provider: item.provider as ShippingProviderId,
    status: item.status as ShipmentStatus,
    senderAddress:
      item.senderAddress && typeof item.senderAddress === "object"
        ? (item.senderAddress as Record<string, unknown>)
        : null,
    providerRequestSummary:
      item.providerRequestSummary && typeof item.providerRequestSummary === "object"
        ? (item.providerRequestSummary as Record<string, unknown>)
        : null,
    createdAt: iso(item.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(item.updatedAt) ?? new Date().toISOString(),
    shippedAt: iso(item.shippedAt),
    deliveredAt: iso(item.deliveredAt),
    cancelledAt: iso(item.cancelledAt),
  };
}

export async function shipmentTableExists() {
  const prisma = getPrisma();
  const result = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT to_regclass('public."Shipment"') IS NOT NULL AS "exists"
  `;

  return Boolean(result[0]?.exists);
}

export async function readOrderShipments(orderId: string) {
  if (!(await shipmentTableExists())) {
    return [];
  }

  const prisma = getPrisma();
  const shipments = await prisma.shipment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  return shipments.map(mapShipmentRecord);
}

function latestProviderShipment(shipments: ShipmentRecord[], provider: ShippingProviderId) {
  return shipments.find(
    (shipment) =>
      shipment.provider === provider &&
      shipment.status !== "cancelled" &&
      shipment.status !== "failed",
  );
}

function recipientFromOrder(order: Order) {
  const [street, building] = order.shippingAddress.addressLine1.split(/\s+(?=\d)/);

  return {
    recipientName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
    recipientEmail: order.customer.email,
    recipientPhone: order.customer.phone,
    recipientStreet: street || order.shippingAddress.addressLine1 || null,
    recipientBuilding: building || null,
    recipientApartment: order.shippingAddress.addressLine2 ?? null,
    recipientPostalCode: order.shippingAddress.postalCode,
    recipientCity: order.shippingAddress.city,
    recipientCountry: order.shippingAddress.country,
  };
}

function shipmentBaseData(order: Order, provider: ShippingProviderId) {
  return {
    orderId: order.id,
    provider,
    deliveryMethodId: order.delivery.deliveryMethod,
    parcelLockerId: order.delivery.parcelLockerId,
    parcelLockerName: order.delivery.parcelLockerName,
    parcelLockerAddress: order.delivery.parcelLockerAddress,
    ...recipientFromOrder(order),
  };
}

function resultToUpdate(result: ShipmentOperationResult) {
  return {
    status: result.status,
    providerShipmentId: result.providerShipmentId ?? undefined,
    providerTrackingNumber: result.providerTrackingNumber ?? undefined,
    trackingUrl: result.trackingUrl ?? undefined,
    labelUrl: result.labelUrl ?? undefined,
    labelFormat: result.labelFormat ?? undefined,
    serviceCode: result.serviceCode ?? undefined,
    providerRequestSummary: result.providerRequestSummary
      ? (safeJson(result.providerRequestSummary) as never)
      : undefined,
    providerErrorSummary: result.providerErrorSummary ?? null,
    shippedAt: result.shippedAt ? new Date(result.shippedAt) : undefined,
    deliveredAt: result.deliveredAt ? new Date(result.deliveredAt) : undefined,
    cancelledAt: result.cancelledAt ? new Date(result.cancelledAt) : undefined,
  };
}

export async function createOrderShipment(order: Order, providerId?: string) {
  const provider = getShippingProvider(providerId ?? order.delivery.shipmentProvider);
  const shipments = await readOrderShipments(order.id);
  const existing = latestProviderShipment(shipments, provider.id);

  if (existing?.providerShipmentId && provider.id !== "manual") {
    throw new Error("A provider shipment already exists for this order.");
  }

  const result = await provider.createShipment({ order, shipment: existing ?? null });
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const shipment = existing
      ? await tx.shipment.update({
          where: { id: existing.id },
          data: {
            ...shipmentBaseData(order, provider.id),
            ...resultToUpdate(result),
          },
        })
      : await tx.shipment.create({
          data: {
            id: createId("shp"),
            ...shipmentBaseData(order, provider.id),
            ...resultToUpdate(result),
          },
        });

    await tx.delivery.update({
      where: { orderId: order.id },
      data: {
        shipmentProvider: provider.id,
        trackingNumber: shipment.providerTrackingNumber,
        trackingUrl:
          shipment.trackingUrl ??
          getShippingTrackingUrl({
            provider: provider.id,
            trackingNumber: shipment.providerTrackingNumber,
          }),
        labelUrl: shipment.labelUrl,
        deliveryStatus: shipment.status === "label_created" ? "label_created" : "pending",
      },
    });

    return mapShipmentRecord(shipment);
  });
}

export async function generateShipmentLabel(order: Order, shipmentId?: string) {
  const shipments = await readOrderShipments(order.id);
  const shipment =
    shipments.find((item) => item.id === shipmentId) ?? shipments[0] ?? null;

  if (!shipment) {
    throw new Error("Create a shipment before generating a label.");
  }

  const provider = getShippingProvider(shipment.provider);
  const result = await provider.createLabel({ order, shipment });
  const prisma = getPrisma();
  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: resultToUpdate(result),
  });

  await prisma.delivery.update({
    where: { orderId: order.id },
    data: {
      labelUrl: updated.labelUrl,
      trackingNumber: updated.providerTrackingNumber,
      trackingUrl: updated.trackingUrl,
      deliveryStatus: "label_created",
    },
  });

  return mapShipmentRecord(updated);
}

export async function refreshShipmentTracking(order: Order, shipmentId?: string) {
  const shipments = await readOrderShipments(order.id);
  const shipment =
    shipments.find((item) => item.id === shipmentId) ?? shipments[0] ?? null;

  if (!shipment) {
    throw new Error("Create a shipment before refreshing tracking.");
  }

  const provider = getShippingProvider(shipment.provider);
  const prisma = getPrisma();

  try {
    const result = await provider.getTracking({ order, shipment });
    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: resultToUpdate(result),
    });
    const deliveryStatus =
      result.status === "delivered"
        ? "delivered"
        : result.status === "in_transit"
          ? "shipped"
          : result.status === "label_created"
            ? "label_created"
            : undefined;

    await prisma.delivery.update({
      where: { orderId: order.id },
      data: {
        trackingNumber: updated.providerTrackingNumber,
        trackingUrl: updated.trackingUrl,
        ...(deliveryStatus ? { deliveryStatus } : {}),
        ...(result.status === "delivered" ? { shippedAt: updated.shippedAt ?? new Date() } : {}),
      },
    });

    if (result.status === "delivered") {
      await prisma.order.update({
        where: { id: order.id },
        data: { fulfillmentStatus: "delivered", orderStatus: "completed" },
      });
    }

    return mapShipmentRecord(updated);
  } catch (error) {
    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        providerErrorSummary: sanitizeProviderError(error),
        status: "failed",
      },
    });

    return mapShipmentRecord(updated);
  }
}

export async function cancelOrderShipment(order: Order, shipmentId?: string) {
  const shipments = await readOrderShipments(order.id);
  const shipment =
    shipments.find((item) => item.id === shipmentId) ?? shipments[0] ?? null;

  if (!shipment) {
    throw new Error("Create a shipment before cancelling it.");
  }

  if (shipment.status === "delivered") {
    throw new Error("Delivered shipments cannot be cancelled.");
  }

  const provider = getShippingProvider(shipment.provider);
  const result = await provider.cancelShipment({ order, shipment });
  const prisma = getPrisma();
  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: resultToUpdate(result),
  });

  await prisma.delivery.update({
    where: { orderId: order.id },
    data: { deliveryStatus: "pending" },
  });

  return mapShipmentRecord(updated);
}
