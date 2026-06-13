# Resend transactional email testing

Status: prepared for Preview/Staging setup. Do not send real customer emails
yet.

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
   - `return_requested`
   - `complaint_submitted`
   - `newsletter_confirmation`
8. Check `EmailEvent` logs in `/admin`.

## Safety rules

- Keep `EMAIL_TEST_MODE=true` in Preview while testing.
- Route test sends only to the admin/test recipient.
- Do not configure Production Resend envs until the production launch rehearsal
  is explicitly approved.
- Do not send test emails to real customers.
- Missing Resend config should continue to skip safely and record/log the skip.
