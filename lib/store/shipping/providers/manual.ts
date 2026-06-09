import { getShippingTrackingUrl } from "../tracking";
import type { ShippingProvider } from "../types";

export function manualProvider(): ShippingProvider {
  return {
    id: "manual",
    displayName: "Manual fulfillment",
    supportsParcelLockers: false,
    supportsCourier: true,
    supportsLabels: false,
    supportsCancellation: true,
    validateConfig() {
      return {
        provider: "manual",
        configured: true,
        enabled: true,
        environment: "manual",
        testMode: true,
        apiTokenPresent: false,
        organizationIdPresent: false,
        defaultService: null,
        labelFormat: "pdf",
        missing: [],
        warnings: ["Manual fulfillment does not call an external shipping API."],
      };
    },
    getPublicConfigStatus() {
      return this.validateConfig();
    },
    async createShipment({ order }) {
      return {
        status: "created",
        providerTrackingNumber: order.delivery.trackingNumber,
        trackingUrl: getShippingTrackingUrl({
          provider: "manual",
          trackingNumber: order.delivery.trackingNumber,
        }),
        providerRequestSummary: {
          mode: "manual",
          deliveryMethod: order.delivery.deliveryMethod,
        },
      };
    },
    async getShipment({ shipment }) {
      return {
        status: shipment?.status ?? "created",
        providerShipmentId: shipment?.providerShipmentId ?? null,
        providerTrackingNumber: shipment?.providerTrackingNumber ?? null,
        trackingUrl: shipment?.trackingUrl ?? null,
      };
    },
    async getTracking({ order, shipment }) {
      const trackingNumber =
        shipment?.providerTrackingNumber ?? order.delivery.trackingNumber;

      return {
        status:
          shipment?.status ??
          (order.delivery.deliveryStatus === "delivered"
            ? "delivered"
            : order.delivery.deliveryStatus === "shipped"
              ? "in_transit"
              : "created"),
        providerTrackingNumber: trackingNumber,
        trackingUrl:
          shipment?.trackingUrl ??
          getShippingTrackingUrl({
            provider: "manual",
            trackingNumber,
          }),
      };
    },
    async createLabel() {
      throw new Error("Manual fulfillment does not support API label generation.");
    },
    async cancelShipment({ shipment }) {
      if (shipment?.status === "delivered") {
        throw new Error("Delivered shipments cannot be cancelled.");
      }

      return {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      };
    },
  };
}
