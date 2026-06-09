CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerShipmentId" TEXT,
    "providerTrackingNumber" TEXT,
    "trackingUrl" TEXT,
    "labelUrl" TEXT,
    "labelBlobPath" TEXT,
    "labelFormat" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "serviceCode" TEXT,
    "deliveryMethodId" TEXT,
    "parcelLockerId" TEXT,
    "parcelLockerName" TEXT,
    "parcelLockerAddress" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "recipientStreet" TEXT,
    "recipientBuilding" TEXT,
    "recipientApartment" TEXT,
    "recipientPostalCode" TEXT,
    "recipientCity" TEXT,
    "recipientCountry" TEXT DEFAULT 'PL',
    "senderAddress" JSONB,
    "providerRequestSummary" JSONB,
    "providerErrorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");
CREATE INDEX "Shipment_provider_idx" ON "Shipment"("provider");
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");
CREATE INDEX "Shipment_providerShipmentId_idx" ON "Shipment"("providerShipmentId");
CREATE INDEX "Shipment_providerTrackingNumber_idx" ON "Shipment"("providerTrackingNumber");

ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
