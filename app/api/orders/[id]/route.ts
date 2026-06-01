import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedStoreAdmin } from "@/lib/store/admin";
import { readStoreDatabase } from "@/lib/store/storage";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAuthorizedStoreAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized order admin request." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const database = await readStoreDatabase();
  const order =
    database.orders.find(
      (item) => item.id === id || item.orderNumber === id,
    ) ?? null;

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
