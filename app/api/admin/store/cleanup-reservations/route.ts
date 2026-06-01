import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedStoreAdmin } from "@/lib/store/admin";
import { cleanupExpiredPostgresReservations } from "@/lib/store/postgres";
import { getConfiguredStoreStorageDriver, updateStoreDatabase } from "@/lib/store/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAuthorizedStoreAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (getConfiguredStoreStorageDriver() === "postgres") {
    const released = await cleanupExpiredPostgresReservations();
    return NextResponse.json({ released });
  }

  const released = await updateStoreDatabase((database) => {
    const now = Date.now();
    let count = 0;

    for (const reservation of database.reservations) {
      if (
        reservation.status !== "active" ||
        new Date(reservation.expiresAt).getTime() > now
      ) {
        continue;
      }

      const variant = database.variants.find(
        (item) => item.id === reservation.variantId,
      );

      if (variant) {
        variant.reservedQuantity = Math.max(
          0,
          variant.reservedQuantity - reservation.quantity,
        );
      }

      reservation.status = "released";
      reservation.updatedAt = new Date().toISOString();
      count += 1;
    }

    return count;
  });

  return NextResponse.json({ released });
}
