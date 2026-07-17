import { NextRequest, NextResponse } from "next/server";
import {
  deleteCustomerAddress,
  getCurrentCustomer,
  getCustomerAccountPayload,
  saveCustomerAddress,
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
    key: "account:addresses",
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

  try {
    await saveCustomerAddress(customer.id, await request.json());
    return NextResponse.json(await getCustomerAccountPayload());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save address." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isCustomerAccountEnabled()) {
    return NextResponse.json({ error: "Customer account is not enabled." }, { status: 404 });
  }

  const limited = await accountRateLimit(request, {
    key: "account:addresses",
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

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing address id." }, { status: 400 });
  }

  await deleteCustomerAddress(customer.id, id);
  return NextResponse.json(await getCustomerAccountPayload());
}
