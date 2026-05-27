# Garçonmaires Newsletter Setup

This project stores newsletter subscribers in Google Sheets and sends confirmation emails through Resend.

## Recommended Semi-Automatic Setup

1. Create the Google Sheet under `gm.company.contact@gmail.com`.
2. Create a Google service account.
3. Share the sheet with the service account email as `Editor`.
4. Create a Resend API key after domain verification.
5. Run:

```bash
npm run newsletter:setup
```

6. Run:

```bash
npm run newsletter:sheet
```

7. Run:

```bash
npm run newsletter:test-email
```

8. Run:

```bash
npm run newsletter:test-subscribe
```

9. Run:

```bash
npm run newsletter:vercel-env
```

10. Redeploy the Vercel project.

## Manual Setup

### Google Sheet

1. Sign in to `gm.company.contact@gmail.com`.
2. Create a new spreadsheet.
3. Suggested sheet name: `Garçonmaires Newsletter Subscribers`.
4. Add these headers in row 1:

`email | source | language | consent | createdAt | userAgent | ipHash`

5. Copy the spreadsheet ID from the URL and keep it for:

`GOOGLE_SHEETS_NEWSLETTER_ID=`

### Google Cloud Service Account

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable the Google Sheets API.
4. Go to `IAM & Admin` -> `Service Accounts`.
5. Create a service account.
6. Generate a JSON key for it.
7. Keep these values ready:

`GOOGLE_SERVICE_ACCOUNT_EMAIL=`

`GOOGLE_PRIVATE_KEY=`

The private key can contain escaped newlines. The setup wizard stores it safely in `.env.local`.

### Share The Sheet

This is required.

1. Open the Google Sheet.
2. Click `Share`.
3. Add the service account email.
4. Grant `Editor` access.

If the sheet is not shared with the service account email, writing subscribers will fail.

### Resend Setup

1. Create a [Resend](https://resend.com/) account.
2. Add the domain `garconmaires.com`.
3. Copy the DNS records from Resend.
4. Add those records in Cloudflare DNS.
5. Wait for Resend domain verification.
6. Create a Resend API key.

Only after the domain is verified should you use `Garçonmaires Studio <studio@garconmaires.com>` as the production sender.

Important: Cloudflare Email Routing is only for receiving and forwarding messages. It is not enough for sending transactional confirmation emails. Resend verification is still required.

Detailed outbound mail notes are also in [docs/resend-domain-setup.md](/Users/magdalenagrabowska/garconmaires/docs/resend-domain-setup.md).

### Cloudflare

Keep your existing Email Routing setup for incoming mail to `studio@garconmaires.com`.

For outbound confirmation emails, add the Resend DNS records in Cloudflare and wait for verification.

### Vercel Environment Variables

Add the following variables in the Vercel project:

```env
RESEND_API_KEY=
GOOGLE_SHEETS_NEWSLETTER_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

Redeploy after updating them.
