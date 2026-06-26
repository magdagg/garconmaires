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
RESEND_FROM_EMAIL="Garçonmaires Studio <studio@garconmaires.com>"
RESEND_REPLY_TO=studio@garconmaires.com
EMAIL_TEST_MODE=false
EMAIL_TEST_RECIPIENT=
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
LegalConsent, legal submissions, AnalyticsEvent, EmailEvent and
PaymentWebhookEvent.

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

## Legal/Seller Readiness

Garçonmaires must remain pre-launch until seller details, legal pages,
revenue-limit controls and product readiness are complete. Current Preview
readiness status is:

```text
sellerDataStatus=pending
legalStatus=pending
businessRegistrationStatus=unregistered_activity_planned
```

Do not invent or publish seller name, NIP, REGON, registered address, return
address or tax details. The first drop is planned under Polish działalność
nierejestrowana / unregistered activity, not JDG for now. Public checkout must
stay blocked until final seller/legal details, return/contact data, sales limit
controls and product readiness are completed and reviewed.

Before launching under działalność nierejestrowana, prepare revenue-limit
tracking, simplified sales register / ewidencja sprzedaży, invoice and cost
document collection, PIT settlement reminder, and assume no VAT recovery unless
a separate tax/VAT decision changes this later.

The Preview-only Launch Readiness dashboard is available in `/admin` after
opening the admin panel with `ORDER_ADMIN_TOKEN`. It reports the current
ecommerce audit score of 56/100, groups blockers by priority, and blocks
launch activation controls while Critical blockers exist. Public legal/help copy
must stay draft/pending until confirmed seller data is available.

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

## Transactional Emails

Transactional emails use Resend through a server-only integration. Required
variables:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL="Garçonmaires Studio <studio@garconmaires.com>"
```

Optional variables:

```env
RESEND_REPLY_TO=studio@garconmaires.com
EMAIL_TEST_MODE=false
EMAIL_TEST_RECIPIENT=
```

If `RESEND_API_KEY` or `RESEND_FROM_EMAIL` is missing, sending skips safely and
records a sanitized email event. Admin email preview never sends. Preview test
sends require `EMAIL_TEST_RECIPIENT` and never use an arbitrary typed customer
address. Local/development test sends can use an explicit admin-entered address.
Production test sends stay blocked unless `EMAIL_TEST_MODE=true` and
`EMAIL_TEST_RECIPIENT` are configured.

Email events store only operational metadata: recipient email, template type,
provider, status, provider message id if available, a short error summary and
timestamps. They do not store secrets, provider payloads, tokens or headers.

Current stable Preview status: Resend env vars are configured in Preview and
admin-only test sends to `EMAIL_TEST_RECIPIENT` have passed for
`order_created`, `payment_confirmed`, `order_shipped` and
`newsletter_confirmation`. Configure Resend only in Preview until the production
launch rehearsal is explicitly approved.

## Delivery Readiness

Default delivery configuration remains prepared for the Polish market:

- InPost Paczkomat: `14.99 PLN`
- Courier: `17.99 PLN`
- Manual pickup placeholder: disabled by default
- Free shipping threshold: `499.00 PLN`

The checkout UI is gated during pre-launch but prepared for parcel locker data,
courier addresses, phone/email validation, delivery price and legal consents.
The future InPost adapter should use these env names when credentials are
available:

```env
INPOST_ENV=sandbox
INPOST_API_TOKEN=
INPOST_ORGANIZATION_ID=
INPOST_DEFAULT_SENDER_ID=
INPOST_DEFAULT_SERVICE=inpost_locker_standard
INPOST_LABEL_FORMAT=pdf
INPOST_TEST_MODE=true
```

Shipping provider architecture now supports a manual fallback provider and an
InPost ShipX provider. In Preview, keep `INPOST_ENV=sandbox` and
`INPOST_TEST_MODE=true`. Production InPost shipment creation is blocked from
Vercel Preview. Admin diagnostics show only safe status values: configured
true/false, environment, test mode, token present true/false and organization id
present true/false. Tokens and raw provider credentials are never displayed.

Admin shipment workflow:

1. Confirm the order is paid/ready for fulfillment.
2. Confirm delivery data: parcel locker for Paczkomat, address for courier.
3. Use manual tracking fallback if InPost credentials are missing.
4. With sandbox credentials configured, create an InPost shipment from `/admin`.
5. Generate a label from `/admin`.
6. Refresh tracking status from `/admin`.
7. Cancel only non-delivered shipments when provider state allows it.

Do not invent or fake InPost credentials. Do not create production shipments
from Preview. Keep manual fulfillment available until real sandbox shipment,
label and tracking flows are verified.

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
- Sandbox mode must never call the production base URL.
- The legacy/Origin API credentials are not the same as the Open API Client ID
  and Secret used by these endpoints.

In the Tpay merchant panel, set the notification/webhook URL exactly to:

```text
https://STAGING_DOMAIN/api/payments/webhook/tpay
```

Do not use localhost as the Tpay webhook URL. Use the Vercel Preview/Staging
domain or a secure tunnel. `NEXT_PUBLIC_SITE_URL` must match that public
staging origin.

Current staging status:

- Stable admin URL: `https://garconmaires-tpay-staging.vercel.app/admin`
- Stable checkout URL: `https://garconmaires-tpay-staging.vercel.app/api/checkout`
- Stable webhook URL:
  `https://garconmaires-tpay-staging.vercel.app/api/payments/webhook/tpay`
- Detailed success record:
  [docs/tpay-sandbox-test.md](/Users/magdalenagrabowska/garconmaires/docs/tpay-sandbox-test.md)
- Tpay sandbox end-to-end payment passed on staging on 2026-06-13.
- OAuth diagnostic succeeded with the Open API form-body variant:
  `client_id` + `client_secret`.
- Hidden-product checkout created a Tpay sandbox transaction and returned a
  `paymentUrl`.
- The Tpay sandbox payment was completed in the Tpay panel.
- Tpay delivered the classic form transaction notification to the app.
- Webhook verification succeeded after fixing sandbox Open API credentials,
  `TPAY_MERCHANT_ID`, classic notification handling and the plain text `TRUE`
  response required by Tpay.
- Audit order `GM-2026-0003` / `TR-528F-F004PX` became `paid`, moved to
  `fulfillmentStatus=packing`, and has `paidAt` filled.
- Stock was committed correctly for the hidden sandbox variant: stock moved from
  `1` to `0`, reserved moved from `1` to `0`, and the reservation was committed.
- The sandbox fixture was reset afterward for future tests: hidden product,
  `stockQuantity=1`, `reservedQuantity=0`. The paid audit order was preserved.
- In Vercel, paste only the raw value. Do not paste `TPAY_API_KEY=...`,
  `TPAY_API_SECRET=...`, wrapping quotes, or trailing newlines as the value.
- Do not switch to `TPAY_ENV=production` or the production endpoint just to test
  sandbox checkout.

Admin-only OAuth diagnostic:

- `/admin` includes a Tpay OAuth diagnostic action behind `ORDER_ADMIN_TOKEN`.
- It only requests an OAuth token; it does not create an order, reserve stock,
  create a Tpay transaction, or fake a webhook/payment success.
- It displays only sanitized fields: selected environment, base URL, endpoint
  host/path, HTTP status, error code/description, key length, secret length,
  short non-reversible SHA-256 fingerprints, and prefix/quotes/whitespace flags.
  It never displays Client ID, Secret, access token, webhook secret,
  authorization headers, request bodies or full hashes.
- It also displays Vercel runtime metadata when available:
  `VERCEL_ENV`, short `VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_REF`,
  deployment id and runtime timestamp. Use these fields to confirm that a
  redeploy happened after changing Preview env vars.
- Vercel Preview env listing should include `TPAY_API_KEY`,
  `TPAY_API_SECRET`, `TPAY_ENV`, `PAYMENT_PROVIDER`, `TPAY_MERCHANT_ID`,
  `TPAY_WEBHOOK_SECRET`, `ORDER_ADMIN_TOKEN`, `NEXT_PUBLIC_SITE_URL`,
  `CHECKOUT_TEST_MODE`, `STORE_STORAGE` and `DATABASE_URL` with Preview scope.
  Sensitive values remain encrypted and are not readable through `vercel env
  pull`.
- If OAuth still fails after changing Vercel env vars, compare the displayed
  `TPAY_API_KEY` and `TPAY_API_SECRET` fingerprints before/after redeploy. If
  the fingerprint did not change, the deployment is still using old env values
  or the values were changed in the wrong Vercel scope.
- The diagnostic compares OAuth formats without creating transactions:
  - Variant A: form body `client_id` + `client_secret`.
  - Variant B: HTTP Basic Auth with `grant_type=client_credentials`.
  - Variant C: form body `client_id` + `client_secret` +
    `grant_type=client_credentials`.
  - Variant D: scope parameter is skipped unless Tpay documentation identifies a
    required scope.
- The regular payment adapter still uses Variant A unless a diagnostic proves
  another format works and the adapter is intentionally updated.
- Run this before the hidden-product checkout. Continue to checkout only when it
  says `OAuth OK — sandbox credentials valid`.

Local sanitized OAuth diagnostic:

```bash
tsx scripts/diagnose-tpay-oauth.ts
```

The script uses the same env vars, prints only sanitized diagnostics, and exits
non-zero if OAuth fails.

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

Repeat the sandbox test later:

- log in to the Tpay Sandbox Merchant Panel, not the production panel
- go to `Integracje → API`
- copy Open API Client ID to `TPAY_API_KEY`
- copy Open API Secret to `TPAY_API_SECRET`
- set `TPAY_MERCHANT_ID` to the sandbox merchant/account id
- set `TPAY_WEBHOOK_SECRET` to the sandbox `Kod bezpieczeństwa`
- update `TPAY_API_KEY` and `TPAY_API_SECRET` in Vercel Preview only
- redeploy Preview and keep `TPAY_ENV=sandbox`
- confirm the readiness panel is green
- run the admin OAuth diagnostic
- reset the Tpay sandbox product to stock `1` and reserved `0`
- run the hidden-product checkout command below
- open the returned `paymentUrl`
- complete the Tpay sandbox payment
- verify the signed webhook marks the order paid and commits stock exactly once

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

Tpay production remains untested. Before launch, configure production
credentials only in the Production environment and run one controlled low-value
live payment after products, legal details, stock, delivery and operational
checks are final.

### Resend transactional email testing

Do not send real customer emails until launch approval. In Preview/Staging,
transactional email tests must be admin-only and routed to a test recipient.

Current stable Preview status:

- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`,
  `EMAIL_TEST_MODE` and `EMAIL_TEST_RECIPIENT` are configured in Preview.
- Admin-only test sends passed through Resend for `order_created`,
  `payment_confirmed`, `order_shipped` and `newsletter_confirmation`.
- New `EmailEvent` rows were recorded with status `sent`, provider `resend`,
  provider message id present, `sentAt` present and `errorSummary=null`.
- Order-related test sends are linked to the paid audit order `GM-2026-0003`;
  `newsletter_confirmation` has no order link.
- No production emails and no real customer emails have been sent.

Required Preview env vars:

```env
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Garçonmaires Studio <studio@garconmaires.com>
EMAIL_TEST_MODE=true
EMAIL_TEST_RECIPIENT=admin-or-test@example.com
```

Optional Preview env:

```env
RESEND_REPLY_TO=studio@garconmaires.com
```

Recommended sender: `studio@garconmaires.com` or another verified
Garçonmaires-domain address. Setup checklist:

- add `garconmaires.com` in Resend
- add the required Resend DNS records
- wait for domain verification
- add the Preview env vars in Vercel
- redeploy Preview
- send only to `EMAIL_TEST_RECIPIENT`
- preview/test `order_created`, `payment_confirmed`, `order_shipped`,
  `newsletter_confirmation`, `payment_failed`, `return_requested`,
  `complaint_submitted` and `early_access_invitation`
- check `EmailEvent` logs in `/admin`

Keep Production Resend envs unset until explicitly preparing the production
launch rehearsal.

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
Transactional email test notes are in [docs/resend-transactional-email-testing.md](/Users/magdalenagrabowska/garconmaires/docs/resend-transactional-email-testing.md).

Available setup commands:

```bash
npm run newsletter:setup
npm run newsletter:sheet
npm run newsletter:test-email
npm run newsletter:test-subscribe
npm run newsletter:vercel-env
```
