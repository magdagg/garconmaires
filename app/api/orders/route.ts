import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedStoreAdmin } from "@/lib/store/admin";
import { readStoreDatabase } from "@/lib/store/storage";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAuthorizedStoreAdmin(request)) {
    return NextResponse.json(
      { error: "Unauthorized order admin request." },
      { status: 401 },
    );
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
  const database = await readStoreDatabase();
  const orders = database.orders.slice(0, Number.isFinite(limit) ? limit : 50);

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      number: order.orderNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      currency: order.currency,
      subtotalAmount: order.subtotal,
      shippingAmount: order.deliveryCost,
      totalAmount: order.total,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      orderStatus: order.orderStatus,
      customerEmail: order.customer.email,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      lineItemCount: order.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
    })),
  });
}
