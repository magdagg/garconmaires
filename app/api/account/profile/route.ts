import { NextRequest, NextResponse } from "next/server";
import { getCurrentCustomer, getCustomerAccountPayload, updateCustomerProfile } from "@/lib/account/auth";
import { isCustomerAccountEnabled } from "@/lib/account/config";
import { accountRateLimit, csrfErrorResponse, validateCsrfRequest } from "@/lib/account/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  if (!isCustomerAccountEnabled()) {
    return NextResponse.json({ error: "Customer account is not enabled." }, { status: 404 });
  }

  const limited = await accountRateLimit(request, {
    key: "account:profile",
    limit: 30,
    windowMs: 5 * 60 * 1000,
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
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    marketingConsent?: boolean;
  };

  try {
    await updateCustomerProfile(customer.id, body);
    return NextResponse.json(await getCustomerAccountPayload());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update profile." },
      { status: 400 },
    );
  }
}
