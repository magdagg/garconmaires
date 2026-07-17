import { NextRequest, NextResponse } from "next/server";
import {
  createCustomerSession,
  getAccountCookieOptions,
  registerCustomer,
  sendCustomerVerificationEmail,
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
    key: "account:register",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (limited) {
    return limited;
  }
  if (!validateCsrfRequest(request)) {
    return csrfErrorResponse();
  }

  const body = (await request.json()) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
    marketingConsent?: boolean;
    locale?: "pl" | "en";
  };

  try {
    const customer = await registerCustomer(body);
    await sendCustomerVerificationEmail({
      customerId: customer.id,
      baseUrl: request.nextUrl.origin,
      locale: body.locale,
    });
    const session = await createCustomerSession(customer.id);
    const response = NextResponse.json({
      ok: true,
      awaitingVerification: true,
      message: "Your account has been created. Check your inbox and verify your e-mail address.",
    });
    response.cookies.set(sessionCookieName, session.token, getAccountCookieOptions());
    return response;
  } catch (error) {
    const message =
      error instanceof Error &&
      (error.message === "Invalid e-mail address." ||
        error.message === "Password must have at least 10 characters." ||
        error.message === "Passwords do not match.")
        ? error.message
        : error instanceof Error && error.message === "Account already exists."
          ? "Unable to create account with the provided details."
        : "Unable to create account with the provided details.";

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
