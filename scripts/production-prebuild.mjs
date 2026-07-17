import { spawnSync } from "node:child_process";

const requiredProductionEnv = [
  "DATABASE_URL",
  "DIRECT_URL",
  "CUSTOMER_ACCOUNT_MODE",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_REPLY_TO",
  "NEXT_PUBLIC_SITE_URL",
];

function fail(message) {
  console.error(`[production-prebuild] ${message}`);
  process.exit(1);
}

function env(name) {
  return process.env[name]?.trim() ?? "";
}

function runPrismaMigrationCommand(args) {
  const result = spawnSync("npx", ["prisma", ...args], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: env("DIRECT_URL"),
    },
  });

  if (result.status !== 0) {
    fail(`Prisma ${args.join(" ")} failed.`);
  }
}

if (env("VERCEL_ENV") !== "production") {
  console.log("[production-prebuild] Skipping production migration gate outside Vercel Production.");
  process.exit(0);
}

const missing = requiredProductionEnv.filter((name) => !env(name));
if (missing.length > 0) {
  fail(`Missing required Production env: ${missing.join(", ")}.`);
}

if (env("CUSTOMER_ACCOUNT_MODE") !== "enabled") {
  fail("CUSTOMER_ACCOUNT_MODE must be enabled for Production account launch.");
}

if (env("NEXT_PUBLIC_SITE_URL") !== "https://garconmaires.com") {
  fail("NEXT_PUBLIC_SITE_URL must be https://garconmaires.com in Production.");
}

if (env("EMAIL_TEST_MODE") || env("EMAIL_TEST_RECIPIENT")) {
  fail("EMAIL_TEST_MODE and EMAIL_TEST_RECIPIENT must not be set in Production.");
}

console.log("[production-prebuild] Production env gate passed.");
console.log("[production-prebuild] Running Prisma migrations with DIRECT_URL.");
runPrismaMigrationCommand(["migrate", "deploy"]);
runPrismaMigrationCommand(["migrate", "status"]);
console.log("[production-prebuild] Production migration gate passed.");
