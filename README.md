## Garçonmaires

Garçonmaires is a Next.js 16 storefront deployed on Vercel.

## Development

```bash
npm install
npm run dev
```

The local app runs on [http://localhost:3003](http://localhost:3003).

## Environment Variables

Copy `.env.example` and configure:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3003
RESEND_API_KEY=
GOOGLE_SHEETS_NEWSLETTER_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
ORDER_ADMIN_TOKEN=
ORDER_EMAIL_FROM="Garçonmaires Studio <studio@garconmaires.com>"
ORDER_STUDIO_EMAIL=studio@garconmaires.com
BLOB_READ_WRITE_TOKEN=
PAYMENT_PROVIDER=tpay
TPAY_MERCHANT_ID=
TPAY_API_KEY=
TPAY_API_SECRET=
TPAY_WEBHOOK_SECRET=
TPAY_ENV=sandbox
P24_MERCHANT_ID=
P24_POS_ID=
P24_CRC=
P24_API_KEY=
P24_ENV=sandbox
PAYU_CLIENT_ID=
PAYU_CLIENT_SECRET=
PAYU_POS_ID=
PAYU_SECOND_KEY=
PAYU_ENV=sandbox
STORE_STORAGE=local-json
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/garconmaires
CHECKOUT_TEST_MODE=false
```

## Orders

Checkout creates an internal order before redirecting to the configured Polish
payment provider. Provider webhooks update payment and fulfillment status after
verified payment confirmation.

The current store backend uses a storage adapter in `lib/store/storage.ts`.

- `STORE_STORAGE=local-json` stores data in `data/store.json` and is for
  local development only.
- `STORE_STORAGE=vercel-blob` stores the whole store document in private
  Vercel Blob. This is useful for previews and low-risk staging, but it is not a
  replacement for a transactional database.
- `STORE_STORAGE=postgres` uses PostgreSQL through Prisma. This is the required
  production path for inventory, orders, payments, webhook idempotency and
  checkout reservations.

Do not use JSON file storage for production orders, payments or inventory.
In production, the app rejects any store storage except `postgres`.

## Database Setup

Local development can keep using `STORE_STORAGE=local-json` while the public
site stays pre-launch. To test the production storage adapter locally, run a
PostgreSQL database and set:

```env
STORE_STORAGE=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

Then run:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Production deployments must set `STORE_STORAGE=postgres`, `DATABASE_URL`,
`ORDER_ADMIN_TOKEN`, Polish payment provider keys and email settings in the
deployment secret manager. Use `npm run db:deploy` during deployment to apply
migrations.

The Prisma schema persists:

Product, ProductVariant, ProductImage, ProductCategory, Drop, Cart, CartItem,
InventoryReservation, Order, OrderItem, Payment, Delivery, ReturnRequest,
ReturnItem, Complaint, NewsletterSubscriber, DiscountCode, StoreSettings,
LegalConsent, legal submissions, AnalyticsEvent and PaymentWebhookEvent.

Admin API endpoints require `ORDER_ADMIN_TOKEN`. Generate a long random value
and store it only in local `.env.local` or the deployment secret manager:

```bash
curl -H "Authorization: Bearer $ORDER_ADMIN_TOKEN" \
  http://localhost:3003/api/orders
```

The broader store backend lives behind `/admin` and `/api/admin/store`.
Products and variants can exist as `draft` or `hidden`; the public site remains
pre-launch until `shopEnabled` and the relevant drop status are changed.

`CHECKOUT_TEST_MODE=true` allows checkout while the shop is disabled only when
the request also includes a valid admin token and `x-checkout-test-mode: true`.
Public customers cannot bypass `shopEnabled=false`.

## Polish Payment Providers

Set `PAYMENT_PROVIDER` to one of:

```env
PAYMENT_PROVIDER=tpay
PAYMENT_PROVIDER=przelewy24
PAYMENT_PROVIDER=payu
```

Default local example is `tpay`. Polish launch should use Tpay,
Przelewy24 or PayU, with BLIK and fast transfers enabled because they are
required for Polish checkout conversion.

Tpay is the first real production-oriented provider adapter. Przelewy24 and
PayU are still clean placeholders behind the same generic payment interface.
The generic webhook route is:

```text
/api/payments/webhook/[provider]
```

Each provider adapter declares its expected env variables:

- Tpay: `TPAY_MERCHANT_ID`, `TPAY_API_KEY`, `TPAY_API_SECRET`,
  `TPAY_WEBHOOK_SECRET`, `TPAY_ENV=sandbox|production`.
- Przelewy24: `P24_MERCHANT_ID`, `P24_POS_ID`, `P24_CRC`, `P24_API_KEY`,
  `P24_ENV=sandbox|production`.
- PayU: `PAYU_CLIENT_ID`, `PAYU_CLIENT_SECRET`, `PAYU_POS_ID`,
  `PAYU_SECOND_KEY`, `PAYU_ENV=sandbox|production`.

Webhook handlers must verify the provider signature/checksum before marking an
order as paid. Duplicate provider event IDs are stored in PostgreSQL and ignored.

### Tpay sandbox staging test

Use this runbook only for a Vercel Preview/Staging deployment or local
development. It is designed to test a hidden, admin-only sandbox product without
changing the homepage, the editorial/pre-launch frontend, or public product
exposure.

Set these exact Vercel environment variables on the preview/staging deployment:

```env
STORE_STORAGE=postgres
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
PAYMENT_PROVIDER=tpay
TPAY_ENV=sandbox
TPAY_MERCHANT_ID=your-sandbox-merchant-id
TPAY_API_KEY=your-sandbox-api-client-id
TPAY_API_SECRET=your-sandbox-api-secret
TPAY_WEBHOOK_SECRET=your-sandbox-webhook-secret
NEXT_PUBLIC_SITE_URL=https://STAGING_DOMAIN
ORDER_ADMIN_TOKEN=long-random-token
CHECKOUT_TEST_MODE=true
```

`CHECKOUT_TEST_MODE=true` is allowed only on staging/local. Never set it on
production. The public storefront must remain pre-launch: keep
`shopEnabled=false`, keep `shopMode=PRE_LAUNCH`, and do not expose products
publicly before launch.

Production safety must remain:

```env
CHECKOUT_TEST_MODE=false
```

Keep `shopEnabled=false` and `shopMode=PRE_LAUNCH` in production until launch.

Tpay sandbox calls use:

- OAuth token: `POST https://openapi.sandbox.tpay.com/oauth/auth`
- Transaction creation: `POST https://openapi.sandbox.tpay.com/transactions`
- Return URL: `${NEXT_PUBLIC_SITE_URL}/checkout/success?order_id=...`
- Notification URL: `${NEXT_PUBLIC_SITE_URL}/api/payments/webhook/tpay`

In the Tpay merchant panel, set the notification/webhook URL exactly to:

```text
https://STAGING_DOMAIN/api/payments/webhook/tpay
```

Do not use localhost as the Tpay webhook URL. Use the Vercel Preview/Staging
domain or a secure tunnel. `NEXT_PUBLIC_SITE_URL` must match that public
staging origin.

Prepare the database after the preview/staging deployment has the env vars:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:seed:tpay-sandbox
```

The Tpay sandbox seed creates one hidden active product:

- `productId`: `prod-tpay-sandbox-test`
- `variantId`: `var-tpay-sandbox-test-one-size`
- name: `Garçonmaires Test Product`
- price: `1.00 PLN`
- currency: `PLN`
- status: `active`
- `isVisible=false`
- variant size: `ONE SIZE`
- stock: `1`

It also keeps `shopEnabled=false`, `shopMode=PRE_LAUNCH` and sets delivery to
`0 PLN` for the low-value sandbox payment. Public pages still do not list this
product.

If testing locally, expose `http://localhost:3003` through a secure tunnel, set
`NEXT_PUBLIC_SITE_URL` to that tunnel origin, and configure this URL in the Tpay
sandbox dashboard:

```text
https://YOUR_TUNNEL_OR_STAGING_DOMAIN/api/payments/webhook/tpay
```

Staging test checklist:

- deploy preview/staging
- run database migrations
- run Tpay sandbox seed
- set Tpay webhook URL to `https://STAGING_DOMAIN/api/payments/webhook/tpay`
- start checkout with admin token
- complete Tpay sandbox payment
- confirm order in `/admin`
- confirm `paymentStatus=paid`
- confirm `fulfillmentStatus=packing`
- confirm `stockQuantity` moved from `1` to `0`
- confirm `reservedQuantity` returned to `0`
- confirm `paidAt` and `providerTransactionId` are filled
- confirm `providerPaymentId` is filled if Tpay returns it
- confirm duplicate webhook does not double-commit stock

Start checkout with the hidden product using the admin-only test bypass:

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ORDER_ADMIN_TOKEN" \
  -H "x-checkout-test-mode: true" \
  -d '{
    "locale": "pl",
    "items": [
      { "productId": "prod-tpay-sandbox-test", "size": "ONE SIZE", "quantity": 1 }
    ],
    "customer": {
      "firstName": "Test",
      "lastName": "Tpay",
      "email": "test@example.com",
      "phone": "500600700"
    },
    "shippingAddress": {
      "firstName": "Test",
      "lastName": "Tpay",
      "addressLine1": "Mokotowska 1",
      "postalCode": "00-001",
      "city": "Warszawa",
      "country": "PL"
    },
    "acceptedTerms": true,
    "acceptedPrivacy": true
  }'
```

The response should include `orderId` and a Tpay `url`. Open that URL and pay in
the Tpay sandbox. The response also includes the same redirect as `paymentUrl`
for clarity.

Open `/admin`, enter `ORDER_ADMIN_TOKEN`, and verify:

- order number is visible
- payment provider is `Tpay`
- `providerTransactionId` is filled
- `providerPaymentId` is visible when Tpay provides it
- `paymentStatus=paid`
- `paidAt` is filled
- last webhook status is `paid`
- `fulfillmentStatus=packing`
- test variant stock changes from `1` to `0` and reserved stock returns to `0`
- order timeline shows the payment/webhook events when available

The payment test passes only if the signed Tpay sandbox webhook reaches the app,
signature verification passes, the amount matches the order, currency is `PLN`,
the order is marked paid, inventory is committed exactly once, and reservations
return to zero.

Duplicate webhook safety:

- Use the Tpay sandbox dashboard replay/resend option if it is available for the
  transaction notification.
- The second notification should be stored or ignored idempotently and must not
  reduce stock below `0`.
- If Tpay sandbox does not expose replay/resend for the transaction, verify
  idempotency through automated tests and any official provider resend path that
  is available.
- Do not add a fake successful webhook bypass in production or staging.

Failed or expired payment safety:

- Reseed the product with `npm run db:seed:tpay-sandbox`.
- Start a new checkout and cancel/expire it in the Tpay sandbox flow.
- Confirm `/admin` shows payment `failed`, `cancelled` or `expired`, stock
  returns to `1`, and reserved stock returns to `0`.

Local negative webhook tests:

```bash
npm run tpay:webhook:dev -- --mode=unsigned
npm run tpay:webhook:dev -- --mode=bad-signed
```

Both helper calls intentionally send invalid development notifications and
should return a `400` verification error. They are only for confirming that fake
webhook success is not enabled. Paid webhook tests must use real signed Tpay
sandbox notifications.

The dev webhook helper must never fake a successful paid webhook, must never
bypass Tpay signature verification, and refuses to run in production.

Before switching to `TPAY_ENV=production`:

- Replace all sandbox credentials with production credentials.
- Set the production domain in `NEXT_PUBLIC_SITE_URL`.
- Confirm the Tpay production panel uses
  `/api/payments/webhook/tpay` as the notification URL.
- Enable BLIK and szybkie przelewy in the Tpay merchant panel.
- Run one live low-value payment and webhook replay test.
- Keep `STORE_STORAGE=postgres`; do not use JSON or Vercel Blob for real
  inventory, orders or payments.

## Launch Checklist

- Create a hidden product in `/admin`.
- Activate the product and at least one variant.
- Set stock quantity and confirm available stock.
- Enable `shopEnabled` and set `shopMode=PUBLIC_DROP` in a test environment.
- Add the product to cart through the backend cart API.
- Start checkout with customer, shipping, invoice and consent data.
- Complete a sandbox payment with the configured Polish provider.
- Confirm provider webhook marks payment as paid.
- Confirm stock is reduced exactly once.
- Run a failed or expired payment.
- Confirm reserved stock is released.
- Mark order as shipped and add a tracking number.
- Submit a return request using matching order number and customer email.
- Submit a complaint request using matching order number, email and product.
- Export orders as CSV from `/admin`.
- Run `npm test`, `npx tsc --noEmit --incremental false`, `npm run lint` and
  `npm run build`.

## Production Readiness Notes

Production-ready direction now in place:

- Product, variant, image, category and drop models.
- Store settings and pre-launch/public-drop modes.
- Guest cart model, Polish gross PLN prices and delivery cost model.
- Order snapshots for product name, SKU, variant and price.
- Generic Polish payment provider abstraction.
- PostgreSQL/Prisma adapter for transactional store storage.
- Atomic checkout reservation flow with serializable transactions.
- Database-stored provider webhook event IDs for idempotency.
- Inventory reservation, release, expiration and commit flows.
- Admin-only API for store operations and image uploads.
- Return, complaint, newsletter, discount, legal consent and analytics records.

Still MVP/local:

- `local-json` and Vercel Blob storage are not transactional databases.
- Admin panel is functional but minimal.
- InPost, PayU and direct Przelewy24 adapters are placeholders, not live
  integrations. Tpay has a real sandbox-ready adapter, but still needs merchant
  credentials and an end-to-end dashboard test before production sales.
- Email sending depends on `RESEND_API_KEY`; without it, email tasks are safely
  skipped and logged.

Before real sales:

- Provision and back up a production PostgreSQL provider such as Neon,
  Supabase or managed Postgres.
- Run a full Tpay sandbox and live low-value payment test with webhook replay.
- Add production InPost label/tracking integration.
- Add final legal documents, seller data, withdrawal form copy and complaint
  workflow review.
- Use a real admin authentication system before multiple staff members operate
  the store.

## Newsletter

The newsletter flow:

- validates email, consent, and source server-side
- saves subscribers to Google Sheets
- avoids duplicate rows
- sends confirmation emails with Resend

Full setup instructions are in [docs/newsletter-setup.md](/Users/magdalenagrabowska/garconmaires/docs/newsletter-setup.md).
Resend domain-specific notes are in [docs/resend-domain-setup.md](/Users/magdalenagrabowska/garconmaires/docs/resend-domain-setup.md).

Available setup commands:

```bash
npm run newsletter:setup
npm run newsletter:sheet
npm run newsletter:test-email
npm run newsletter:test-subscribe
npm run newsletter:vercel-env
```
