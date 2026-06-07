# Polish ecommerce legal launch checklist

This checklist is a launch-preparation aid for Garçonmaires. It is draft
operational documentation, not legal advice. Final wording should be reviewed by
a Polish ecommerce/GDPR specialist before public sales.

## Seller and business details

- Legal seller name completed.
- NIP completed.
- REGON completed if applicable.
- Registered business address completed.
- Customer contact email completed.
- Return address completed.
- Complaint contact completed.
- Business registration/tax details verified.

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
- Products remain hidden/draft until launch approval.
- `CHECKOUT_TEST_MODE=true` only in Preview/local.
- `CHECKOUT_TEST_MODE=false` in Production.
- Do not switch `TPAY_ENV` to production until sandbox and live low-value tests
  are approved.
