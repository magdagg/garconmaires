#!/usr/bin/env node

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  }),
);

const target =
  args.get("url") ?? "http://localhost:3003/api/payments/webhook/tpay";
const mode = args.get("mode") ?? "unsigned";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run the development webhook helper in production.");
}

const targetUrl = new URL(target);
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

if (
  !localHosts.has(targetUrl.hostname) &&
  process.env.ALLOW_NONLOCAL_WEBHOOK_TEST !== "true"
) {
  throw new Error(
    "Refusing to send a mock webhook to a non-local URL. Set ALLOW_NONLOCAL_WEBHOOK_TEST=true only for a controlled staging tunnel.",
  );
}

const body = {
  type: "transaction",
  data: {
    transactionId: args.get("transactionId") ?? "dev-invalid-tpay-transaction",
    transactionTitle: args.get("title") ?? "DEV-INVALID-TPAY",
    transactionAmount: Number(args.get("amount") ?? "1.00"),
    transactionStatus: args.get("status") ?? "correct",
    transactionHiddenDescription: args.get("orderId") ?? "dev-order-id",
  },
};

const headers = { "content-type": "application/json" };

if (mode === "bad-signed") {
  headers["x-jws-signature"] =
    "eyJhbGciOiJSUzI1NiIsIng1dSI6Imh0dHBzOi8vc2VjdXJlLnNhbmRib3gudHBheS5jb20veDUwOS9ub3RpZmljYXRpb25zLWp3cy5wZW0ifQ.invalid.invalid";
}

if (mode !== "unsigned" && mode !== "bad-signed") {
  throw new Error("Use --mode=unsigned or --mode=bad-signed.");
}

const response = await fetch(targetUrl, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});

const text = await response.text();

console.log(`Sent ${mode} Tpay mock webhook to ${targetUrl}`);
console.log(`HTTP ${response.status}`);
console.log(text);

if (response.ok) {
  console.warn(
    "Warning: this helper should not create successful paid webhooks. Use real Tpay sandbox notifications for paid status tests.",
  );
}
