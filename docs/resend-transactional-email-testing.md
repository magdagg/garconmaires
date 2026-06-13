# Resend transactional email testing

Status: Preview/Staging admin-only test-send passed. Do not send real customer
emails yet.

Current stable Preview status:

- Stable staging admin: https://garconmaires-tpay-staging.vercel.app/admin
- Resend Preview env vars are configured:
  `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`,
  `EMAIL_TEST_MODE` and `EMAIL_TEST_RECIPIENT`.
- Admin-only test sends passed through Resend for:
  `order_created`, `payment_confirmed`, `order_shipped` and
  `newsletter_confirmation`.
- New `EmailEvent` rows were recorded with status `sent`, provider `resend`,
  provider message id present, `sentAt` present and `errorSummary=null`.
- Order-related templates are linked to the paid sandbox audit order
  `GM-2026-0003`.
- `newsletter_confirmation` is recorded with `orderId=null`.
- No production emails and no real customer emails have been sent.
- No Production deploy was performed for the Preview/Staging email test.
- Preview test sends require `EMAIL_TEST_RECIPIENT`; arbitrary typed recipients
  are blocked in Preview.

## Required Preview env vars

Configure these in Vercel Preview only:

```env
RESEND_API_KEY=...
RESEND_FROM_EMAIL=Garçonmaires Studio <studio@garconmaires.com>
EMAIL_TEST_MODE=true
EMAIL_TEST_RECIPIENT=admin-or-test@example.com
```

Optional:

```env
RESEND_REPLY_TO=studio@garconmaires.com
```

Do not commit `.env` files and do not print raw Resend API keys.

## Sender recommendation

Use `studio@garconmaires.com` or another verified Garçonmaires-domain address.
Cloudflare Email Routing is only for receiving/forwarding mail; Resend domain
verification is required for outbound transactional email.

## Setup checklist

1. Add `garconmaires.com` in Resend.
2. Add the DNS records that Resend provides.
3. Wait for the domain to verify.
4. Add the Preview env vars in Vercel.
5. Redeploy Preview.
6. Send an admin-only test email to `EMAIL_TEST_RECIPIENT`.
7. Preview and test these templates:
   - `order_created`
   - `payment_confirmed`
   - `order_shipped`
   - `newsletter_confirmation`
   - `payment_pending`
   - `payment_failed`
   - `return_requested`
   - `complaint_submitted`
   - `early_access_invitation`
8. Check `EmailEvent` logs in `/admin`.

Passed Preview test-send results:

| Template | Status | Provider | Order link |
| --- | --- | --- | --- |
| `order_created` | `sent` | `resend` | `GM-2026-0003` |
| `payment_confirmed` | `sent` | `resend` | `GM-2026-0003` |
| `order_shipped` | `sent` | `resend` | `GM-2026-0003` |
| `newsletter_confirmation` | `sent` | `resend` | none |

For each passed send, `EmailEvent.providerMessageId` and `EmailEvent.sentAt`
are present, `errorSummary` is null, and no raw provider payloads, secrets,
tokens or headers are stored.

## Admin-only testing flow

1. Open `/admin` on the stable Preview alias.
2. Confirm email diagnostics show only safe present/missing/domain values.
3. Use email preview first; preview rendering never sends.
4. Use test send only after `EMAIL_TEST_RECIPIENT` is configured.
5. Confirm the message is delivered only to `EMAIL_TEST_RECIPIENT`.
6. Confirm `EmailEvent` shows the template, status, provider, recipient domain,
   provider message id if available, sanitized error summary if any and
   timestamps.

Use the paid sandbox audit order `GM-2026-0003` for latest-order previews when
checking order lifecycle copy.

## Template language and footer

Templates are currently Polish-only. They include order numbers, totals where
relevant, support contact copy and legal footer links:

- Regulamin: https://garconmaires.com/regulamin
- Polityka prywatności: https://garconmaires.com/polityka-prywatnosci
- Zwroty i reklamacje: https://garconmaires.com/zwroty-i-reklamacje
- Dostawa: https://garconmaires.com/dostawa

## Safety rules

- Keep `EMAIL_TEST_MODE=true` in Preview while testing.
- Route test sends only to `EMAIL_TEST_RECIPIENT`.
- Do not configure Production Resend envs until the production launch rehearsal
  is explicitly approved.
- Do not send test emails to real customers.
- Missing Resend config should continue to skip safely and record/log the skip.
- Do not print `RESEND_API_KEY`, raw provider responses, tokens or headers.
