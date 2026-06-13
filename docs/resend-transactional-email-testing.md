# Resend transactional email testing

Status: prepared for Preview/Staging setup. Do not send real customer emails
yet.

Current stable Preview status:

- Stable staging admin: https://garconmaires-tpay-staging.vercel.app/admin
- Resend Preview env vars are not configured yet.
- Existing lifecycle attempts are logged as skipped `EmailEvent` records because
  `RESEND_API_KEY` is missing.
- No real emails have been sent from Preview.
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
   - `payment_pending`
   - `payment_confirmed`
   - `payment_failed`
   - `order_shipped`
   - `return_requested`
   - `complaint_submitted`
   - `newsletter_confirmation`
   - `early_access_invitation`
8. Check `EmailEvent` logs in `/admin`.

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
