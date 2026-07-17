# Garconmaires launch readiness audit

Audit date: 2026-06-13  
Stable staging: https://garconmaires-tpay-staging.vercel.app  
Admin: https://garconmaires-tpay-staging.vercel.app/admin

Supporting notes:

- Tpay sandbox record: [docs/tpay-sandbox-test.md](/Users/magdalenagrabowska/garconmaires/docs/tpay-sandbox-test.md)
- Resend transactional testing: [docs/resend-transactional-email-testing.md](/Users/magdalenagrabowska/garconmaires/docs/resend-transactional-email-testing.md)

## 2026-06-29 legal/checkout readiness update

Scope reviewed:

- `lib/store-pages.ts` legal/help content for terms/regulamin, privacy, cookies,
  returns and complaints, delivery/shipping, payments and FAQ.
- Checkout UI in `components/pages/checkout-page.tsx` and
  `components/pages/checkout-preview-demo.tsx`.
- Checkout order creation and consent logging in `app/api/checkout/route.ts`,
  `lib/store/orders.ts`, `lib/store/postgres.ts` and `prisma/schema.prisma`.
- Admin legal readiness diagnostics in `app/api/admin/store/route.ts`.
- Existing legal launch checklist in `docs/legal-launch-checklist.md`.

Current status:

- Legal pages remain draft/pending and do not publish final seller identity,
  address, return address, NIP, REGON or final tax/VAT claims.
- Official brand contact/support/returns e-mail is
  `studio@garconmaires.com`.
- Admin readiness must continue to treat seller/legal data as launch blockers
  while legal pages are draft/pending.
- Checkout has two required consents: terms/regulamin and privacy policy.
- Checkout has one optional newsletter/marketing consent.
- Consent timestamps and `legalDocumentVersion` are stored when an order is
  created.
- Checkout links point to terms/privacy/returns/delivery pages in PL and EN, but
  final checkbox wording still requires legal/accounting review.

Legal/checkout blockers before `shopEnabled=true`:

- Seller identity for działalność nierejestrowana: TO CONFIRM.
- Contact/correspondence address and return address/process: TO CONFIRM.
- Customer support and returns/complaints e-mail is
  `studio@garconmaires.com`; final legal document placement and mailbox
  ownership/process: TO CONFIRM.
- Consumer-facing statement for działalność nierejestrowana: TO CONFIRM.
- VAT/no-VAT wording and sales confirmation/faktura-on-request process:
  TO CONFIRM.
- Revenue limit tracking and simplified sales register process: pending.
- Final terms, privacy, returns/complaints, delivery and cookies documents:
  pending legal review.
- Final required/optional checkout consent wording in PL/EN: TO CONFIRM.
- Decision whether a separate withdrawal/consumer-rights checkbox is required:
  TO CONFIRM.

## 2026-06-26 DROP 01 launch readiness checklist

Current safe state:

- Header account/cart icons are ready.
- Customer account is functional in local/Preview behind `ACCOUNT_ENABLED` /
  `CUSTOMER_ACCOUNT_MODE`.
- Customer account is intended to become a public storefront feature after the
  production auth blockers are resolved.
- Guest checkout remains mandatory and must not be removed or hidden when the
  public account is enabled.
- Logged-in checkout can use the customer profile and default address as
  editable autofill, while guest checkout remains independent.
- Order history currently uses the account e-mail to show matching orders,
  including earlier guest orders made with the same e-mail. This is acceptable
  for first public account launch; a dedicated order-to-account relation can be
  added later.
- Production auth remains pending until durable/edge-backed rate limiting,
  final CSRF review, login/abuse monitoring, production e-mail rehearsal,
  account deletion/privacy process and a dedicated security review are complete.
- Password reset, e-mail verification, password-changed notification,
  logout-from-all-devices and account deletion request flows are implemented for
  local/Preview. Production e-mail sending must be rehearsed before enabling
  public accounts.
- Guest order status lookup is ready.
- Returns/complaints UX is ready.
- Admin customer-service section for orders, returns, complaints and email logs is ready.
- Checkout failed/cancelled/expired states are ready.
- Supabase/Postgres `EMAXCONNSESSION` during build/prerender was fixed locally/preview by moving collection/sitemap to dynamic rendering and reducing parallel Postgres reads.
- Store remains blocked for real sales: `shopEnabled=false`, `shopMode=PRE_LAUNCH`, visible products `0`.

### MUST HAVE before public sales

- Final DROP 01 products approved: Hoodie, T-shirt, Zip hoodie.
- Real product photos uploaded, including primary image and gallery for each product.
- Product variants finalized: sizes, SKUs, availability and size naming.
- Real stock quantities entered and checked against physical inventory.
- Gross PLN prices approved for each product and delivery option.
- Product copy completed: short description, editorial description, technical description, material/composition, fit, measurements and care instructions.
- Guest checkout verified end-to-end without requiring customer account login.
- If public account is enabled for the drop, logged-in checkout autofill verified
  for profile and default delivery address.
- Tpay production credentials configured only during launch rehearsal.
- Tpay production low-value live payment test completed and documented.
- Transactional emails configured in production: order created, payment confirmed, payment failed, shipped, return requested, complaint submitted.
- Delivery method finalized: manual fulfillment and/or InPost. Delivery prices, delivery times, parcel locker/courier behavior and tracking process must be visible before payment.
- Terms and conditions finalized and reviewed.
- Privacy policy/GDPR information finalized and reviewed.
- Returns and complaints policy finalized, including contact and return address.
- Seller data for działalność nierejestrowana completed where legally required: seller identity, contact, return address and business/tax wording appropriate to the chosen model.
- Checkout legal checkboxes finalized: terms, privacy, withdrawal/consumer info and optional marketing consent.
- Admin order fulfillment tested: processing, packing, shipped, tracking number, status emails and customer-service visibility.
- Production envs configured and reviewed.
- Production smoke test completed before `shopEnabled=true`.

### SHOULD HAVE

- Mobile QA pass on homepage, collection, product, cart, checkout, order status, returns/complaints and account placeholder.
- Tracking shipment URL tested with final delivery provider.
- Full status-email set polished and previewed: return approved/rejected, refund processed, complaint resolved.
- Analytics events prepared for view product, add to cart, begin checkout, payment success/failure, purchase and newsletter signup.
- Error monitoring configured for production runtime and API routes.
- Database backup/export runbook prepared and tested.
- End-to-end return and complaint rehearsal from order lookup to admin resolution.
- Production account abuse monitoring and durable rate limiting rehearsed.

### NICE TO HAVE

- Dedicated `customerAccountId` relation on orders in addition to the current
  e-mail matching model.
- Social login.
- Saved payment preferences, if ever introduced through a compliant provider.
- Automated returns from account panel beyond the current request flow.
- Wishlist.
- Product recommendations/related products.

### Launch blockers

These still block `shopEnabled=true`:

- Seller/legal identity and return/contact data are pending.
- Final legal pages are not approved for public sale.
- Działalność nierejestrowana revenue-limit tracking and simplified sales register process are not launch-rehearsed.
- Real product photos are not final.
- Product specs, measurements, material/composition and care content are not final.
- Real product stock and variant availability are not ready for launch.
- Prices and delivery costs require final review.
- Production Tpay credentials and live low-value payment test are pending.
- Production Resend setup and final transactional email rehearsal are pending.
- Delivery/fulfillment SOP, tracking process and return shipping process are pending.
- Public customer account production blockers are pending if account launch is
  included in the first public drop: durable rate limit, production verification
  e-mails, production password reset e-mails, abuse monitoring and final privacy
  review.
- Production env review and production smoke test are pending.

### Placeholders allowed for first drop

- Customer account can remain a polished frontend placeholder if guest checkout and guest order status work.
- If production auth blockers are not resolved in time, login/register can
  remain unavailable while guest checkout and guest order status stay live.
- Wishlist and product recommendations can remain unavailable.
- Automated refund workflow can remain manual/admin-only if policy and communication are clear.
- Advanced analytics dashboards can wait if basic operational logs and order records work.

### Placeholders not allowed before public sales

- Seller identity, return address/contact and legal status cannot be placeholder.
- Terms, privacy policy, returns/complaints and payment/delivery information cannot be draft/pending.
- Product photos, names, prices, sizes, stock and product descriptions cannot be placeholder.
- Payment provider settings cannot be sandbox/test placeholders.
- Delivery methods, delivery price/time and tracking/fulfillment ownership cannot be placeholder.
- Checkout legal checkboxes cannot be placeholder.
- Transactional order/payment confirmation emails cannot be placeholder.

### Production env checklist

- `DATABASE_URL`: runtime pooled Supabase/Postgres connection string suitable for Vercel serverless/runtime.
- `DIRECT_URL`: direct/session connection string for Prisma migrations and one-off maintenance, not normal runtime traffic.
- Tpay production: environment flag, client ID, client secret, merchant/account identifiers, security/webhook credentials and production callback URLs.
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, production sender domain verified, production test mode disabled after rehearsal.
- InPost if used: API token, organization/sender details, sandbox/live mode decision, label/tracking configuration.
- Admin: strong `ADMIN_STORE_TOKEN`, rotation plan and no leaked preview token in production.
- Site URL: canonical production URL and payment/email callback base URL.
- Analytics/monitoring if used: GA/GTM/Meta Pixel/Sentry or equivalent, with consent mode and privacy policy alignment.

### Final test plan before launch

- Product to cart: select product, size, quantity and add to cart.
- Cart to checkout: update quantity, remove item, validate totals and delivery cost.
- Checkout to Tpay: submit guest checkout with valid customer/delivery/legal data.
- Tpay success: payment returns to success page, order becomes paid, stock commits.
- Tpay failure/cancelled/expired: customer sees correct state, order/payment status remains safe, stock/reservation behavior is correct.
- Order created: order row, order items, customer data, consents and delivery data are stored correctly.
- Payment confirmed: webhook verification passes and duplicate webhooks are idempotent.
- Order status lookup: correct number/email returns safe summary; wrong number/email does not leak data.
- Return request: customer verifies order, selects item, submits reason, admin sees request, confirmation email/log is created.
- Complaint request: customer verifies order, selects item, submits description, admin sees complaint, confirmation email/log is created.
- Admin fulfillment: mark processing/packing/shipped, add tracking number, verify customer-visible status.
- Shipped email: preview/send final template and verify tracking details.
- Mobile flow: PL and EN product/cart/checkout/order-status/returns pages usable on mobile.
- PL/EN routes: homepage, collection, product, cart, checkout, order status, returns/complaints, legal pages and sitemap return expected statuses.

Recommended order from now to launch:

1. Complete legal/seller data for działalność nierejestrowana, including return/contact data and revenue-limit process.
2. Finalize products: images, variants, stock, prices, descriptions, size guide, material and care.
3. Finalize delivery decision and fulfillment runbook.
4. Configure production provider envs in a controlled rehearsal window.
5. Run full staging rehearsal, then controlled production smoke test.
6. Only after pass: expose products and intentionally switch launch settings.

Preview deployment safety:

- Current state is safe to deploy as Preview/Staging.
- Do not promote to production.
- Do not set `shopEnabled=true`.
- Do not change `shopMode` from `PRE_LAUNCH`.
- Do not expose visible products before legal/product/payment/delivery blockers are cleared.

## 2026-06-25 ecommerce audit update

The full clothing ecommerce audit is complete. The current public launch
readiness score for a real clothing store launch is **56/100**.

Key blockers remain:

- Business model is now selected for first drop: działalność nierejestrowana /
  unregistered activity planned. Legal/seller data is still pending: seller
  identity, legal address, tax identifiers if applicable, return address,
  complaint contact and final document version are not confirmed.
- Product readiness is pending: real product photos, complete specs,
  measurements, material/composition/care, available variants and confirmed
  stock are not launch-ready.
- Delivery operations are pending: InPost/manual fulfillment, shipment labels,
  tracking and final delivery prices/times need launch rehearsal.
- Production payment/email/delivery rehearsal is pending and must not happen
  until legal, product, stock and fulfillment blockers are resolved.

Implementation follow-up completed on 2026-06-25:

- Added a Preview-only admin **Launch Readiness** dashboard in `/admin`.
- The dashboard groups blockers by Critical, High, Medium and Low priority.
- Launch activation controls are blocked in the admin UI while Critical blockers
  exist: `shopEnabled`, `PUBLIC_DROP`, live drop status and public product
  visibility cannot be toggled from the dashboard flow.
- Public legal/help copy in `lib/store-pages.ts` was neutralized where it used
  hardcoded seller/address/payment placeholders. Public pages now stay visible
  but are clearly marked draft/pending until confirmed seller/legal data exists.
- 2026-06-25 update: business model is now
  `unregistered_activity_planned`; admin readiness also tracks revenue-limit
  controls, simplified sales register, document collection, PIT reminder and no
  VAT recovery unless a separate tax/VAT decision is made later.
- No fake seller, NIP, REGON, address, return address or tax data was added.
- Safety baseline remains: `shopEnabled=false`, `shopMode=PRE_LAUNCH`, visible
  products `0`, real products hidden/draft, checkout gated, no production
  deployment required for this update.

## Executive summary

Garconmaires has completed the controlled Tpay sandbox staging payment flow, but it is not ready for real sales yet.

The backend foundation is in place: Postgres storage, Prisma migrations, hidden/draft product data, inventory reservations, order/payment/delivery/returns/complaints models, EmailEvent logging, admin diagnostics, gated public catalog, and Tpay integration are implemented. Staging remains safe: `shopEnabled=false`, `shopMode=PRE_LAUNCH`, visible products are `0`, DROP 01 is draft, and all real products are hidden/draft.

Tpay sandbox is now staging-ready: OAuth, checkout transaction creation, payment completion, classic form webhook delivery, webhook verification, paid order update and stock commit have all passed on Preview/Staging. Tpay production credentials and one controlled low-value live payment test remain pending for the launch rehearsal.

The second launch blocker is commercial content/legal readiness. Product images are missing, real products have zero stock, specs and size guides still contain placeholders, and legal pages still require final seller, tax, address, delivery, payment, return, complaint, privacy, and GDPR details. The first drop is now planned under działalność nierejestrowana, but seller/legal data and revenue-limit controls remain pending.

## Readiness score

Overall launch readiness: 70/100.

Area scores:

| Area | Score | Status |
| --- | ---: | --- |
| Technical build and deployment | 90 | Ready for staging |
| Database and migrations | 95 | Ready |
| Admin and operations | 82 | Mostly ready |
| Product catalog safety | 90 | Safe pre-launch |
| Product content | 35 | Not launch-ready |
| Payments | 82 | Sandbox passed, production live test pending |
| Delivery | 76 | Provider architecture ready, InPost sandbox credentials/test pending |
| Email | 84 | Preview test-send passed, production launch setup pending |
| Legal/compliance | 25 | Business registration and seller data pending |
| Frontend | 78 | Strong pre-launch, storefront launch polish pending |
| SEO | 78 | Safe pre-launch |
| Security/privacy | 80 | Good baseline, some hardening remains |

## Ready items

- App builds successfully.
- TypeScript passes.
- Lint passes.
- Tests pass.
- Prisma schema validates.
- Staging Supabase/Postgres connection works.
- Prisma migrations are applied.
- No pending Prisma migrations were found.
- Stable staging alias works.
- `/admin` returns `200`.
- Invalid admin API token returns `401`.
- Admin layout is noindex.
- Admin response sends `x-robots-tag: noindex, nofollow, noarchive`.
- `/api/admin/store` is token protected.
- Product image upload route is admin-token protected.
- Public sitemap excludes admin, cart, checkout, and hidden products.
- Hidden real product pages return `404`.
- Hidden sandbox product pages return `404`.
- Public cart POST for the hidden sandbox product returns `400`.
- Store remains pre-launch.
- Visible product count remains `0`.
- Real products remain draft/hidden.
- Tpay sandbox product remains hidden and separate.
- Tpay sandbox checkout/webhook test passed end-to-end on Preview/Staging.
- Audit order `GM-2026-0003` remains paid/packing as evidence.
- Sandbox fixture was reset to hidden `stockQuantity=1`, `reservedQuantity=0`.
- Resend Preview envs are configured.
- Admin-only Resend test sends passed for `order_created`,
  `payment_confirmed`, `order_shipped` and `newsletter_confirmation`.
- New `EmailEvent` rows record sent status, provider `resend`, provider message
  id present and `sentAt` present without raw provider payloads or secrets.
- No production deploy was performed during this audit.
- No real customer emails were sent during this audit.

## Blockers

1. Real products are not launch-ready.
   - No product images are attached.
   - Stock is `0` for all real variants.
   - Variants are not available.
   - Specs, materials, dimensions, care, model sizing, and size guides still contain placeholders.

2. Legal documents are draft only.
   - Business registration status is `unregistered_activity_planned` for the first drop.
   - Launch remains blocked until seller identity, legal pages, return/contact data, sales limit controls and product readiness are completed.
   - Działalność nierejestrowana launch requires revenue limit tracking, simplified sales register / ewidencja sprzedaży, invoice/cost document collection, PIT settlement reminder and no VAT recovery unless a separate tax/VAT decision changes that later.
   - Seller legal name, NIP, REGON, registered address, return address, complaint contact, payment operator details, delivery operator details, privacy/GDPR legal bases, retention periods, and final return/complaint rules must be completed and reviewed.

3. Delivery is operationally incomplete.
   - InPost provider architecture, parcel locker search endpoint, shipment model and admin actions exist, but no live InPost sandbox credentials or label creation test are complete.
   - Manual fulfillment decision, final prices/times, and return address must be finalized.

## Must-fix before launch

- Finish product images for each launch product and set primary images with useful alt text.
- Finalize all product specs, material/composition, fit, color, care instructions, measurements, weights, packaging contents, and country of manufacture.
- Set final stock quantities and availability for launch variants.
- Complete and legally review Polish and English legal pages.
- Prepare Production Resend envs only during the approved launch rehearsal and
  run one final controlled email check.
- Decide InPost API versus manual first-drop fulfillment.
- Confirm final delivery prices, estimated delivery windows, and return address.
- Prepare Tpay production envs only after legal/products/stock are ready.
- Run one controlled low-value live payment test before public launch.

## Should-fix before launch

- Add stronger operational documentation for refund/return/complaint handling.
- Add monitoring/log review notes for checkout, webhook, email, and admin errors.
- Add admin export or backup procedure for first-drop orders.
- Add visible admin warnings for product placeholder content before products can be made public.
- Add final newsletter consent/cookie analytics policy details if analytics or marketing tools are enabled.

## Nice-to-have later

- Full InPost shipment creation and label printing.
- Automated webhook replay verification against provider resend tools.
- More granular email delivery status tracking via Resend webhooks.
- Admin audit trail for product/status/settings changes.
- Product launch preview mode for selected reviewers.
- International shipping configuration.

## Part 1: Technical readiness audit

| Check | Result | Evidence |
| --- | --- | --- |
| App builds successfully | Pass | `npm run build` passed. |
| Lint passes | Pass | `npm run lint` passed. |
| TypeScript passes | Pass | `npx tsc --noEmit --incremental false` passed. |
| Tests pass | Pass | `npm test`: 53 tests passed. |
| Prisma schema validates | Pass | `npx prisma validate` passed. |
| Prisma client generates | Pass | `npx prisma generate` passed. |
| Staging DB connection works | Pass | Read-only Prisma audit query completed against staging Supabase. |
| Migrations applied | Pass | Applied migrations: `0001_init`, `0004_delivery_settings`, `0005_product_admin_metadata`, `0006_email_events`. |
| Pending migrations | Pass | None found. |
| Stable alias works | Pass | `https://garconmaires-tpay-staging.vercel.app` responds. |
| `/admin` accessible | Pass | `/admin` returns `200`. |
| Admin requires token | Pass | `/api/admin/store` with invalid token returns `401`. |
| Admin diagnostics expose no secrets | Pass with caution | Diagnostics use present/missing/length/sanitized fields; no raw token, database URL, Tpay secret, Resend key, or auth header output found. |
| `/api/admin/*` protected | Pass for checked routes | Store route and images route use admin authorization. |
| Admin routes noindex | Pass | Admin layout metadata sets `robots.index=false`; live response includes `x-robots-tag: noindex, nofollow, noarchive`. |
| Public routes expose no internal data | Pass | Public catalog filters hidden/draft/sandbox products; hidden product routes return `404`. |
| Sitemap excludes admin/cart/checkout/hidden products | Pass | Live sitemap has 10 URLs and no admin/cart/checkout/hidden product URLs. |
| Robots/sitemap correct | Pass with note | `robots.txt` allows public crawling and points to production sitemap; safe while no public products are visible. |
| `shopEnabled=false` | Pass | Staging DB setting is false. |
| `shopMode=PRE_LAUNCH` | Pass | Staging DB setting is `PRE_LAUNCH`. |
| Visible products = 0 | Pass | Staging DB visible product count is `0`. |
| No real products public | Pass | Real product pages return `404`. |
| Sandbox product hidden/separate | Pass | Sandbox product is active but `isVisible=false`, no category/drop, public route returns `404`. |
| No production deploy happened | Pass | Audit did not run production deploy. |

Live route checks:

| Route | Status |
| --- | ---: |
| `/` | 200 |
| `/kolekcja` | 200 |
| `/en/collection` | 200 |
| `/koszyk` | 200 |
| `/checkout` | 200 |
| `/en/cart` | 200 |
| `/en/checkout` | 200 |
| `/regulamin` | 200 |
| `/polityka-prywatnosci` | 200 |
| `/zwroty-i-reklamacje` | 200 |
| `/dostawa` | 200 |
| `/kontakt` | 200 |
| `/en/terms` | 200 |
| `/en/privacy-policy` | 200 |
| `/en/returns-complaints` | 200 |
| `/en/delivery` | 200 |
| `/en/contact` | 200 |
| `/produkt/garconmaires-black-t-shirt` | 404 |
| `/produkt/garconmaires-black-hoodie` | 404 |
| `/produkt/garconmaires-eyewear` | 404 |
| `/produkt/garconmaires-test-product` | 404 |
| `/en/product/garconmaires-black-t-shirt` | 404 |
| `/en/product/garconmaires-test-product` | 404 |

## Part 2: Store/backend readiness audit

Database tables present:

- `Product`
- `ProductVariant`
- `Drop`
- `Order`
- `Payment`
- `Delivery`
- `InventoryReservation`
- `ReturnRequest`
- `Complaint`
- `EmailEvent`
- `AnalyticsEvent`
- `LegalConsent`
- `LegalSubmission`
- `StoreSettings`

Current staging counts:

| Model/count | Value |
| --- | ---: |
| Products | 8 |
| Variants | 30 |
| Visible products | 0 |
| Visible real products | 0 |
| Active reservations | 0 |
| Orders | 2 |
| Payments | 2 |
| Deliveries | 2 |
| Return requests | 0 |
| Complaints | 0 |
| Email events | 9 |
| Analytics events | 0 |
| Legal consents | 2 |
| Legal submissions | 0 |

Backend readiness:

- Products table state: ready structurally; content/stock not launch-ready.
- Variants table state: ready structurally; real variants have zero stock and are unavailable.
- Draft products exist: yes.
- DROP 01 exists: yes, status `draft`.
- Stock/reserved stock logic: implemented with non-negative and reserved-not-over-stock constraints plus atomic reservation updates.
- Inventory reservation logic: implemented with active/released/committed reservation states.
- Order model: exists.
- Payment model: exists.
- Delivery model: exists.
- Returns/complaints models: exist.
- EmailEvent model: exists.
- Analytics/legal logs: AnalyticsEvent, LegalConsent, LegalSubmission exist.
- Checkout blocks when `shopEnabled=false`: code gates public checkout; admin/test checkout requires token and `x-checkout-test-mode`.
- Checkout blocks hidden/draft products: public catalog/cart validation excludes non-public products.
- Public cart blocks hidden/draft/sandbox products: live hidden sandbox cart POST returned `400`.
- Admin/test checkout remains token-protected: requires `CHECKOUT_TEST_MODE=true`, `x-checkout-test-mode: true`, and valid admin token.

## Part 3: Product readiness audit

### Garconmaires Black T-Shirt

| Field | Current state |
| --- | --- |
| Product ID | `prod-garconmaires-black-tshirt` |
| Slug | `garconmaires-black-t-shirt` |
| Category | Tops |
| Drop | DROP 01 |
| Price | 449.00 PLN |
| Status | draft |
| Visibility | hidden (`isVisible=false`) |
| Featured | false |
| Images | none |
| Primary image | missing |
| Alt text | missing because images are missing |
| Short description | Present |
| Editorial description | Present |
| Technical description | Present but contains confirmation placeholders |
| Material/composition | Placeholder: `100% bawełna [to confirm before launch]` |
| Fit | Placeholder: `Oversize / boxy fit [to confirm before launch]` |
| Color | Black |
| Care instructions | Placeholder: `Prać na lewej stronie w 30°C [to confirm before launch]` |
| Size guide | Present but all measurements are `[to confirm]` |
| SEO title | Present |
| SEO description | Present but says final materials/dimensions need confirmation |
| Internal notes | Present, explicitly says final copy/measurements/materials/care/photography need confirmation |

Variants:

| Variant | SKU | Stock | Reserved | Available |
| --- | --- | ---: | ---: | --- |
| S | `GM-TSHIRT-BLK-S` | 0 | 0 | false |
| M | `GM-TSHIRT-BLK-M` | 0 | 0 | false |
| L | `GM-TSHIRT-BLK-L` | 0 | 0 | false |
| XL | `GM-TSHIRT-BLK-XL` | 0 | 0 | false |

Readiness score: Needs images, specs, and stock. Not launch-ready.

### Garconmaires Black Hoodie

| Field | Current state |
| --- | --- |
| Product ID | `prod-garconmaires-black-hoodie` |
| Slug | `garconmaires-black-hoodie` |
| Category | Hoodies |
| Drop | DROP 01 |
| Price | 899.00 PLN |
| Status | draft |
| Visibility | hidden (`isVisible=false`) |
| Featured | false |
| Images | none |
| Primary image | missing |
| Alt text | missing because images are missing |
| Short description | Present |
| Editorial description | Present |
| Technical description | Present but contains confirmation placeholders |
| Material/composition | Placeholder: cotton/cotton blend to confirm |
| Fit | Placeholder: oversize/boxy fit to confirm |
| Color | Black |
| Care instructions | Placeholder: wash inside out at 30°C to confirm |
| Size guide | Present but all measurements are `[to confirm]` |
| SEO title | Present |
| SEO description | Present but says final materials/dimensions need confirmation |
| Internal notes | Present, explicitly says weight/trims/measurements/care/model sizing/images need confirmation |

Variants:

| Variant | SKU | Stock | Reserved | Available |
| --- | --- | ---: | ---: | --- |
| S | `GM-HOODIE-BLK-S` | 0 | 0 | false |
| M | `GM-HOODIE-BLK-M` | 0 | 0 | false |
| L | `GM-HOODIE-BLK-L` | 0 | 0 | false |
| XL | `GM-HOODIE-BLK-XL` | 0 | 0 | false |

Readiness score: Needs images, specs, and stock. Not launch-ready.

### Garconmaires Eyewear

| Field | Current state |
| --- | --- |
| Product ID | `prod-garconmaires-eyewear` |
| Slug | `garconmaires-eyewear` |
| Category | Accessories |
| Drop | DROP 01 |
| Price | 499.00 PLN |
| Status | draft |
| Visibility | hidden (`isVisible=false`) |
| Featured | false |
| Images | none |
| Primary image | missing |
| Alt text | missing because images are missing |
| Short description | Present |
| Editorial description | Present |
| Technical description | Present but contains confirmation placeholders |
| Material/composition | Placeholder: acetate/polycarbonate to confirm |
| Fit | Not applicable, but dimensions missing |
| Color | Black |
| Care instructions | Present but marked to confirm |
| Size guide | Present but all eyewear measurements are `[to confirm]` |
| SEO title | Present |
| SEO description | Present but says lens/dimensions need confirmation |
| Internal notes | Present, explicitly says lens certification/material/dimensions/packaging/images need confirmation |

Variants:

| Variant | SKU | Stock | Reserved | Available |
| --- | --- | ---: | ---: | --- |
| ONE SIZE | `GM-EYEWEAR-BLK-ONE` | 0 | 0 | false |

Readiness score: Needs images, specs, certification, dimensions, and stock. Not launch-ready.

### Sandbox product

The Tpay sandbox product is intentionally separate from the real catalog:

- Product ID: `prod-tpay-sandbox-test`
- Variant ID: `var-tpay-sandbox-test-one-size`
- Price: 1.00 PLN
- Status: active
- Visibility: hidden
- Category/drop: none
- Stock: 1
- Reserved: 0
- Public PL/EN product routes: 404

## Part 4: Frontend readiness audit

Homepage:

- No homepage files were changed during this audit.
- Homepage remains editorial/pre-launch.

Footer/legal links:

- Footer legal/help links exist for PL and EN.
- Legal, delivery, returns, privacy, terms, and contact routes return `200`.

Collection/product/cart/checkout:

- `/kolekcja` and `/en/collection` return `200` and remain editorial/gated.
- Hidden product routes return `404`.
- `/koszyk`, `/checkout`, `/en/cart`, and `/en/checkout` return `200` as gated/pre-launch pages.
- Cart POST blocks hidden sandbox product with `400`.
- Product pages for hidden real products and sandbox product are inaccessible publicly.

Noindex behavior:

- Admin is noindex.
- Cart/checkout metadata uses noindex helpers.
- Product pages return 404 while products are hidden.
- Sitemap does not include hidden products/cart/checkout/admin.

Frontend quality:

- Visual direction is coherent: black/white, restrained, editorial, minimal.
- The pre-launch state feels premium and intentional.
- Cart/checkout pages are prepared structurally but intentionally inert while pre-launch.
- Weak spots before public sales:
  - Product detail pages cannot be judged fully until images and final copy exist.
  - Legal/help pages are visibly draft-like because placeholders are still present.
  - Checkout copy mentions payment readiness but real payment testing is blocked.
  - Product/collection launch state should get final visual QA once images are uploaded and products are made visible in staging only.

Mobile responsiveness:

- The code uses responsive grids and mobile navigation.
- A full browser/device visual pass was not performed in this audit.
- Before launch, test iPhone-width and desktop-width flows for homepage, collection, product detail, cart, checkout, legal pages, and admin order details.

## Part 5: Payments readiness audit

Payment state:

- Stripe is not used by the payment adapter.
- Default payment provider is Tpay.
- Tpay adapter exists.
- Tpay sandbox API base is `https://openapi.sandbox.tpay.com`.
- Tpay secure/certificate base is `https://secure.sandbox.tpay.com`.
- Webhook route exists at `/api/payments/webhook/[provider]`.
- Tpay webhook verification uses JWS signature validation and certificate/root verification.
- Tpay classic form transaction notifications are supported for sandbox payment notifications.
- Tpay success responses use plain text `TRUE`, as required by the sandbox panel.
- Webhook certificate URL origin is checked against the expected Tpay secure origin.
- Unsupported JWS algorithm is rejected.
- Amount and currency validation exist before committing payment state.
- PaymentWebhookEvent provides provider-event idempotency.
- Duplicate webhook protection exists.
- Paid webhook commits reserved stock exactly once.
- Failed/cancelled/expired webhook releases active reservations.
- Payment provider creation happens after DB checkout creation; if provider creation fails, checkout code releases reservations.

Sandbox evidence:

- OAuth diagnostic succeeded with form-body `client_id` + `client_secret`.
- Hidden sandbox checkout returned a Tpay `paymentUrl`.
- Tpay sandbox panel marked transaction `TR-528F-F004PX` as paid/correct.
- Tpay delivered a classic form webhook for order `GM-2026-0003`.
- Webhook verification accepted the notification after sandbox credential, merchant id and classic response-format fixes.
- Order `GM-2026-0003` is `paymentStatus=paid`, `fulfillmentStatus=packing`, and has `paidAt` filled.
- The paid webhook committed the hidden sandbox variant exactly once: stock moved from `1` to `0`, reserved moved from `1` to `0`.
- Tpay received plain text `TRUE`.
- The paid test order is preserved as audit evidence. The sandbox fixture was reset afterward to hidden `stockQuantity=1`, `reservedQuantity=0`.

Remaining Tpay action:

1. Keep Preview on `TPAY_ENV=sandbox`.
2. Do not configure production Tpay until product/legal/stock readiness is complete.
3. Configure production credentials only in Production during launch rehearsal.
4. Run one controlled low-value live payment and webhook replay before public launch.

## Part 6: Delivery readiness audit

Current delivery settings:

| Method | Status | Price | Provider | Estimate |
| --- | --- | ---: | --- | --- |
| InPost Paczkomat | Enabled | 14.99 PLN | inpost | 1-3 dni robocze |
| Kurier | Enabled | 17.99 PLN | inpost | 1-3 dni robocze |
| Odbior osobisty | Disabled | 0.00 PLN | manual | Do ustalenia |

Delivery readiness:

- InPost Paczkomat method exists.
- Courier method exists.
- Manual pickup placeholder is disabled.
- Prices are stored in settings and admin-editable.
- Free shipping threshold exists: 499.00 PLN.
- Delivery page reflects current placeholder status and lists items to complete.
- Checkout delivery selector is ready but gated by pre-launch state.
- Admin can update order/payment/fulfillment/delivery statuses.
- Tracking number can be saved.
- InPost tracking URL helper exists.
- Shipped email can include tracking URL.
- InPost provider architecture exists with sandbox/prod config separation, safe diagnostics, shipment creation, label, tracking and cancel action support.
- Parcel locker search endpoint exists at `/api/delivery/inpost/parcel-lockers`.
- InPost sandbox credentials and real sandbox label/tracking verification are still pending.

Remaining before launch:

- Decide whether manual fulfillment is enough for DROP 01.
- Or obtain InPost API credentials and test label/tracking flow.
- Test real tracking numbers.
- Test shipped email to admin-only recipient.
- Finalize delivery prices and timing.
- Finalize return address.

## Part 7: Email readiness audit

Implemented templates:

- `order_created`
- `payment_pending`
- `payment_confirmed`
- `payment_failed`
- `order_shipped`
- `return_requested`
- `complaint_submitted`
- `newsletter_confirmation`
- `early_access_invitation`

Email readiness:

- `EmailEvent` table exists.
- Email logs can persist.
- Resend integration exists.
- Stable Preview has Resend env vars configured:
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`,
  `EMAIL_TEST_MODE` and `EMAIL_TEST_RECIPIENT`.
- Missing `RESEND_API_KEY` or `RESEND_FROM_EMAIL` skips safely.
- Admin email preview exists.
- Admin test send restrictions exist.
- Preview test sends require `EMAIL_TEST_RECIPIENT` and do not use arbitrary typed recipients.
- Preview admin-only test sends passed through Resend for `order_created`,
  `payment_confirmed`, `order_shipped` and `newsletter_confirmation`.
- Passed test sends created `EmailEvent` rows with status `sent`, provider
  `resend`, masked recipient, provider message id present, `sentAt` present and
  `errorSummary=null`.
- Order-related test sends are linked to the real paid audit order
  `GM-2026-0003`; `newsletter_confirmation` has `orderId=null`.
- Dynamic content escaping exists.
- Duplicate-send prevention exists for order lifecycle templates where implemented.
- Legal footer/support copy exists in rendered emails.
- No raw provider payloads, secrets, tokens or headers are stored in
  `EmailEvent`.
- No real customer emails were sent during this audit.

Remaining before launch:

- Keep Preview test sends routed only to `EMAIL_TEST_RECIPIENT`.
- Confirm/maintain sender domain DNS verification in Resend.
- Visually review every remaining template not included in the passed send set.
- Verify order lifecycle emails in staging.
- Configure Production Resend envs only during the approved production launch
  rehearsal.
- Consider Resend idempotency headers/webhook delivery tracking later.

## Part 8: Legal and compliance readiness audit

Readiness status:

- `sellerDataStatus=pending`
- `legalStatus=pending`
- `businessRegistrationStatus=unregistered_activity_planned`
- First drop is planned under działalność nierejestrowana / unregistered activity.
- Seller/legal data is not ready because seller identity, address, return/contact data and final legal pages are still pending.
- Public checkout must not launch until seller details, legal pages, revenue-limit controls and product readiness are completed.

Checked pages:

- `/regulamin`
- `/polityka-prywatnosci`
- `/zwroty-i-reklamacje`
- `/dostawa`
- `/kontakt`
- `/en/terms`
- `/en/privacy-policy`
- `/en/returns-complaints`
- `/en/delivery`
- `/en/contact`

Current status:

- Pages exist and return `200`.
- They are explicitly draft/pre-launch/pending documents.
- They contain required topic coverage, but not final legal data.
- They now include a draft/pending notice where applicable.

Placeholders still requiring final data:

- Seller legal name.
- NIP.
- REGON, if applicable.
- Registered address.
- Contact/support email confirmation.
- Return address.
- Complaint contact.
- Withdrawal form details.
- Complaint response rules.
- Final payment operator legal details.
- Final delivery operator details.
- Delivery prices and free shipping threshold confirmation.
- Delivery timing confirmation.
- Privacy data controller legal name.
- Privacy controller address.
- Privacy contact email.
- Legal bases for processing.
- Retention periods.
- Analytics/marketing cookie details if tools are introduced.
- Newsletter consent wording and processing basis.
- Gross PLN price/legal presentation review.
- Lowest price in last 30 days process for promotions.

Do not treat legal documents as final until reviewed.
Do not add fake seller data or publish final legal/seller claims before business registration and seller details are confirmed.

## Part 9: Security and privacy audit

Ready:

- Admin token auth exists.
- Customer account local/Preview auth exists with server-side password hashing,
  HttpOnly session cookie, account route rate limiting, CSRF token checks on
  state-changing account endpoints and a Production-safe account feature flag.
- Customer dev seed/test account is isolated outside the core auth module and
  guarded from Production by the account mode/runtime checks.
- Admin token comparison uses `timingSafeEqual` with length check.
- Admin noindex exists.
- Admin API is guarded.
- Image upload route is admin guarded.
- Diagnostics avoid raw secret values.
- Database URL is not exposed.
- Tpay credentials are not exposed.
- Resend credentials are not exposed.
- Public product queries sanitize catalog visibility and exclude hidden/draft/sandbox products.
- Internal notes are not part of public catalog while products are hidden.
- Reserved stock is not exposed publicly while catalog is gated.
- Newsletter has validation/rate-limit related code paths.
- Cookie consent UI exists.

Risks/recommendations:

- Admin token auth is simple bearer-token security. Keep token long, random, and rotated before launch; consider stronger auth later.
- Add admin audit trail for changes before broader team access.
- Verify all admin diagnostics from Preview after env changes.
- Complete privacy/cookie policy if analytics or marketing tags are enabled.
- Confirm no Vercel Preview deployment protection conflicts with admin testing.
- Account route rate limiting is currently in-memory and suitable for
  local/Preview only; replace or back it with edge/Redis rate limiting before
  public production auth.
- Customer account Production launch still needs production email rehearsal,
  abuse monitoring and final CSRF/rate-limit/privacy review.
- Consider rate limiting checkout/newsletter/returns/complaints endpoints at the edge before launch.

## Part 10: Launch sequence proposal

### Phase 1: Content completion

- Upload final product images.
- Set primary image for every real product.
- Add meaningful alt text.
- Finalize product descriptions.
- Finalize materials/composition/specs.
- Finalize size guide measurements.
- Finalize stock by variant.
- Finalize delivery prices.
- Finalize seller/legal data.
- Finalize return address.

### Phase 2: Provider setup

- Tpay sandbox OAuth/transaction/webhook test is complete.
- Preserve `GM-2026-0003` as paid sandbox audit evidence.
- Configure Resend sender domain.
- Send admin-only test emails.
- Decide InPost API versus manual fulfillment for DROP 01.

### Phase 3: Staging test

- Use hidden real product or sandbox-only product in admin-token test mode.
- Run checkout with Tpay sandbox payment.
- Open `paymentUrl`.
- Complete sandbox payment.
- Verify webhook paid order.
- Verify `paymentStatus=paid`.
- Verify `fulfillmentStatus=packing`.
- Verify stock/reserved stock commit.
- Reset only the hidden sandbox fixture between future tests; do not alter the paid audit order.
- Test shipped email with tracking number.
- Test return request.
- Test complaint request.
- Verify admin order handling.

### Phase 4: Production prep

- Verify production envs.
- Run production DB migrations.
- Configure production Tpay credentials.
- Configure production Resend envs.
- Confirm production `CHECKOUT_TEST_MODE=false`.
- Keep products hidden until launch moment.
- Run low-value live payment test only after sandbox success.
- Prepare backup/export plan.
- Confirm logs/monitoring process.

### Phase 5: Controlled launch

- Set final products active/visible.
- Set DROP 01 live.
- Set `shopEnabled=true`.
- Set `shopMode=PUBLIC_DROP`.
- Remove noindex where appropriate.
- Monitor orders, payments, stock, webhooks, and emails.
- Keep first drop controlled.

Do not execute these phases until blockers are resolved.

## Part 11: Risk table

| Area | Status | Risk | Issue | Recommended fix | Owner/action |
| --- | --- | --- | --- | --- | --- |
| Payments | Sandbox passed | Medium | Production Tpay credentials and live low-value test are not configured/tested. | Configure production only during launch rehearsal and run one controlled low-value live payment. | Tpay/support + site owner |
| Database | Ready | Low | Migrations applied; no pending migrations. | Continue migration discipline before production. | Engineering |
| Admin | Mostly ready | Medium | Token auth is simple; no full admin identity/audit trail. | Keep long token, rotate before launch, consider stronger auth/audit trail. | Engineering |
| Products | Not ready | High | Images missing, stock zero, specs placeholders. | Complete product content, images, specs, stock. | Brand/ops |
| Stock/inventory | Staging verified | Medium | Sandbox stock commit passed; real product stock still must be finalized. | Set real launch stock and run final launch rehearsal. | Engineering/ops |
| Delivery | Partial | Medium | InPost API architecture exists, but sandbox credentials and real label/tracking tests are pending; final details missing. | Decide manual vs InPost API, configure sandbox credentials, test labels/tracking, finalize prices/times/return address. | Ops |
| Email | Staging passed | Low | Preview test sends passed; Production envs and final launch rehearsal remain pending. | Configure Production Resend only during approved launch rehearsal and run final controlled email check. | Engineering/ops |
| Legal | Draft | High | Seller/tax/address/GDPR/operator details incomplete. | Complete and legally review docs. | Owner/legal |
| Frontend | Good pre-launch | Medium | Product launch UI not visually validated with real images/content. | QA product/detail/cart/checkout once content exists. | Design/engineering |
| SEO | Safe pre-launch | Medium | Robots allows all public pages; product visibility gating currently protects hidden products. | Re-check noindex/indexing at launch transition. | Engineering |
| Security | Good baseline | Medium | Public form rate limiting and admin hardening can improve. | Add/confirm edge rate limits and stronger admin plan. | Engineering |
| Customer account | Preview functional | Medium | Local/Preview account has auth, sessions, CSRF and in-memory rate limits; production password reset and email verification are still missing. | Keep Production account in placeholder mode until production auth checklist is complete. | Engineering |
| Operations | Partial | High | No documented live incident/refund/export/backup runbook. | Create first-drop operations runbook. | Ops/engineering |

## Part 12: Provider checklist

Tpay:

- Sandbox Open API Client ID/Secret were configured in Preview.
- Sandbox merchant/account ID was configured in Preview.
- Sandbox security code was configured in Preview.
- OAuth on `openapi.sandbox.tpay.com` passed.
- Transaction creation on `openapi.sandbox.tpay.com` passed.
- Classic Tpay form webhook passed and returned `TRUE`.
- Audit order `GM-2026-0003` proves sandbox checkout/payment/webhook/stock commit.
- Next: only after product/legal/stock readiness, prepare production credentials and low-value live test.

Resend:

- Preview envs are configured: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
  `RESEND_REPLY_TO`, `EMAIL_TEST_MODE` and `EMAIL_TEST_RECIPIENT`.
- Admin-only Preview test sends passed for `order_created`,
  `payment_confirmed`, `order_shipped` and `newsletter_confirmation`.
- Passed sends are recorded in `EmailEvent` with status `sent`, provider
  `resend`, provider message id present, `sentAt` present and no error summary.
- Order-related test events link to `GM-2026-0003`; newsletter confirmation has
  no order link.
- Continue sending Preview tests only to `EMAIL_TEST_RECIPIENT`.
- Before production launch, configure Production Resend envs only during the
  approved launch rehearsal and run one controlled final email check.

Delivery/InPost:

- Decide manual first-drop fulfillment versus InPost API.
- If InPost API: obtain credentials and test shipment/tracking/labels through the admin shipment actions.
- If manual: write exact packing/shipping/tracking SOP.

## Product checklist

For each real product:

- Final images uploaded.
- Primary image selected.
- Alt text complete.
- Product name confirmed.
- Slug confirmed.
- Price confirmed.
- Category confirmed.
- DROP 01 assignment confirmed.
- Final short description.
- Final editorial description.
- Final technical description.
- Final material/composition.
- Final fit.
- Final color.
- Final care instructions.
- Final size guide measurements.
- Final product weight.
- Final packaging weight.
- Final package contents.
- Final country of manufacture.
- SEO title.
- SEO description.
- Internal notes cleaned.
- Variant SKUs confirmed.
- Stock quantities set.
- Variants set available where stock exists.
- Product status changed only at launch.
- Product visibility changed only at launch.

## Legal checklist

- Seller legal name.
- NIP.
- REGON, if applicable.
- Registered address.
- Return address.
- Support/contact email.
- Complaint contact.
- Withdrawal form details.
- Return procedure.
- Complaint procedure and response timing.
- Payment operator legal details.
- Delivery operator legal details.
- Delivery pricing/timing.
- 14-day withdrawal rights.
- Privacy/GDPR controller details.
- Processing legal bases.
- Data retention periods.
- Newsletter consent.
- Cookie policy and consent handling.
- Gross PLN pricing review.
- Lowest price in last 30 days process for promotions.
- Legal review completed.

## Exact next actions

1. Preserve the passed Tpay sandbox audit order `GM-2026-0003` and keep the hidden sandbox product reset.
2. Keep Preview Resend test sends limited to `EMAIL_TEST_RECIPIENT`.
3. Visually review remaining email templates not included in the passed send set.
4. Upload final product images and complete product specs/size guides.
5. Finalize stock quantities and variant availability.
6. Complete legal/seller/return/privacy data and get legal review.
7. Decide manual fulfillment versus InPost API for DROP 01.
8. Run full staging order lifecycle test: checkout, payment, packing, shipped, delivered, return, complaint.
9. Prepare production env checklist and backup/export runbook, including Production Resend envs.
10. Only after staging success, plan controlled production launch.

## 2026-06-29 public account e-mail and rate-limit readiness update

Customer account remains intended as a public storefront feature, but guest
checkout must remain available. The current account flow is safe for
local/Preview testing and closer to production readiness, with these explicit
conditions:

- Account e-mail templates exist for `account_verification`, `password_reset`,
  `password_changed` and `account_deletion_requested`.
- Account e-mails use the shared Resend sender pipeline and record `EmailEvent`
  rows for sent, queued, skipped or failed outcomes.
- Missing Resend configuration must continue to skip safely; no account e-mail
  flow may pretend delivery succeeded without provider config.
- Official support/reply-to contact: `studio@garconmaires.com`.
- Do not change the production sender until the Garconmaires sending domain is
  verified in Resend.
- Preview/staging e-mail rehearsal requires:
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`,
  `EMAIL_TEST_MODE=true` and `EMAIL_TEST_RECIPIENT`.
- Public production account e-mail rehearsal must cover verification, password
  reset, password changed and account deletion request messages before
  `CUSTOMER_ACCOUNT_MODE=enabled` is allowed on production.
- Account rate limiting now has a durable-storage adapter path. Local/Preview
  can use in-memory storage, but production public auth requires Redis/KV REST
  envs before launch.
- Durable rate-limit envs accepted by the app:
  `ACCOUNT_RATE_LIMIT_REDIS_REST_URL` and
  `ACCOUNT_RATE_LIMIT_REDIS_REST_TOKEN`, or Vercel/Upstash-compatible
  `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or
  `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- If durable rate-limit storage fails in production, account endpoints fail
  closed with `503` instead of silently falling back to memory.
- Production auth remains blocked until durable rate limiting, staging e-mail
  rehearsal, final CSRF/security review, login abuse monitoring and privacy
  review are complete.

## Verification commands

Commands run for this audit:

```bash
npx prisma validate
npx prisma generate
npx tsc --noEmit --incremental false
npm test
npm run lint
npm run build
```

Results:

- `prisma validate`: passed.
- `prisma generate`: passed.
- `tsc --noEmit --incremental false`: passed.
- `npm test`: passed, 53 tests.
- `npm run lint`: passed.
- `npm run build`: passed after allowing network access for Google Fonts used by `next/font`.

## Final audit conclusion

Garconmaires is safe in pre-launch and ready for continued staging work. It is not ready for real sales until product content/images/stock, legal documents, business registration/seller data, production provider setup, and delivery operations are completed and verified.

Keep the current safe state until then:

- `shopEnabled=false`
- `shopMode=PRE_LAUNCH`
- `sellerDataStatus=pending`
- `legalStatus=pending`
- `businessRegistrationStatus=unregistered_activity_planned`
- real products hidden/draft
- visible products `0`
- no production payment tests
- no fake payment success
- no public product exposure
