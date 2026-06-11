import { diagnoseTpayOAuthConfig } from "../lib/store/payments";

function redactUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactUnknown);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      /secret|token|authorization|password|credential|client_secret/i.test(key)
        ? "[redacted]"
        : redactUnknown(item),
    ]),
  );
}

const result = await diagnoseTpayOAuthConfig();
const safeResult = {
  ...result,
  errorBody: redactUnknown(result.errorBody),
};

console.log(JSON.stringify(safeResult, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}
