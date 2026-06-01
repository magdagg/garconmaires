"use client";

import { useId, useState, type FormEvent } from "react";

type NewsletterFormProps = {
  source: string;
  language?: "pl" | "en";
  variant?: "footer" | "section" | "minimal" | "hero";
  submitLabel?: string;
  successMessage?: string;
};

type SubmissionTone = "idle" | "error" | "success";

type ApiErrorCode =
  | "INVALID_EMAIL"
  | "CONSENT_REQUIRED"
  | "INVALID_SOURCE"
  | "INVALID_LANGUAGE"
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const copyByLanguage = {
  pl: {
    placeholder: "Wpisz swój adres e-mail",
    consent:
      "Wyrażam zgodę na otrzymywanie wiadomości marketingowych i informacji o premierach kolekcji Garçonmaires. Wiem, że mogę wypisać się w każdej chwili.",
    button: "Zapisz się",
    buttonLoading: "Zapisywanie...",
    success: "Dziękujemy za zapis. Sprawdź swoją skrzynkę mailową.",
    consentMissing: "Zgoda marketingowa jest wymagana.",
    invalidEmail: "Wpisz poprawny adres e-mail.",
    genericError: "Nie udało się zapisać. Spróbuj ponownie.",
    rateLimited: "Za dużo prób. Spróbuj ponownie za chwilę.",
    honeypotLabel: "Nie wypełniaj tego pola",
  },
  en: {
    placeholder: "Enter your email address",
    consent:
      "I agree to receive marketing emails and updates about Garçonmaires collections. I know I can unsubscribe at any time.",
    button: "Subscribe",
    buttonLoading: "Submitting...",
    success: "Thank you for subscribing. Please check your inbox.",
    consentMissing: "Marketing consent is required.",
    invalidEmail: "Please enter a valid email address.",
    genericError: "Unable to subscribe right now. Please try again.",
    rateLimited: "Too many attempts. Please try again soon.",
    honeypotLabel: "Do not fill out this field",
  },
} satisfies Record<
  NonNullable<NewsletterFormProps["language"]>,
  {
    placeholder: string;
    consent: string;
    button: string;
    buttonLoading: string;
    success: string;
    consentMissing: string;
    invalidEmail: string;
    genericError: string;
    rateLimited: string;
    honeypotLabel: string;
  }
>;

function getVariantClasses(variant: NonNullable<NewsletterFormProps["variant"]>) {
  switch (variant) {
    case "hero":
      return {
        form: "space-y-3",
        grid: "grid gap-2.5 md:grid-cols-[minmax(0,1fr)_auto]",
        input:
          "min-h-11 w-full border border-white/12 bg-black/32 px-3.5 text-[13px] text-white outline-none placeholder:text-white/32 focus:border-white/36",
        button:
          "min-h-11 border border-white/12 bg-white px-4 text-[9px] tracking-[0.2em] text-black uppercase hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-60",
        consent: "max-w-[24rem] text-[10px] leading-[1.1rem] text-white/42",
      };
    case "minimal":
      return {
        form: "space-y-4",
        grid: "grid gap-3",
        input:
          "min-h-12 w-full border border-white/14 bg-transparent px-4 text-[14px] text-white outline-none placeholder:text-white/28 focus:border-white/40",
        button:
          "min-h-12 border border-white/16 bg-white px-5 text-[11px] tracking-[0.18em] text-black uppercase hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-60",
        consent: "text-xs leading-6 text-white/44",
      };
    case "section":
      return {
        form: "space-y-4",
        grid: "grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]",
        input:
          "min-h-12 w-full border border-white/16 bg-black/20 px-4 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-white/42",
        button:
          "min-h-12 border border-white/18 bg-white px-5 text-[11px] tracking-[0.18em] text-black uppercase hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-60",
        consent: "text-xs leading-6 text-white/50",
      };
    case "footer":
    default:
      return {
        form: "space-y-4",
        grid: "grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]",
        input:
          "min-h-12 w-full border border-white/16 bg-black/25 px-4 text-[14px] text-white outline-none placeholder:text-white/28 focus:border-white/42",
        button:
          "min-h-12 border border-white/18 bg-white px-5 text-[11px] tracking-[0.18em] text-black uppercase hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-60",
        consent: "text-xs leading-6 text-white/42",
      };
  }
}

function getMessageForError(code: ApiErrorCode | null, language: "pl" | "en") {
  const t = copyByLanguage[language];

  switch (code) {
    case "INVALID_EMAIL":
      return t.invalidEmail;
    case "CONSENT_REQUIRED":
      return t.consentMissing;
    case "RATE_LIMITED":
      return t.rateLimited;
    default:
      return t.genericError;
  }
}

export function NewsletterForm({
  source,
  language = "pl",
  variant = "section",
  submitLabel,
  successMessage,
}: NewsletterFormProps) {
  const t = copyByLanguage[language];
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tone, setTone] = useState<SubmissionTone>("idle");
  const [message, setMessage] = useState("");
  const consentId = useId();
  const inputId = useId();
  const websiteId = useId();
  const styles = getVariantClasses(variant);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      setTone("error");
      setMessage(t.invalidEmail);
      return;
    }

    if (!consent) {
      setTone("error");
      setMessage(t.consentMissing);
      return;
    }

    setIsSubmitting(true);
    setTone("idle");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          source,
          language,
          consent,
          website,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; status?: string; error?: ApiErrorCode }
        | null;

      if (!response.ok || !payload?.ok) {
        setTone("error");
        setMessage(getMessageForError(payload?.error ?? null, language));
        return;
      }

      setEmail("");
      setWebsite("");
      setTone("success");
      setMessage(successMessage ?? t.success);
    } catch {
      setTone("error");
      setMessage(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
      >
        <label htmlFor={websiteId}>{t.honeypotLabel}</label>
        <input
          id={websiteId}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <div className={styles.grid}>
        <input
          id={inputId}
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
          className={styles.input}
        />
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? t.buttonLoading : submitLabel ?? t.button}
        </button>
      </div>

      <div className="space-y-2">
        <label htmlFor={consentId} className="flex items-start gap-3">
          <input
            id={consentId}
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              if (tone !== "idle") {
                setTone("idle");
                setMessage("");
              }
            }}
            className="mt-1 h-4 w-4 rounded-none border border-white/30 bg-transparent accent-white"
          />
          <span className={styles.consent}>{t.consent}</span>
        </label>
        <p
          aria-live="polite"
          className={
            tone === "error"
              ? "text-sm leading-6 text-white/80"
              : tone === "success"
                ? "text-sm leading-6 text-white/88"
                : "text-sm leading-6 text-transparent"
          }
        >
          {message || "."}
        </p>
      </div>
    </form>
  );
}
