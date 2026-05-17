import { NextRequest, NextResponse } from "next/server";
import {
  getCanonicalBaseUrl,
  resolveCheckoutItems,
  storeConfig,
  type CheckoutItemInput,
} from "@/lib/commerce";
import { copy, type Locale } from "@/lib/i18n";
import { getStripeServer } from "@/lib/stripe";

type CheckoutRequestBody = {
  items?: CheckoutItemInput[];
  locale?: Locale;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    const requestedItems = Array.isArray(body.items) ? body.items : [];
    const locale = body.locale === "en" ? "en" : "pl";
    const t = copy[locale].checkout;
    const items = resolveCheckoutItems(requestedItems);
    const localePrefix = locale === "en" ? "/en" : "";

    if (items.length === 0) {
      return NextResponse.json(
        { error: t.emptyError },
        { status: 400 },
      );
    }

    const stripe = getStripeServer();
    const baseUrl = getCanonicalBaseUrl(request.nextUrl.origin);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale,
      payment_method_types: ["card", "blik", "p24"],
      customer_creation: "always",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["PL"],
      },
      phone_number_collection: {
        enabled: true,
      },
      allow_promotion_codes: true,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: storeConfig.currency,
          unit_amount: item.product.price * 100,
          product_data: {
            name: `${item.product.name} / ${item.size}`,
            description: item.product.tagline,
            metadata: {
              productId: item.product.id,
              slug: item.product.slug,
              size: item.size,
            },
          },
        },
      })),
      success_url: `${baseUrl}${localePrefix}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${localePrefix}/cart?checkout=canceled`,
      metadata: {
        brand: "garconmaires",
        market: storeConfig.market,
        locale,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: t.sessionError },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Missing STRIPE_SECRET_KEY"
        ? copy.pl.checkout.configError
        : copy.pl.checkout.sessionError;

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
