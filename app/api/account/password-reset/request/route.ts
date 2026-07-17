import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/account/auth";
import { isCustomerAccountEnabled } from "@/lib/account/config";
import { accountRateLimit, csrfErrorResponse, validateCsrfRequest } from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isCustomerAccountEnabled()) {
    return NextResponse.json({ error: "Customer account is not enabled." }, { status: 404 });
  }

  const limited = await accountRateLimit(request, {
    key: "account:password-reset-request",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }
  if (!validateCsrfRequest(request)) {
    return csrfErrorResponse();
  }

  const body = (await request.json()) as { email?: string; locale?: "pl" | "en" };
  await requestPasswordReset({ email: body.email, baseUrl: request.nextUrl.origin, locale: body.locale });

  return NextResponse.json({
    ok: true,
    message: "If the account exists, password reset instructions will be sent.",
  });
}
