import { NextRequest, NextResponse } from "next/server";
import {
  destroyCustomerSession,
  getCustomerAccountPayload,
  getSessionTokenFromCookies,
  getAccountCookieOptions,
  sessionCookieName,
} from "@/lib/account/auth";
import { isCustomerAccountEnabled } from "@/lib/account/config";
import {
  accountRateLimit,
  attachCsrfCookie,
  csrfErrorResponse,
  getOrCreateCsrfToken,
  validateCsrfRequest,
} from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get("orderNumber") ?? undefined;
  const payload = await getCustomerAccountPayload(orderNumber);
  const csrfToken = isCustomerAccountEnabled() ? getOrCreateCsrfToken(request) : null;
  const response = NextResponse.json({ ...payload, csrfToken });
  if (csrfToken) {
    attachCsrfCookie(response, csrfToken);
  }
  return response;
}

export async function DELETE(request: NextRequest) {
  const limited = await accountRateLimit(request, {
    key: "account:logout",
    limit: 20,
    windowMs: 5 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }
  if (!validateCsrfRequest(request)) {
    return csrfErrorResponse();
  }

  const token = await getSessionTokenFromCookies();
  await destroyCustomerSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    ...getAccountCookieOptions(),
    maxAge: 0,
  });
  return response;
}
