# Shipping providers

This document describes the Garconmaires shipping-provider layer.

Safety state:

- Keep `shopEnabled=false` until launch.
- Keep `shopMode=PRE_LAUNCH` until launch.
- Keep real products hidden/draft until launch.
- Do not create production shipments from Vercel Preview.
- Do not fake provider shipment success.
- Keep manual fulfillment available as fallback.

## Providers

Implemented provider architecture:

- `manual`: no external API calls, supports manual tracking fallback.
- `inpost`: ShipX-ready provider for sandbox shipment creation, labels, tracking and cancellation.

Future provider slots:

- DPD
- DHL
- GLS
- UPS
- Pocztex
- Orlen Paczka
- Other/manual carriers

Future providers should implement the same interface:

- `createShipment(order)`
- `getShipment(orderOrShipmentId)`
- `getTracking(orderOrShipmentId)`
- `createLabel(orderOrShipmentId)`
- `cancelShipment(orderOrShipmentId)`
- `findParcelLockers(query)` when supported
- `validateConfig()`
- `getPublicConfigStatus()`

## InPost env vars

Use Preview/Staging with sandbox credentials only:

```env
INPOST_ENV=sandbox
INPOST_API_TOKEN=...
INPOST_ORGANIZATION_ID=...
INPOST_DEFAULT_SENDER_ID=...
INPOST_DEFAULT_SERVICE=inpost_locker_standard
INPOST_LABEL_FORMAT=pdf
INPOST_TEST_MODE=true
```

Production env must not be used from Preview. Admin diagnostics show only:

- configured true/false
- environment
- test mode
- API token present true/false
- organization id present true/false
- missing env names
- warnings

They do not show token values.

## Admin workflow

1. Open `/admin`.
2. Confirm provider diagnostics.
3. For Paczkomat orders, confirm parcel locker ID, name and address.
4. For courier orders, confirm recipient address, city, postal code, phone and email.
5. If InPost is not configured, use manual tracking fallback.
6. If InPost sandbox is configured, create shipment.
7. Generate label.
8. Refresh tracking.
9. Mark shipped manually only after a tracking number is present.
10. Cancel shipment only before delivered/cancelled terminal states.

## Parcel locker search

Endpoint:

```text
/api/delivery/inpost/parcel-lockers?q=QUERY
```

Returns sanitized results:

- id/name
- address
- city
- postal code
- latitude/longitude when available

The endpoint rate-limits by IP in memory and never exposes provider credentials.
Checkout remains gated while the store is in pre-launch.

## Remaining before production InPost use

- Obtain real InPost sandbox credentials.
- Verify organization ID and token.
- Confirm service codes for locker and courier shipments.
- Create sandbox shipment from admin.
- Generate and download sandbox label.
- Refresh tracking.
- Cancel a sandbox shipment before terminal state.
- Confirm no production shipments can be created from Preview.
- Decide whether first drop uses manual fulfillment or InPost API.
