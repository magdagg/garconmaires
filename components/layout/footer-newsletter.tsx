"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n";

type FooterNewsletterProps = {
  locale: Locale;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const copyByLocale = {
  pl: {
    title: "DOŁĄCZ DO LISTY",
    body: "Otrzymuj informacje o DROP 01, nowych kolekcjach i wcześniejszym dostępie.",
    placeholder: "Adres email",
    button: "DOŁĄCZ",
    submitting: "...",
    success: "Jesteś na liście.",
    error: "Wpisz poprawny adres email.",
    genericError: "Nie udało się zapisać. Spróbuj ponownie.",
    consent:
      "Dołączając, wyrażasz zgodę na otrzymywanie informacji od Garçonmaires. Możesz wypisać się w dowolnym momencie.",
  },
  en: {
    title: "JOIN THE LIST",
    body: "Receive updates about DROP 01, new releases and private previews.",
    placeholder: "Email address",
    button: "JOIN",
    submitting: "...",
    success: "You’re on the list.",
    error: "Please enter a valid email address.",
    genericError: "Unable to subscribe right now. Please try again.",
    consent:
      "By joining, you agree to receive Garçonmaires updates. You can unsubscribe at any time.",
  },
} satisfies Record<
  Locale,
  {
    title: string;
    body: string;
    placeholder: string;
    button: string;
    submitting: string;
    success: string;
    error: string;
    genericError: string;
    consent: string;
  }
>;

export function FooterNewsletter({ locale }: FooterNewsletterProps) {
  const t = copyByLocale[locale];
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "error" | "success">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      setTone("error");
      setMessage(t.error);
      return;
    }

    setIsSubmitting(true);
    setTone("idle");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          locale,
          source: "footer",
          consent: true,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        setTone("error");
        setMessage(payload?.message ?? t.genericError);
        return;
      }

      setEmail("");
      setTone("success");
      setMessage(t.success);
    } catch {
      setTone("error");
      setMessage(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="border-b border-white/10">
      <div className="site-shell px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div className="space-y-3">
            <p className="font-label text-[10px] tracking-[0.24em] text-white/42 uppercase">
              {t.title}
            </p>
            <p className="mx-auto max-w-2xl text-[15px] leading-8 text-white/72 sm:text-[16px]">
              {t.body}
            </p>
          </div>

          <form className="mx-auto max-w-2xl space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t.placeholder}
                aria-label={t.placeholder}
                aria-invalid={tone === "error" ? "true" : "false"}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (tone !== "idle") {
                    setTone("idle");
                    setMessage("");
                  }
                }}
                className="min-h-12 w-full border border-white/14 bg-transparent px-4 text-[14px] text-white outline-none placeholder:text-white/28 focus:border-white/36"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 border border-white/18 bg-white px-5 text-[11px] tracking-[0.18em] text-black uppercase hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t.submitting : t.button}
              </button>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-xs leading-6 text-white/42">{t.consent}</p>
              <p
                aria-live="polite"
                className={
                  tone === "error"
                    ? "text-sm leading-6 text-white/78"
                    : tone === "success"
                      ? "text-sm leading-6 text-white/86"
                      : "text-sm leading-6 text-transparent"
                }
              >
                {message || "."}
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

