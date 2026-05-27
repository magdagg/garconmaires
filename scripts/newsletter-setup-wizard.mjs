import crypto from "node:crypto";
import {
  appendSheetRow,
  askHiddenQuestion,
  askMultilineInput,
  askQuestion,
  askYesNo,
  createInterface,
  ensureEnvLocalExists,
  ensureEnvLocalGitignored,
  ensureNewsletterSheetHeaders,
  getSpreadsheetInfo,
  loadEnvLocal,
  maskSecret,
  normalizePrivateKey,
  upsertEnvValues,
  validateRequiredEnv,
} from "./newsletter-shared.mjs";

function buildTestRow() {
  return [
    "test@example.com",
    "setup-test",
    "pl",
    "true",
    new Date().toISOString(),
    "newsletter-setup-wizard",
    crypto.createHash("sha256").update("setup-test").digest("hex"),
  ];
}

async function promptValue(rl, key, existingValue) {
  if (key === "GOOGLE_PRIVATE_KEY") {
    console.log(
      existingValue
        ? `Current ${key}: ${maskSecret(existingValue)}`
        : `${key} is currently missing.`,
    );
    const keepExisting = existingValue
      ? await askYesNo(rl, `Keep existing ${key}?`, true)
      : false;

    if (keepExisting && existingValue) {
      return existingValue;
    }

    const pasted = await askMultilineInput(
      rl,
      "Paste the Google private key exactly as provided in the JSON key.",
    );
    return normalizePrivateKey(pasted);
  }

  console.log(
    existingValue
      ? `Current ${key}: ${maskSecret(existingValue)}`
      : `${key} is currently missing.`,
  );
  const keepExisting = existingValue
    ? await askYesNo(rl, `Keep existing ${key}?`, true)
    : false;

  if (keepExisting && existingValue) {
    return existingValue;
  }

  if (key === "RESEND_API_KEY") {
    return String(await askHiddenQuestion(rl, `Enter ${key}: `)).trim();
  }

  return String(await askQuestion(rl, `Enter ${key}: `)).trim();
}

async function main() {
  ensureEnvLocalExists();
  ensureEnvLocalGitignored();
  const existingEnv = loadEnvLocal();
  const rl = createInterface();

  try {
    const nextValues = {};

    for (const key of [
      "RESEND_API_KEY",
      "GOOGLE_SHEETS_NEWSLETTER_ID",
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
    ]) {
      nextValues[key] = await promptValue(rl, key, existingEnv[key] ?? "");
    }

    upsertEnvValues(nextValues);

    const validation = validateRequiredEnv();
    if (!validation.ok) {
      console.error(
        `Missing required values after saving .env.local: ${validation.missing.join(", ")}`,
      );
      process.exit(1);
    }

    console.log("Saved newsletter environment values to .env.local");

    const info = await getSpreadsheetInfo();
    const headerResult = await ensureNewsletterSheetHeaders();

    console.log(`Connected to spreadsheet: ${info.spreadsheetTitle}`);
    console.log(`Accessible sheet tab: ${info.sheetTitle}`);
    console.log(
      headerResult.updated
        ? "Header row was updated to the required newsletter columns."
        : "Header row already matches the required newsletter columns.",
    );

    const writeTestRow = await askYesNo(
      rl,
      'Append a clearly marked test row for verification ("test@example.com" / "setup-test")?',
      false,
    );

    if (writeTestRow) {
      const appendResult = await appendSheetRow(buildTestRow());
      console.log(
        `Test row appended successfully in ${appendResult.sheetTitle} (${appendResult.updatedRange ?? "range unavailable"}).`,
      );
    } else {
      console.log("Skipped test row append.");
    }

    console.log("Newsletter setup wizard completed.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Newsletter setup wizard failed: ${message}`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

await main();
