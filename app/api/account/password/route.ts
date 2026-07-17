import { NextRequest, NextResponse } from "next/server";
import {
  changeCustomerPassword,
  getCurrentCustomer,
  getSessionTokenFromCookies,
} from "@/lib/account/auth";
import { isCustomerAccountEnabled } from "@/lib/account/config";
import { accountRateLimit, csrfErrorResponse, validateCsrfRequest } from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  if (!isCustomerAccountEnabled()) {
    return NextResponse.json({ error: "Customer account is not enabled." }, { status: 404 });
  }

  const limited = await accountRateLimit(request, {
    key: "account:password-change",
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

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirmation?: string;
    logoutOtherSessions?: boolean;
  };

  try {
    await changeCustomerPassword(customer.id, {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      newPasswordConfirmation: body.newPasswordConfirmation,
      logoutOtherSessions: body.logoutOtherSessions,
      currentSessionToken: await getSessionTokenFromCookies(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to change password with the provided details." },
      { status: 400 },
    );
  }
}
