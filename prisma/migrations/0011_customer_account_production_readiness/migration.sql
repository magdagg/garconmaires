ALTER TYPE "CustomerAccountStatus" ADD VALUE IF NOT EXISTS 'pending_deletion';

CREATE TYPE "CustomerAccountTokenType" AS ENUM ('email_verification', 'password_reset');

ALTER TABLE "CustomerAccount"
ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletionRequestNote" TEXT;

CREATE TABLE IF NOT EXISTS "CustomerAccountToken" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerAccountTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAccountToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerAccountToken_tokenHash_key" ON "CustomerAccountToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "CustomerAccountToken_customerId_type_idx" ON "CustomerAccountToken"("customerId", "type");
CREATE INDEX IF NOT EXISTS "CustomerAccountToken_expiresAt_idx" ON "CustomerAccountToken"("expiresAt");

ALTER TABLE "CustomerAccountToken"
ADD CONSTRAINT "CustomerAccountToken_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "CustomerAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
