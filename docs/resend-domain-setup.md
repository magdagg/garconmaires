# Resend Domain Setup

Cloudflare Email Routing only handles receiving and forwarding email.

It is enough for inbound mail like:

`studio@garconmaires.com -> gm.company.contact@gmail.com`

It is not enough for sending transactional confirmation emails from the Garçonmaires website.

## Required Steps

1. Create a [Resend](https://resend.com/) account.
2. Add the domain `garconmaires.com` inside Resend.
3. Copy the DNS records that Resend gives you.
4. Open Cloudflare DNS for `garconmaires.com`.
5. Add the Resend DNS records there.
6. Wait until Resend verifies the domain.
7. Generate a `RESEND_API_KEY`.
8. Add it through one of these commands:

```bash
npm run newsletter:setup
```

or

```bash
npm run newsletter:vercel-env
```

## Local Verification

After the domain is verified and the API key is stored in `.env.local`, test sending:

```bash
npm run newsletter:test-email
```

The production sender used by the newsletter is:

`Garçonmaires Studio <studio@garconmaires.com>`
