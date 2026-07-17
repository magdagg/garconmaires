import { NextRequest, NextResponse } from "next/server";
import {
  destroyAllCustomerSessions,
  getAccountCookieOptions,
  getCurrentCustomer,
  sessionCookieName,
} from "@/lib/account/auth";
import { isCustomerAccountEnabled } from "@/lib/account/config";
import { accountRateLimit, csrfErrorResponse, validateCsrfRequest } from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  if (!isCustomerAccountEnabled()) {
    return NextResponse.json({ error: "Customer account is not enabled." }, { status: 404 });
  }

  const limited = await accountRateLimit(request, {
    key: "account:sessions-delete",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }
  if (!validateCsrfRequest(request)) {
    return csrfErrorResponse();
  }

  const customer = await getCurrentCustomer();
  if (!customer || !customer.emailVerifiedAt) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await destroyAllCustomerSessions(customer.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    ...getAccountCookieOptions(),
    maxAge: 0,
  });
  return response;
}
