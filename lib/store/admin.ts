import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAuthorizedStoreAdmin(request: NextRequest) {
  const configuredToken = process.env.ORDER_ADMIN_TOKEN?.trim();

  if (!configuredToken) {
    return false;
  }

  const headerToken = request.headers.get("x-admin-token")?.trim();
  const bearerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  return (
    (headerToken ? safeCompare(headerToken, configuredToken) : false) ||
    (bearerToken ? safeCompare(bearerToken, configuredToken) : false)
  );
}
