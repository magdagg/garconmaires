import { NextRequest, NextResponse } from "next/server";
import { sendStoreEmail } from "@/lib/store/email";
import { createReturnRequest, validateReturnItemsForOrder } from "@/lib/store/operations";
import { findOrderForCustomerRequest } from "@/lib/store/orders";
import { updateStoreDatabase } from "@/lib/store/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    orderId?: string;
    orderNumber?: string;
    customerEmail?: string;
    selectedItems?: { productId: string; variantId: string; quantity: number }[];
    reason?: string;
  };

  try {
    const returnRequest = await updateStoreDatabase((database) => {
      const order = findOrderForCustomerRequest(database, {
        orderId: body.orderId,
        orderNumber: body.orderNumber,
        customerEmail: body.customerEmail,
      });

      if (!order) {
        throw new Error("Nie znaleziono zamówienia dla podanego adresu e-mail.");
      }

      const selectedItems = Array.isArray(body.selectedItems)
        ? body.selectedItems
        : [];
      if (!validateReturnItemsForOrder(order, selectedItems)) {
        throw new Error("Wybrane produkty nie pasują do tego zamówienia.");
      }

      return createReturnRequest(database, {
        orderId: order.id,
        customerEmail: order.customer.email,
        selectedItems,
        reason: body.reason,
      });
    });

    await sendStoreEmail("return_requested", { returnRequest });

    return NextResponse.json({ returnRequest });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się przyjąć zgłoszenia zwrotu.",
      },
      { status: 400 },
    );
  }
}
