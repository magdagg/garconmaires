import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import { google } from "googleapis";
import { Resend } from "resend";

export const ROOT_DIR = process.cwd();
export const ENV_LOCAL_PATH = path.join(ROOT_DIR, ".env.local");
export const GITIGNORE_PATH = path.join(ROOT_DIR, ".gitignore");
export const NEWSLETTER_HEADERS = [
  "email",
  "source",
  "language",
  "consent",
  "createdAt",
  "userAgent",
  "ipHash",
];
export const REQUIRED_NEWSLETTER_ENV_KEYS = [
  "RESEND_API_KEY",
  "GOOGLE_SHEETS_NEWSLETTER_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
];
export const NEWSLETTER_SENDER = "Garçonmaires Studio <studio@garconmaires.com>";

export function ensureEnvLocalExists() {
  if (!fs.existsSync(ENV_LOCAL_PATH)) {
    fs.writeFileSync(ENV_LOCAL_PATH, "", "utf8");
  }
}

export function ensureEnvLocalGitignored() {
  const current = fs.existsSync(GITIGNORE_PATH)
    ? fs.readFileSync(GITIGNORE_PATH, "utf8")
    : "";

  const lines = current.split(/\r?\n/);
  const alreadyIgnored = lines.some((line) => line.trim() === ".env.local" || line.trim() === ".env*");

  if (!alreadyIgnored) {
    const next = current.endsWith("\n") || current.length === 0 ? current : `${current}\n`;
    fs.writeFileSync(GITIGNORE_PATH, `${next}.env.local\n`, "utf8");
  }
}

export function parseEnvFile(content) {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = rawLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = rawLine.slice(0, separatorIndex).trim();
    let value = rawLine.slice(separatorIndex + 1);

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

export function loadEnvLocal() {
  ensureEnvLocalExists();
  const content = fs.readFileSync(ENV_LOCAL_PATH, "utf8");
  const env = parseEnvFile(content);

  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  return env;
}

export function serializeEnvValue(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function normalizePrivateKey(value) {
  const trimmed = value.trim();
  return trimmed.replace(/\r\n/g, "\n").replace(/\n/g, "\\n");
}

export function upsertEnvValues(nextValues) {
  ensureEnvLocalExists();
  const current = loadEnvLocal();
  const merged = {
    ...current,
    ...nextValues,
  };

  const lines = Object.entries(merged).map(([key, value]) => `${key}=${serializeEnvValue(value)}`);
  fs.writeFileSync(ENV_LOCAL_PATH, `${lines.join("\n")}\n`, "utf8");

  for (const [key, value] of Object.entries(nextValues)) {
    process.env[key] = value;
  }
}

export function maskSecret(value, { showEnd = 4 } = {}) {
  if (!value) {
    return "(missing)";
  }

  if (value.length <= showEnd) {
    return "*".repeat(value.length);
  }

  return `${"*".repeat(Math.max(8, value.length - showEnd))}${value.slice(-showEnd)}`;
}

export function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

export async function askHiddenQuestion(rl, question) {
  const originalWrite = rl._writeToOutput;
  rl.stdoutMuted = true;
  rl._writeToOutput = function writeMasked(stringToWrite) {
    if (rl.stdoutMuted) {
      rl.output.write("*");
      return;
    }

    rl.output.write(stringToWrite);
  };

  const answer = await askQuestion(rl, question);
  rl.stdoutMuted = false;
  rl._writeToOutput = originalWrite;
  rl.output.write("\n");
  return answer;
}

export async function askMultilineInput(rl, intro) {
  console.log(intro);
  console.log('Paste the full value, then enter a single line with "END".');
  const lines = [];

  while (true) {
    const line = await askQuestion(rl, "");
    if (line === "END") {
      break;
    }

    lines.push(line);
  }

  return lines.join("\n").trim();
}

export async function askYesNo(rl, question, defaultValue = false) {
  const suffix = defaultValue ? " [Y/n] " : " [y/N] ";
  const answer = String(await askQuestion(rl, `${question}${suffix}`)).trim().toLowerCase();

  if (!answer) {
    return defaultValue;
  }

  return answer === "y" || answer === "yes";
}

export function validateRequiredEnv(env = process.env) {
  const missing = REQUIRED_NEWSLETTER_ENV_KEYS.filter((key) => !String(env[key] ?? "").trim());
  return {
    ok: missing.length === 0,
    missing,
  };
}

export function createGoogleSheetsClient(env = process.env) {
  const spreadsheetId = String(env.GOOGLE_SHEETS_NEWSLETTER_ID ?? "").trim();
  const clientEmail = String(env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "").trim();
  const privateKeyRaw = String(env.GOOGLE_PRIVATE_KEY ?? "").trim();
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SHEETS_NEWSLETTER_ID");
  }

  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId };
}

export function getGoogleSheetsErrorMessage(error) {
  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : "Unknown Google Sheets error";

  if (
    message.includes("Requested entity was not found") ||
    message.includes("Unable to parse range")
  ) {
    return "Google Sheet not found or inaccessible. Check GOOGLE_SHEETS_NEWSLETTER_ID.";
  }

  if (
    message.includes("The caller does not have permission") ||
    message.toLowerCase().includes("permission") ||
    message.includes("insufficient authentication scopes")
  ) {
    return "Google Sheet is not shared with the service account email or access is missing.";
  }

  if (message.includes("API has not been used") || message.includes("Google Sheets API")) {
    return "Google Sheets API is not enabled for the selected Google Cloud project.";
  }

  if (
    message.includes("DECODER routines") ||
    message.includes("PEM") ||
    message.includes("private key") ||
    message.includes("invalid_grant")
  ) {
    return "Google private key looks invalid. Check GOOGLE_PRIVATE_KEY formatting.";
  }

  return message;
}

export async function getSpreadsheetInfo(env = process.env) {
  try {
    const { sheets, spreadsheetId } = createGoogleSheetsClient(env);
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties(title),sheets(properties(title,index))",
    });
    const sheetTitle = response.data.sheets?.[0]?.properties?.title?.trim();

    if (!sheetTitle) {
      throw new Error("No sheet tab found in the spreadsheet.");
    }

    return {
      spreadsheetTitle: response.data.properties?.title ?? "(untitled spreadsheet)",
      sheetTitle,
      sheets,
      spreadsheetId,
    };
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }
}

export async function ensureNewsletterSheetHeaders(env = process.env) {
  const { sheets, spreadsheetId, sheetTitle } = await getSpreadsheetInfo(env);

  try {
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!1:1`,
    });

    const currentHeader = headerResponse.data.values?.[0] ?? [];
    const isHeaderValid =
      currentHeader.length >= NEWSLETTER_HEADERS.length &&
      NEWSLETTER_HEADERS.every((header, index) => currentHeader[index] === header);

    if (!isHeaderValid) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1:G1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [NEWSLETTER_HEADERS],
        },
      });
    }

    return { sheetTitle, updated: !isHeaderValid };
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }
}

export async function appendSheetRow(values, env = process.env) {
  const { sheets, spreadsheetId, sheetTitle } = await getSpreadsheetInfo(env);

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:G`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [values],
      },
    });

    return {
      sheetTitle,
      updatedRange: response.data.updates?.updatedRange ?? null,
    };
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }
}

export function createResendClient(env = process.env) {
  const apiKey = String(env.RESEND_API_KEY ?? "").trim();

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(apiKey);
}

export async function sendResendEmail({ to, subject, text, html }, env = process.env) {
  const resend = createResendClient(env);
  const result = await resend.emails.send({
    from: NEWSLETTER_SENDER,
    to,
    subject,
    text,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export function commandExists(command) {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    cwd: ROOT_DIR,
    encoding: "utf8",
  });

  return result.status === 0;
}

export function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
    input: options.input,
  });
}
