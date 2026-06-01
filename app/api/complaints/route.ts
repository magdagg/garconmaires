import { NextRequest, NextResponse } from "next/server";
import { sendStoreEmail } from "@/lib/store/email";
import { createComplaint, validateComplaintProductForOrder } from "@/lib/store/operations";
import { findOrderForCustomerRequest } from "@/lib/store/orders";
import { updateStoreDatabase } from "@/lib/store/storage";
import type { ComplaintSolution } from "@/lib/store/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    orderId?: string;
    orderNumber?: string;
    customerEmail?: string;
    productId?: string;
    variantId?: string;
    description?: string;
    imageUrls?: string[];
    preferredSolution?: ComplaintSolution;
  };

  try {
    const complaint = await updateStoreDatabase((database) => {
      const order = findOrderForCustomerRequest(database, {
        orderId: body.orderId,
        orderNumber: body.orderNumber,
        customerEmail: body.customerEmail,
      });

      if (!order) {
        throw new Error("Nie znaleziono zamówienia dla podanego adresu e-mail.");
      }

      const productId = String(body.productId ?? "");
      const variantId = body.variantId ? String(body.variantId) : null;
      if (!validateComplaintProductForOrder(order, { productId, variantId })) {
        throw new Error("Ten produkt nie należy do wskazanego zamówienia.");
      }

      if (!body.description || body.description.trim().length < 10) {
        throw new Error("Opis reklamacji jest wymagany.");
      }

      return createComplaint(database, {
        orderId: order.id,
        customerEmail: order.customer.email,
        productId,
        description: body.description,
        imageUrls: body.imageUrls,
        preferredSolution: body.preferredSolution ?? "refund",
      });
    });

    await sendStoreEmail("complaint_submitted", { complaint });

    return NextResponse.json({ complaint });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się przyjąć zgłoszenia reklamacji.",
      },
      { status: 400 },
    );
  }
}
