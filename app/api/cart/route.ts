import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { addCartItem, findOrCreateCart, serializeCart, updateCartItemQuantity, validateCart } from "@/lib/store/cart";
import { createSessionId } from "@/lib/store/ids";
import { trackAnalyticsEvent } from "@/lib/store/operations";
import { updateStoreDatabase } from "@/lib/store/storage";

export const runtime = "nodejs";

async function getSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get("gm_cart_session")?.value ?? createSessionId();
}

function withSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set("gm_cart_session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}

export async function GET() {
  const sessionId = await getSessionId();
  const result = await updateStoreDatabase((database) => {
    const cart = findOrCreateCart(database, sessionId);
    const validation = validateCart(database, cart);

    return { cart: serializeCart(database, cart), validation };
  });

  return withSessionCookie(NextResponse.json(result), sessionId);
}

export async function POST(request: NextRequest) {
  const sessionId = await getSessionId();
  const body = (await request.json()) as {
    productId?: string;
    variantId?: string;
    size?: string;
    quantity?: number;
  };

  try {
    const result = await updateStoreDatabase((database) => {
      const cart = addCartItem(database, {
        sessionId,
        productId: String(body.productId ?? ""),
        variantId: body.variantId,
        size: body.size,
        quantity: Number(body.quantity ?? 1),
      });
      const validation = validateCart(database, cart);
      trackAnalyticsEvent(database, {
        name: "add_to_cart",
        sessionId,
        productId: body.productId,
        data: { variantId: body.variantId, size: body.size },
      });

      return { cart: serializeCart(database, cart), validation };
    });

    return withSessionCookie(NextResponse.json(result), sessionId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cart error." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const sessionId = await getSessionId();
  const body = (await request.json()) as { itemId?: string; quantity?: number };

  const result = await updateStoreDatabase((database) => {
    const cart = updateCartItemQuantity(
      database,
      sessionId,
      String(body.itemId ?? ""),
      Number(body.quantity ?? 0),
    );
    const validation = validateCart(database, cart);

    return { cart: serializeCart(database, cart), validation };
  });

  return withSessionCookie(NextResponse.json(result), sessionId);
}
