import { NextRequest, NextResponse } from "next/server";
import {
  createCustomerSession,
  getAccountCookieOptions,
  loginCustomer,
  sessionCookieName,
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
    key: "account:login",
    limit: 8,
    windowMs: 5 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }
  if (!validateCsrfRequest(request)) {
    return csrfErrorResponse();
  }

  const body = (await request.json()) as { email?: string; password?: string };

  try {
    const customer = await loginCustomer(body.email, body.password);
    const session = await createCustomerSession(customer.id);
    const response = NextResponse.json({
      ok: true,
      verificationRequired: !customer.emailVerifiedAt,
    });
    response.cookies.set(sessionCookieName, session.token, getAccountCookieOptions());
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid e-mail or password." },
      { status: 401 },
    );
  }
}
