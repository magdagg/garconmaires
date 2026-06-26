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
