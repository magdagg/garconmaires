import type { NewsletterPayload } from "@/lib/newsletter/validation";
import { subscribeToNewsletter } from "@/lib/newsletter/subscribe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as NewsletterPayload | null;
  const result = await subscribeToNewsletter({
    payload,
    headers: request.headers,
  });

  if (result.ok) {
    return Response.json(result);
  }

  const status =
    result.error === "INVALID_EMAIL" ||
    result.error === "CONSENT_REQUIRED" ||
    result.error === "INVALID_SOURCE" ||
    result.error === "INVALID_LANGUAGE" ||
    result.error === "INVALID_REQUEST"
      ? 400
      : result.error === "RATE_LIMITED"
        ? 429
        : 500;

  return Response.json(result, { status });
}
