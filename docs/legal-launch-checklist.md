# Polish ecommerce legal launch checklist

This checklist is a launch-preparation aid for Garçonmaires. It is draft
operational documentation, not legal advice. Final wording should be reviewed by
a Polish ecommerce/GDPR specialist before public sales.

## 2026-06-25 safety update

- The ecommerce readiness audit is complete with a current public launch score
  of 56/100.
- Public legal/help pages must remain visible only as draft/pending information
  until seller data, return/contact data and final legal wording are confirmed.
- Business model update: first drop is planned under Polish działalność
  nierejestrowana / unregistered activity, not JDG for now.
- Hardcoded seller/address copy was neutralized in `lib/store-pages.ts`; do not
  reintroduce seller name, legal address, return address, NIP, REGON or tax
  claims without confirmed source data.
- The admin now includes a Preview-only Launch Readiness dashboard that blocks
  launch activation controls while Critical blockers exist.

## 2026-06-28 customer account security update

- Customer account is functional for local/Preview testing and is intended to
  become a public storefront feature after the production auth blockers are
  resolved.
- Guest checkout must remain available even after customer account launch.
- Production account access can remain in placeholder mode via
  `CUSTOMER_ACCOUNT_MODE=placeholder` or `ACCOUNT_ENABLED=false` until the
  public-account checklist is complete.
- Production account access may be enabled later with
  `CUSTOMER_ACCOUNT_MODE=enabled` only after security, privacy and operational
  blockers are cleared.
- Local/Preview account endpoints now have minimal in-memory rate limiting and
  CSRF protection for state-changing account requests.
- Account production-readiness implementation now includes password reset,
  e-mail verification tokens, password-changed notification, logout from all
  devices, expired-session cleanup helper and an account deletion request flow.
- The dev/test customer seed is isolated outside the core auth module and must
  not be enabled in Production.
- Production auth remains pending until durable/edge-backed rate limiting,
  final CSRF review, abuse monitoring, final privacy/legal review and a
  dedicated security review are complete.
- Guest checkout and order-status lookup remain independent from customer
  account availability.
- Account order history currently uses the customer's verified account e-mail to
  show matching orders, including earlier guest orders made with the same
  e-mail. This is acceptable for the first public account stage, but a dedicated
  order-to-account relation can be added later if needed.

## 2026-06-29 public account e-mail/rate-limit update

- Public account remains the target state, but guest checkout remains mandatory
  and must not be removed.
- Official account support/reply-to e-mail:
  `studio@garconmaires.com`.
- Account e-mail templates are prepared for verification, password reset,
  password changed and account deletion request.
- Missing `RESEND_API_KEY` or `RESEND_FROM_EMAIL` must result in
  `email skipped / missing env`, not a fake success state.
- Preview/staging account e-mail rehearsal must verify:
  `account_verification`, `password_reset`, `password_changed` and
  `account_deletion_requested` with `EMAIL_TEST_RECIPIENT`.
- Production Resend requirements before public account:
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, verified sender
  domain, and documented rehearsal results.
- Account rate limiting can run in-memory locally, but production public auth
  requires durable/edge-backed storage.
- Supported durable rate-limit env options:
  `ACCOUNT_RATE_LIMIT_REDIS_REST_URL` +
  `ACCOUNT_RATE_LIMIT_REDIS_REST_TOKEN`, or `KV_REST_API_URL` +
  `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` +
  `UPSTASH_REDIS_REST_TOKEN`.
- Admin Launch Readiness must continue to treat in-memory account rate limiting
  as a blocker for public production auth.

Public account blockers before `CUSTOMER_ACCOUNT_MODE=enabled` in Production:

- Durable/edge-backed rate limiting instead of in-memory rate limiting.
- Password reset end-to-end verified with staging and production Resend config.
- E-mail verification end-to-end verified with staging and production Resend
  config.
- Password-changed and account-deletion request emails verified in staging.
- Final CSRF review for all state-changing account and account-service flows.
- Login/abuse monitoring and alerting.
- Session expiry cleanup job or operational cleanup process.
- Final password policy review.
- Account deletion/anonymization process legally confirmed.
- Privacy policy update covering customer accounts, sessions, addresses, order
  history and deletion requests.

Customer account privacy/data notes: DRAFT / TO CONFIRM.

- Account data processed: e-mail, password hash, first name, last name, phone,
  marketing consent, e-mail verification status, saved addresses, sessions,
  order history by matching account e-mail and customer-service requests.
- Session/cookie data: `gm_customer_session` stores an opaque session token in
  an HttpOnly cookie; only the hash is stored server-side.
- Reset/verification tokens are stored only as hashes with expiry and used-at
  timestamps.
- Account deletion request sets the account to pending deletion and removes
  active sessions. Order records may remain where required for accounting,
  consumer claims, fraud prevention or legal obligations. Final anonymization
  scope: TO CONFIRM.
- Unverified accounts may exist and use the account panel in Preview. Before
  public launch, decide whether unverified accounts can place logged-in orders
  or should be asked to use guest checkout until verification. TO CONFIRM.

## 2026-06-29 legal/checkout readiness pass

Current legal and checkout state:

- Public legal/help pages are present for terms/regulamin, privacy, returns and
  complaints, delivery/shipping, cookies and FAQ.
- `lib/store-pages.ts` marks the legal set as draft/pending and does not publish
  final seller identity, seller address, return address, NIP, REGON or final tax
  claims.
- Official brand contact/support/returns e-mail:
  `studio@garconmaires.com`.
- Checkout UI currently shows two required consents:
  - terms/regulamin acceptance,
  - privacy policy acceptance.
- Checkout UI also shows one optional launch/newsletter consent.
- Order creation logs consent timestamps for terms and privacy, optional
  newsletter/marketing consent timestamps and `legalDocumentVersion`.
- Real checkout remains gated while `shopEnabled=false` and
  `shopMode=PRE_LAUNCH`.

Required before public checkout:

- Final required terms checkbox text in Polish and English: TO CONFIRM.
- Final required privacy/GDPR checkbox text in Polish and English: TO CONFIRM.
- Decide whether a separate withdrawal/consumer-rights acknowledgement checkbox
  is required or whether it is covered by the terms checkbox: TO CONFIRM.
- Final optional newsletter/marketing consent wording, separate from required
  checkout consents: TO CONFIRM.
- Final links from checkout to terms, privacy, returns/complaints and delivery
  pages verified in PL and EN.
- Final `legalDocumentVersion` set only after approved document versions exist.
- Confirm that legal consent records are retained according to the final privacy
  policy retention period: TO CONFIRM.

Data still required from the seller before public checkout:

- Seller identity for działalność nierejestrowana: full name to publish where
  legally required. TO CONFIRM.
- Contact/correspondence address for terms and privacy policy. TO CONFIRM.
- Customer support email and returns/complaints email:
  `studio@garconmaires.com` unless a separate address is introduced later.
- Return shipping address or approved return intake process.
- Statement that the first drop is sold under działalność nierejestrowana, with
  wording reviewed for consumer-facing legal pages. TO CONFIRM.
- VAT wording, including whether sales are not VAT-taxed / no VAT recovery, if
  applicable. TO CONFIRM with accounting/tax support.
- Sales confirmation/invoice-on-request process for działalność nierejestrowana.
  TO CONFIRM.
- Revenue limit tracking owner and process.
- Simplified sales register / ewidencja sprzedaży owner and process.

## Seller and business details

- Business registration status: `unregistered_activity_planned`.
- First drop business model: działalność nierejestrowana / unregistered
  activity planned.
- Do not invent or publish seller name, NIP, REGON, legal address, return
  address or tax details before the business form and seller data are confirmed.
- Legal seller name completed.
- NIP completed.
- REGON completed if applicable.
- Registered business address completed.
- Customer contact email completed.
- Return address completed.
- Complaint contact completed.
- Business registration/tax details verified.

## Działalność nierejestrowana controls

- Confirm the applicable działalność nierejestrowana revenue limit for the
  launch period.
- Track revenue against the applicable limit before, during and after the drop.
- Prepare simplified sales register / ewidencja sprzedaży.
- Collect invoices, cost documents and sales confirmations.
- Add PIT settlement reminder for income from the drop.
- Assume no VAT recovery unless a separate tax/VAT decision changes this later.

## Store terms

- Terms and conditions finalized.
- Order placement, payment, delivery, returns and complaint rules are consistent
  across legal pages, checkout copy and transactional emails.
- Consumer 14-day withdrawal rights are described correctly.
- Withdrawal form details are available.
- Return and complaint process is clear.
- Confirmation emails and order records are retained consistently.

## Privacy and consent

- Privacy policy / GDPR information finalized.
- Data controller details completed.
- Legal bases and retention periods documented.
- Cookie policy and consent flow verified.
- Newsletter consent wording verified.
- Marketing consent is separate from required checkout consent.

## Pricing and payments

- Product prices are shown as gross PLN.
- Delivery costs and estimated delivery times are visible before checkout.
- Payment operator details are completed.
- Tpay sandbox test is completed before live launch.
- Lowest price in the last 30 days is shown if promotions are used.

## Operations

- Delivery operator details are completed.
- Standard shipping price is configured.
- Free shipping threshold is configured or disabled intentionally.
- Manual tracking number process is ready.
- Courier and parcel locker delivery flows are checked.
- Return and complaint mailbox ownership is assigned.

## Pre-launch safety

- `shopEnabled=false` until launch approval.
- `shopMode=PRE_LAUNCH` until launch approval.
- `sellerDataStatus=pending` until seller details are confirmed.
- `legalStatus=pending` until legal pages are completed and reviewed.
- `businessRegistrationStatus=unregistered_activity_planned` for first drop.
- Products remain hidden/draft until launch approval.
- `CHECKOUT_TEST_MODE=true` only in Preview/local.
- `CHECKOUT_TEST_MODE=false` in Production.
- Do not switch `TPAY_ENV` to production until sandbox and live low-value tests
  are approved.
