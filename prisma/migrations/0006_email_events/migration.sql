CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailEvent_orderId_idx" ON "EmailEvent"("orderId");
CREATE INDEX "EmailEvent_template_idx" ON "EmailEvent"("template");
CREATE INDEX "EmailEvent_recipientEmail_idx" ON "EmailEvent"("recipientEmail");

ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
