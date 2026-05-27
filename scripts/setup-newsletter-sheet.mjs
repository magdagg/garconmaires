import {
  ensureEnvLocalExists,
  ensureEnvLocalGitignored,
  ensureNewsletterSheetHeaders,
  getSpreadsheetInfo,
  loadEnvLocal,
  validateRequiredEnv,
} from "./newsletter-shared.mjs";

async function main() {
  ensureEnvLocalExists();
  ensureEnvLocalGitignored();
  loadEnvLocal();

  const validation = validateRequiredEnv();

  if (!validation.ok) {
    console.error(
      `Missing required newsletter environment variables: ${validation.missing.join(", ")}`,
    );
    console.error("Add them to .env.local first or run: npm run newsletter:setup");
    process.exit(1);
  }

  try {
    const info = await getSpreadsheetInfo();
    const headerResult = await ensureNewsletterSheetHeaders();

    console.log(`Connected to spreadsheet: ${info.spreadsheetTitle}`);
    console.log(`Using sheet tab: ${info.sheetTitle}`);
    console.log(
      headerResult.updated
        ? "Header row was updated to the required newsletter columns."
        : "Header row already matches the required newsletter columns.",
    );
    console.log("Existing subscriber data was preserved.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Newsletter sheet setup failed: ${message}`);
    process.exit(1);
  }
}

await main();
