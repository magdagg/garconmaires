import { list, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type NewsletterSubscriber = {
  email: string;
  createdAt: string;
  locale?: "pl" | "en";
  source: "footer";
  consent: true;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const newsletterFilePath = path.join(
  process.cwd(),
  "data",
  "newsletter-subscribers.json",
);
const newsletterBlobPrefix = "newsletter/subscribers/";

function getSubscriberBlobPath(email: string) {
  return `${newsletterBlobPrefix}${Buffer.from(email).toString("base64url")}.json`;
}

async function readSubscribers() {
  try {
    const file = await readFile(newsletterFilePath, "utf8");
    const parsed = JSON.parse(file) as NewsletterSubscriber[];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("no such file")) {
      return [];
    }

    return [];
  }
}

async function writeSubscribers(subscribers: NewsletterSubscriber[]) {
  await mkdir(path.dirname(newsletterFilePath), { recursive: true });
  await writeFile(newsletterFilePath, JSON.stringify(subscribers, null, 2));
}

async function persistSubscriber(subscriber: NewsletterSubscriber) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (token) {
    const pathname = getSubscriberBlobPath(subscriber.email);
    const existing = await list({
      prefix: pathname,
      token,
    });

    if (existing.blobs.length === 0) {
      await put(pathname, JSON.stringify(subscriber, null, 2), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
        token,
      });
    }

    return;
  }

  const subscribers = await readSubscribers();
  const exists = subscribers.some((entry) => entry.email === subscriber.email);

  if (!exists) {
    subscribers.push(subscriber);
    await writeSubscribers(subscribers);
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | {
        email?: unknown;
        locale?: unknown;
        source?: unknown;
        consent?: unknown;
      }
    | null;

  const email =
    typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const locale = payload?.locale === "en" ? "en" : payload?.locale === "pl" ? "pl" : undefined;
  const source = payload?.source === "footer" ? "footer" : null;
  const consent = payload?.consent === true;

  if (!emailPattern.test(email)) {
    return Response.json(
      {
        ok: false,
        message:
          locale === "en"
            ? "Please enter a valid email address."
            : "Wpisz poprawny adres email.",
      },
      { status: 400 },
    );
  }

  if (!source || !consent) {
    return Response.json(
      {
        ok: false,
        message: locale === "en" ? "Invalid request." : "Nieprawidłowe żądanie.",
      },
      { status: 400 },
    );
  }

  await persistSubscriber({
    email,
    createdAt: new Date().toISOString(),
    locale,
    source,
    consent: true,
  });

  return Response.json({ ok: true });
}
