import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const csrfCookieName = "gm_customer_csrf";
const csrfHeaderName = "x-csrf-token";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

type RateLimitHit = {
  allowed: boolean;
  retryAfterSeconds?: number;
  storage: "memory" | "upstash";
};

type RateLimitAdapter = {
  hit: (key: string, options: RateLimitOptions, now: number) => Promise<RateLimitHit>;
};

const memoryRateLimitAdapter: RateLimitAdapter = {
  async hit(key, options, now) {
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return { allowed: true, storage: "memory" };
    }

    current.count += 1;
    if (current.count <= options.limit) {
      return { allowed: true, storage: "memory" };
    }

    return {
      allowed: false,
      storage: "memory",
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  },
};

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function durableRateLimitEnv() {
  const restUrl =
    env("ACCOUNT_RATE_LIMIT_REDIS_REST_URL") ||
    env("KV_REST_API_URL") ||
    env("UPSTASH_REDIS_REST_URL") ||
    env("UPSTASH_REDIS_REST_KV_REST_API_URL");
  const restToken =
    env("ACCOUNT_RATE_LIMIT_REDIS_REST_TOKEN") ||
    env("KV_REST_API_TOKEN") ||
    env("UPSTASH_REDIS_REST_TOKEN") ||
    env("UPSTASH_REDIS_REST_KV_REST_API_TOKEN");

  return restUrl && restToken ? { restUrl: restUrl.replace(/\/$/, ""), restToken } : null;
}

async function upstashCommand<T>(command: unknown[]) {
  const config = durableRateLimitEnv();
  if (!config) {
    throw new Error("Durable rate limit storage is not configured.");
  }

  const response = await fetch(`${config.restUrl}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.restToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([command]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Durable rate limit storage returned ${response.status}.`);
  }

  const payload = (await response.json()) as { result?: T; error?: string }[];
  const first = payload[0];
  if (!first || first.error) {
    throw new Error(first?.error || "Durable rate limit storage returned an invalid response.");
  }

  return first.result as T;
}

const upstashRateLimitAdapter: RateLimitAdapter = {
  async hit(key, options) {
    const redisKey = `gm:account:rate-limit:${key}`;
    const count = await upstashCommand<number>(["INCR", redisKey]);
    if (count === 1) {
      await upstashCommand<"OK">(["PEXPIRE", redisKey, options.windowMs]);
    }

    if (count <= options.limit) {
      return { allowed: true, storage: "upstash" };
    }

    const ttlMs = await upstashCommand<number>(["PTTL", redisKey]);
    return {
      allowed: false,
      storage: "upstash",
      retryAfterSeconds: Math.max(1, Math.ceil(Math.max(ttlMs, 0) / 1000)),
    };
  },
};

function getRateLimitAdapter() {
  return durableRateLimitEnv() ? upstashRateLimitAdapter : memoryRateLimitAdapter;
}

export function getAccountRateLimitDiagnostics() {
  const durableConfigured = Boolean(durableRateLimitEnv());

  return {
    storage: durableConfigured ? "upstash" as const : "memory" as const,
    durableConfigured,
    productionReady: durableConfigured,
    requiredEnv: [
      "ACCOUNT_RATE_LIMIT_REDIS_REST_URL or KV_REST_API_URL or UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_KV_REST_API_URL",
      "ACCOUNT_RATE_LIMIT_REDIS_REST_TOKEN or KV_REST_API_TOKEN or UPSTASH_REDIS_REST_TOKEN or UPSTASH_REDIS_REST_KV_REST_API_TOKEN",
    ],
    warnings: durableConfigured
      ? []
      : ["Account rate limit uses in-memory storage; production public auth requires durable/edge-backed storage."],
  };
}

function clientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCsrfToken() {
  return randomBytes(32).toString("base64url");
}

export function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}

export function getOrCreateCsrfToken(request: NextRequest) {
  return request.cookies.get(csrfCookieName)?.value ?? createCsrfToken();
}

export function attachCsrfCookie(response: NextResponse, token: string) {
  response.cookies.set(csrfCookieName, token, getCsrfCookieOptions());
}

export function validateCsrfRequest(request: NextRequest) {
  const cookieToken = request.cookies.get(csrfCookieName)?.value;
  const headerToken = request.headers.get(csrfHeaderName);
  return Boolean(cookieToken && headerToken && safeCompare(cookieToken, headerToken));
}

export function csrfErrorResponse() {
  return NextResponse.json({ error: "Security token is missing or invalid." }, { status: 403 });
}

export async function accountRateLimit(request: NextRequest, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.key}:${clientIp(request)}`;
  const durableConfigured = Boolean(durableRateLimitEnv());
  let hit: RateLimitHit;

  if (process.env.VERCEL_ENV === "production" && !durableConfigured) {
    console.error("[account-rate-limit] durable storage missing in production", {
      key: options.key,
    });
    return NextResponse.json(
      { error: "Rate limit protection is not configured." },
      { status: 503 },
    );
  }

  try {
    hit = await getRateLimitAdapter().hit(key, options, now);
  } catch (error) {
    if (process.env.VERCEL_ENV === "production") {
      console.error("[account-rate-limit] durable storage failed", {
        key: options.key,
        error: error instanceof Error ? error.message : "Unknown rate limit error.",
      });
      return NextResponse.json(
        { error: "Rate limit protection is temporarily unavailable." },
        { status: 503 },
      );
    }

    console.warn("[account-rate-limit] durable storage failed; using memory fallback", {
      key: options.key,
      error: error instanceof Error ? error.message : "Unknown rate limit error.",
    });
    hit = await memoryRateLimitAdapter.hit(key, options, now);
  }

  if (hit.allowed) {
    return null;
  }

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(hit.retryAfterSeconds ?? 60),
        "X-RateLimit-Storage": hit.storage,
      },
    },
  );
}

export { csrfCookieName, csrfHeaderName };
