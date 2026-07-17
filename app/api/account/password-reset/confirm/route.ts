import { NextRequest, NextResponse } from "next/server";
import { resetCustomerPassword } from "@/lib/account/auth";
import { isCustomerAccountEnabled } from "@/lib/account/config";
import { accountRateLimit, csrfErrorResponse, validateCsrfRequest } from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isCustomerAccountEnabled()) {
    return NextResponse.json({ error: "Customer account is not enabled." }, { status: 404 });
  }

  const limited = await accountRateLimit(request, {
    key: "account:password-reset-confirm",
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }
  if (!validateCsrfRequest(request)) {
    return csrfErrorResponse();
  }

  const body = (await request.json()) as { token?: string; password?: string; passwordConfirmation?: string };

  try {
    await resetCustomerPassword({
      token: body.token,
      password: body.password,
      passwordConfirmation: body.passwordConfirmation,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid reset token." },
      { status: 400 },
    );
  }
}
