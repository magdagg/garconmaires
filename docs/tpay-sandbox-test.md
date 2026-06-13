# Tpay sandbox test record

Status: passed on Preview/Staging, 2026-06-13.

Stable staging URLs:

- Admin: `https://garconmaires-tpay-staging.vercel.app/admin`
- Checkout: `https://garconmaires-tpay-staging.vercel.app/api/checkout`
- Webhook: `https://garconmaires-tpay-staging.vercel.app/api/payments/webhook/tpay`

## Successful flow

- OAuth diagnostic succeeded using Open API form body `client_id` + `client_secret`.
- Hidden admin-only checkout created a Tpay sandbox transaction.
- Tpay returned a `paymentUrl`.
- Sandbox payment was completed in the Tpay panel.
- Tpay sent the transaction notification to the staging webhook URL.
- The app accepted the classic Tpay form webhook after validating merchant id,
  security code hash, order reference, amount and currency.
- Tpay received plain text `TRUE`.
- Order `GM-2026-0003` / `TR-528F-F004PX` became `paymentStatus=paid`.
- `paidAt` is filled and `fulfillmentStatus=packing`.
- The hidden sandbox variant stock committed exactly once:
  `stockQuantity` moved from `1` to `0`, `reservedQuantity` moved from `1` to `0`.
- The paid order is preserved as audit evidence.

Do not store raw credentials, webhook secrets, md5 hashes, signatures, access
tokens or raw payloads in docs or logs.

## Fixes confirmed by this test

- Sandbox Open API credentials are valid for `openapi.sandbox.tpay.com`.
- `TPAY_MERCHANT_ID` matches the sandbox merchant/account id.
- `TPAY_WEBHOOK_SECRET` matches the Tpay sandbox `Kod bezpieczeństwa`.
- Classic form notifications are supported in addition to JWS JSON webhooks.
- Successful Tpay webhook responses use exact plain text `TRUE`.
- Duplicate paid webhook handling remains idempotent and must not double-commit
  stock.

## Fixture reset

After preserving the paid audit order, only the hidden sandbox product fixture
may be reset for future tests:

- Product: `prod-tpay-sandbox-test`
- Variant: `var-tpay-sandbox-test-one-size`
- Keep `isVisible=false`
- Set `stockQuantity=1`
- Set `reservedQuantity=0`
- Release only stale active reservations for this variant
- Do not alter paid order `GM-2026-0003`

This reset is a test fixture reset, not a reversal of the paid audit order.

## Remaining Tpay work

Tpay production is not configured or tested. Before public launch:

- keep Preview on `TPAY_ENV=sandbox`
- configure production credentials only in Production during launch rehearsal
- keep `CHECKOUT_TEST_MODE=false` in Production
- run one controlled low-value live payment after legal, product, stock and
  delivery readiness are complete
