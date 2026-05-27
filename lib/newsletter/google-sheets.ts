import { google } from "googleapis";
import { normalizeNewsletterEmail, type NewsletterLanguage } from "@/lib/newsletter/validation";

export type NewsletterSubscriberRow = {
  email: string;
  source: string;
  language: NewsletterLanguage;
  consent: true;
  createdAt: string;
  userAgent: string;
  ipHash: string;
};

export const NEWSLETTER_HEADERS = [
  "email",
  "source",
  "language",
  "consent",
  "createdAt",
  "userAgent",
  "ipHash",
] as const;

let cachedSheetTitle: string | null = null;

export function getGooglePrivateKey() {
  return process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_NEWSLETTER_ID?.trim();

  if (!spreadsheetId) {
    throw new Error("Missing GOOGLE_SHEETS_NEWSLETTER_ID");
  }

  return spreadsheetId;
}

export function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = getGooglePrivateKey();

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account credentials");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export async function getNewsletterSheetTitle() {
  if (cachedSheetTitle) {
    return cachedSheetTitle;
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  let response;

  try {
    response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets(properties(title,index))",
    });
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }

  const title = response.data.sheets?.[0]?.properties?.title?.trim();

  if (!title) {
    throw new Error("Newsletter spreadsheet has no sheets");
  }

  cachedSheetTitle = title;
  return title;
}

export function getGoogleSheetsErrorMessage(error: unknown) {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
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
    message.includes("permission") ||
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

export async function testGoogleSheetsAccess() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  try {
    const title = await getNewsletterSheetTitle();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${title}!A1:G2`,
    });

    return {
      sheetTitle: title,
      rowsRead: response.data.values?.length ?? 0,
    };
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }
}

export async function ensureNewsletterSheetHeaders() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetTitle = await getNewsletterSheetTitle();
  const headerRange = `${sheetTitle}!1:1`;
  let response;

  try {
    response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }

  const currentHeader = response.data.values?.[0] ?? [];
  const isHeaderValid =
    currentHeader.length >= NEWSLETTER_HEADERS.length &&
    NEWSLETTER_HEADERS.every((header, index) => currentHeader[index] === header);

  if (isHeaderValid) {
    return;
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1:G1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [Array.from(NEWSLETTER_HEADERS)],
      },
    });
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }
}

export async function getExistingSubscriberEmails() {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetTitle = await getNewsletterSheetTitle();
  let response;

  try {
    response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:A`,
    });
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }

  const rows = response.data.values ?? [];

  return new Set(
    rows
      .map((row) => normalizeNewsletterEmail(String(row[0] ?? "")))
      .filter(Boolean),
  );
}

export async function appendSubscriberRow(row: NewsletterSubscriberRow) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const sheetTitle = await getNewsletterSheetTitle();

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:G`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            row.email,
            row.source,
            row.language,
            String(row.consent),
            row.createdAt,
            row.userAgent,
            row.ipHash,
          ],
        ],
      },
    });
  } catch (error) {
    throw new Error(getGoogleSheetsErrorMessage(error));
  }
}

export async function saveNewsletterSubscriber(
  row: NewsletterSubscriberRow,
): Promise<"subscribed" | "already_subscribed"> {
  await ensureNewsletterSheetHeaders();
  const existingEmails = await getExistingSubscriberEmails();

  if (existingEmails.has(row.email)) {
    return "already_subscribed";
  }

  await appendSubscriberRow(row);
  return "subscribed";
}
