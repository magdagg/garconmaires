import { NextRequest, NextResponse } from "next/server";
import { inpostProvider } from "@/lib/store/shipping/providers/inpost";

export const runtime = "nodejs";

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

function assertRateLimit(request: NextRequest) {
  const key = getClientKey(request);
  const now = Date.now();
  const current = rateLimit.get(key);

  if (!current || current.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }

  current.count += 1;

  if (current.count > 30) {
    throw new Error("Too many parcel locker searches. Try again in a minute.");
  }
}

export async function GET(request: NextRequest) {
  try {
    assertRateLimit(request);
    const query =
      request.nextUrl.searchParams.get("q") ??
      request.nextUrl.searchParams.get("city") ??
      request.nextUrl.searchParams.get("postalCode") ??
      "";
    const normalized = query.trim().slice(0, 80);

    if (normalized.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const provider = inpostProvider();
    const items = provider.findParcelLockers
      ? await provider.findParcelLockers(normalized)
      : [];

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to search parcel lockers.",
      },
      { status: 400 },
    );
  }
}
