import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentCustomer,
  requestCustomerAccountDeletion,
  sessionCookieName,
  getAccountCookieOptions,
} from "@/lib/account/auth";
import { isCustomerAccountEnabled } from "@/lib/account/config";
import { accountRateLimit, csrfErrorResponse, validateCsrfRequest } from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isCustomerAccountEnabled()) {
    return NextResponse.json({ error: "Customer account is not enabled." }, { status: 404 });
  }

  const limited = await accountRateLimit(request, {
    key: "account:deletion",
    limit: 3,
    windowMs: 60 * 60 * 1000,
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

  const body = (await request.json()) as { note?: string };
  await requestCustomerAccountDeletion(customer.id, body.note);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    ...getAccountCookieOptions(),
    maxAge: 0,
  });
  return response;
}
