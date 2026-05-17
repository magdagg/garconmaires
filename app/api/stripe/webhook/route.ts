import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe webhook configuration." },
      { status: 400 },
    );
  }

  try {
    const payload = await request.text();
    const stripe = getStripeServer();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[stripe-webhook]", event.type, {
          id: session.id,
          email: session.customer_details?.email ?? null,
          amountTotal: session.amount_total ?? null,
          currency: session.currency ?? null,
        });
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook signature error.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
