## Garçonmaires

Garçonmaires is a Next.js 16 storefront deployed on Vercel.

## Development

```bash
npm install
npm run dev
```

The local app runs on [http://localhost:3003](http://localhost:3003).

## Environment Variables

Copy `.env.example` and configure:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3003
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
GOOGLE_SHEETS_NEWSLETTER_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

## Newsletter

The newsletter flow:

- validates email, consent, and source server-side
- saves subscribers to Google Sheets
- avoids duplicate rows
- sends confirmation emails with Resend

Full setup instructions are in [docs/newsletter-setup.md](/Users/magdalenagrabowska/garconmaires/docs/newsletter-setup.md).
Resend domain-specific notes are in [docs/resend-domain-setup.md](/Users/magdalenagrabowska/garconmaires/docs/resend-domain-setup.md).

Available setup commands:

```bash
npm run newsletter:setup
npm run newsletter:sheet
npm run newsletter:test-email
npm run newsletter:test-subscribe
npm run newsletter:vercel-env
```
