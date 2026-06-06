import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../postgres.ts", import.meta.url),
  "utf8",
);

function createCheckoutTransactionBody() {
  const start = source.indexOf("export async function createPostgresCheckout");
  const transactionStart = source.indexOf("return prisma.$transaction", start);
  const transactionEnd = source.indexOf("async function nextOrderNumber", transactionStart);

  if (start === -1 || transactionStart === -1 || transactionEnd === -1) {
    throw new Error("Could not locate createPostgresCheckout transaction body.");
  }

  return source.slice(transactionStart, transactionEnd);
}

describe("Postgres checkout transaction", () => {
  it("keeps non-critical work outside the interactive transaction", () => {
    const transactionBody = createCheckoutTransactionBody();

    expect(transactionBody).toContain("reserveVariantAtomically");
    expect(transactionBody).toContain("tx.order.create");
    expect(transactionBody).not.toContain("ensurePostgresDefaults");
    expect(transactionBody).not.toContain("cleanupExpiredPostgresReservations");
    expect(transactionBody).not.toContain("tx.analyticsEvent.create");
    expect(transactionBody).not.toContain("readOrderSnapshot");
    expect(transactionBody).not.toContain("createPayment");
  });

  it("uses a bounded timeout for the critical reservation/order transaction", () => {
    const transactionBody = createCheckoutTransactionBody();

    expect(transactionBody).toContain('isolationLevel: "Serializable"');
    expect(transactionBody).toContain("maxWait: 10000");
    expect(transactionBody).toContain("timeout: 15000");
  });
});
