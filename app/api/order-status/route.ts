import { NextRequest, NextResponse } from "next/server";
import { readStoreDatabase } from "@/lib/store/storage";

export const runtime = "nodejs";

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalize(value).toLowerCase();
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    orderNumber?: string;
    customerEmail?: string;
  };
  const orderNumber = normalize(body.orderNumber);
  const customerEmail = normalizeEmail(body.customerEmail);

  if (!orderNumber || !customerEmail) {
    return NextResponse.json(
      { error: "Order number and e-mail are required." },
      { status: 400 },
    );
  }

  const database = await readStoreDatabase();
  const order =
    database.orders.find(
      (item) =>
        item.orderNumber.toLowerCase() === orderNumber.toLowerCase() &&
        item.customer.email.toLowerCase() === customerEmail,
    ) ?? null;

  if (!order) {
    return NextResponse.json(
      { error: "Order was not found for the provided e-mail." },
      { status: 404 },
    );
  }

  const payment = database.payments.find((item) => item.orderId === order.id) ?? null;
  const returns = database.returns.filter((item) => item.orderId === order.id);
  const complaints = database.complaints.filter((item) => item.orderId === order.id);

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      orderStatus: order.orderStatus,
      total: order.total,
      currency: order.currency,
      delivery: {
        method: order.delivery.deliveryMethod,
        status: order.delivery.deliveryStatus,
        trackingNumber: order.delivery.trackingNumber,
        trackingUrl: order.delivery.trackingUrl,
        parcelLockerName: order.delivery.parcelLockerName,
      },
      shippingAddress: {
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      },
      items: order.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        size: item.size,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      payment: payment
        ? {
            provider: payment.provider,
            status: payment.status,
            paidAt: payment.paidAt,
          }
        : null,
      returns: returns.map((item) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt,
      })),
      complaints: complaints.map((item) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt,
      })),
    },
  });
}
