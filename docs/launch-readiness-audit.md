# Garconmaires launch readiness audit

Audit date: 2026-06-09  
Stable staging: https://garconmaires-tpay-staging.vercel.app  
Admin: https://garconmaires-tpay-staging.vercel.app/admin

## Executive summary

Garconmaires is technically close to a controlled staging launch flow, but it is not ready for real sales yet.

The backend foundation is in place: Postgres storage, Prisma migrations, hidden/draft product data, inventory reservations, order/payment/delivery/returns/complaints models, EmailEvent logging, admin diagnostics, gated public catalog, and Tpay integration are implemented. Staging remains safe: `shopEnabled=false`, `shopMode=PRE_LAUNCH`, visible products are `0`, DROP 01 is draft, and all real products are hidden/draft.

The main blocker is external provider readiness. Tpay sandbox checkout reaches OAuth, but current sandbox credentials return `401 invalid_client`. Real payment testing must remain paused until Tpay provides valid sandbox Open API Client ID and Secret for `openapi.sandbox.tpay.com`.

The second launch blocker is commercial content/legal readiness. Product images are missing, real products have zero stock, specs and size guides still contain placeholders, and legal pages still require final seller, tax, address, delivery, payment, return, complaint, privacy, and GDPR details.

## Readiness score

Overall launch readiness: 62/100.

Area scores:

| Area | Score | Status |
| --- | ---: | --- |
| Technical build and deployment | 90 | Ready for staging |
| Database and migrations | 95 | Ready |
| Admin and operations | 82 | Mostly ready |
| Product catalog safety | 90 | Safe pre-launch |
| Product content | 35 | Not launch-ready |
| Payments | 55 | Implemented, externally blocked |
| Delivery | 70 | Manual-ready, InPost API not live |
| Email | 72 | Templates/logging ready, provider config/test pending |
| Legal/compliance | 35 | Draft only |
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
- No production deploy was performed during this audit.
- No Tpay payment tests were run during this audit.
- No real customer emails were sent during this audit.

## Blockers

1. Tpay sandbox credentials are invalid for the sandbox Open API.
   - Observed known result: `401 invalid_client`.
   - Likely cause: current Client ID / Secret are not valid for `openapi.sandbox.tpay.com` or sandbox Open API access is not activated.

2. Real products are not launch-ready.
   - No product images are attached.
   - Stock is `0` for all real variants.
   - Variants are not available.
   - Specs, materials, dimensions, care, model sizing, and size guides still contain placeholders.

3. Legal documents are draft only.
   - Seller legal name, NIP, REGON, registered address, return address, complaint contact, payment operator details, delivery operator details, privacy/GDPR legal bases, retention periods, and final return/complaint rules must be completed and reviewed.

4. Email provider is not launch-ready until configured and tested.
   - `EmailEvent` exists and templates are implemented.
   - Real sending still requires Resend API key, verified sender/domain, and admin-only test sends.

5. Delivery is operationally incomplete.
   - InPost methods and tracking URL helper exist, but no live InPost API credentials or label creation test are complete.
   - Manual fulfillment decision, final prices/times, and return address must be finalized.

## Must-fix before launch

- Obtain valid Tpay sandbox Open API credentials and complete a real sandbox checkout/webhook test.
- Finish product images for each launch product and set primary images with useful alt text.
- Finalize all product specs, material/composition, fit, color, care instructions, measurements, weights, packaging contents, and country of manufacture.
- Set final stock quantities and availability for launch variants.
- Complete and legally review Polish and English legal pages.
- Configure Resend sender domain and run admin-only transactional email tests.
- Decide InPost API versus manual first-drop fulfillment.
- Confirm final delivery prices, estimated delivery windows, and return address.
- Run a full hidden-product staging checkout test after Tpay sandbox credentials are fixed.
- Only after successful sandbox test, prepare production envs and a low-value live payment test.

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
| Email events | 0 |
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
- Webhook certificate URL origin is checked against the expected Tpay secure origin.
- Unsupported JWS algorithm is rejected.
- Amount and currency validation exist before committing payment state.
- PaymentWebhookEvent provides provider-event idempotency.
- Duplicate webhook protection exists.
- Paid webhook commits reserved stock exactly once.
- Failed/cancelled/expired webhook releases active reservations.
- Payment provider creation happens after DB checkout creation; if provider creation fails, checkout code releases reservations.

Known blocker:

- Tpay OAuth returns `401 invalid_client`.
- Current Client ID / Secret appear invalid for `openapi.sandbox.tpay.com` or sandbox API access is not activated.

Required Tpay action:

1. Contact Tpay and ask for sandbox Open API Client ID and Secret.
2. Ask Tpay to confirm sandbox account/API activation.
3. Ask Tpay to confirm permissions for OAuth token creation and transaction creation on `openapi.sandbox.tpay.com`.
4. Update Vercel Preview only:
   - `TPAY_API_KEY`
   - `TPAY_API_SECRET`
5. Keep `TPAY_ENV=sandbox`.
6. Redeploy Preview.
7. Confirm readiness panel is green.
8. Reset the sandbox product.
9. Run hidden admin-token checkout.
10. Open returned `paymentUrl`.
11. Complete sandbox payment.
12. Verify signed webhook marks order paid and inventory committed.
13. Only after sandbox success consider a low-value live payment test.

No payment tests were run during this audit.

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
- InPost adapter type placeholder exists, but live API integration is not implemented/tested.

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
- Current staging email event count is `0`.
- Resend integration exists.
- Missing `RESEND_API_KEY` or `RESEND_FROM_EMAIL` skips safely.
- Admin email preview exists.
- Admin test send restrictions exist.
- Dynamic content escaping exists.
- Duplicate-send prevention exists for order lifecycle templates where implemented.
- Legal footer/support copy exists in rendered emails.
- No real emails were sent during this audit.

Remaining before launch:

- Configure `RESEND_API_KEY`.
- Configure `RESEND_FROM_EMAIL`.
- Configure `RESEND_REPLY_TO` if needed.
- Verify sender domain DNS in Resend.
- Send test emails to admin-only/test recipient.
- Visually review every template.
- Verify order lifecycle emails in staging.
- Consider Resend idempotency headers/webhook delivery tracking later.

## Part 8: Legal and compliance readiness audit

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
- They are explicitly draft/pre-launch documents.
- They contain required topic coverage, but not final legal data.

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

## Part 9: Security and privacy audit

Ready:

- Admin token auth exists.
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

- Obtain Tpay sandbox credentials.
- Complete Tpay sandbox OAuth/transaction test.
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
| Payments | Blocked | Blocker | Tpay OAuth returns `401 invalid_client`. | Get valid sandbox Open API Client ID/Secret and API activation from Tpay. | Tpay/support + site owner |
| Database | Ready | Low | Migrations applied; no pending migrations. | Continue migration discipline before production. | Engineering |
| Admin | Mostly ready | Medium | Token auth is simple; no full admin identity/audit trail. | Keep long token, rotate before launch, consider stronger auth/audit trail. | Engineering |
| Products | Not ready | High | Images missing, stock zero, specs placeholders. | Complete product content, images, specs, stock. | Brand/ops |
| Stock/inventory | Ready in code | Medium | Needs real concurrent staging checkout after Tpay works. | Run sandbox checkout and webhook test. | Engineering |
| Delivery | Partial | Medium | InPost API not live/tested; final details missing. | Decide manual vs InPost API, finalize prices/times/return address. | Ops |
| Email | Partial | Medium | Resend config/domain/test sends pending. | Configure Resend, verify DNS, test admin-only sends. | Engineering/ops |
| Legal | Draft | High | Seller/tax/address/GDPR/operator details incomplete. | Complete and legally review docs. | Owner/legal |
| Frontend | Good pre-launch | Medium | Product launch UI not visually validated with real images/content. | QA product/detail/cart/checkout once content exists. | Design/engineering |
| SEO | Safe pre-launch | Medium | Robots allows all public pages; product visibility gating currently protects hidden products. | Re-check noindex/indexing at launch transition. | Engineering |
| Security | Good baseline | Medium | Public form rate limiting and admin hardening can improve. | Add/confirm edge rate limits and stronger admin plan. | Engineering |
| Operations | Partial | High | No documented live incident/refund/export/backup runbook. | Create first-drop operations runbook. | Ops/engineering |

## Part 12: Provider checklist

Tpay:

- Get sandbox Open API Client ID.
- Get sandbox Open API Secret.
- Confirm sandbox merchant/account ID.
- Confirm sandbox account/API activation.
- Confirm OAuth permission for `openapi.sandbox.tpay.com`.
- Confirm transaction creation permission for `openapi.sandbox.tpay.com`.
- Update Vercel Preview `TPAY_API_KEY`.
- Update Vercel Preview `TPAY_API_SECRET`.
- Keep `TPAY_ENV=sandbox`.
- Redeploy Preview.
- Run real sandbox checkout and webhook test.
- Only after sandbox success, prepare production credentials and low-value live test.

Resend:

- Configure `RESEND_API_KEY`.
- Configure `RESEND_FROM_EMAIL`.
- Configure `RESEND_REPLY_TO`.
- Verify sender domain DNS.
- Send admin-only test email.
- Review template rendering.

Delivery/InPost:

- Decide manual first-drop fulfillment versus InPost API.
- If InPost API: obtain credentials and test shipment/tracking/labels.
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

1. Ask Tpay for sandbox Open API Client ID and Secret valid for `openapi.sandbox.tpay.com`.
2. Ask Tpay to confirm sandbox OAuth and transaction creation are enabled.
3. Update Vercel Preview `TPAY_API_KEY` and `TPAY_API_SECRET`.
4. Redeploy Preview and confirm readiness panel is green.
5. Reset the Tpay sandbox product.
6. Run the hidden admin-token Tpay sandbox checkout.
7. Complete payment manually in Tpay sandbox and verify signed webhook paid state.
8. Configure Resend sender domain and envs in Preview.
9. Send admin-only test emails and review all templates.
10. Upload final product images and complete product specs/size guides.
11. Finalize stock quantities and variant availability.
12. Complete legal/seller/return/privacy data and get legal review.
13. Decide manual fulfillment versus InPost API for DROP 01.
14. Run full staging order lifecycle test: checkout, payment, packing, shipped, delivered, return, complaint.
15. Prepare production env checklist and backup/export runbook.
16. Only after staging success, plan controlled production launch.

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

Garconmaires is safe in pre-launch and ready for continued staging work. It is not ready for real sales until payment credentials, product content/images/stock, legal documents, email provider setup, and delivery operations are completed and verified.

Keep the current safe state until then:

- `shopEnabled=false`
- `shopMode=PRE_LAUNCH`
- real products hidden/draft
- visible products `0`
- no production payment tests
- no fake payment success
- no public product exposure
