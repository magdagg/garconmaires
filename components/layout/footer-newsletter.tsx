import type { Locale } from "@/lib/i18n";

type FooterNewsletterProps = {
  locale: Locale;
};

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

function getNewsletterScript(locale: Locale) {
  const t = copyByLocale[locale];

  return `
(() => {
  const root = document.querySelector('[data-newsletter-root="${locale}"]');

  if (!root) {
    return;
  }

  const form = root.querySelector('[data-newsletter-form]');
  const input = root.querySelector('[data-newsletter-input]');
  const button = root.querySelector('[data-newsletter-button]');
  const message = root.querySelector('[data-newsletter-message]');

  if (!form || !input || !button || !message) {
    return;
  }

  const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  let isSubmitting = false;

  const setMessage = (value, tone) => {
    message.textContent = value || '.';
    message.dataset.tone = tone || 'idle';
    message.className = tone === 'error'
      ? 'text-sm leading-6 text-white/78'
      : tone === 'success'
        ? 'text-sm leading-6 text-white/86'
        : 'text-sm leading-6 text-transparent';
  };

  const setSubmitting = (nextValue) => {
    isSubmitting = nextValue;
    button.disabled = nextValue;
    button.textContent = nextValue ? ${JSON.stringify(t.submitting)} : ${JSON.stringify(t.button)};
  };

  input.addEventListener('input', () => {
    if (message.dataset.tone !== 'idle') {
      setMessage('', 'idle');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const email = String(input.value || '').trim().toLowerCase();

    if (!emailPattern.test(email)) {
      setMessage(${JSON.stringify(t.error)}, 'error');
      return;
    }

    setSubmitting(true);
    setMessage('', 'idle');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          locale: ${JSON.stringify(locale)},
          source: 'footer',
          consent: true,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload || payload.ok !== true) {
        setMessage(payload && payload.message ? payload.message : ${JSON.stringify(t.genericError)}, 'error');
        return;
      }

      input.value = '';
      setMessage(${JSON.stringify(t.success)}, 'success');
    } catch {
      setMessage(${JSON.stringify(t.genericError)}, 'error');
    } finally {
      setSubmitting(false);
    }
  });
})();
`;
}

export function FooterNewsletter({ locale }: FooterNewsletterProps) {
  const t = copyByLocale[locale];

  return (
    <section className="border-b border-white/10" data-newsletter-root={locale}>
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

          <form className="mx-auto max-w-2xl space-y-4" data-newsletter-form noValidate>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t.placeholder}
                aria-label={t.placeholder}
                data-newsletter-input
                className="min-h-12 w-full border border-white/14 bg-transparent px-4 text-[14px] text-white outline-none placeholder:text-white/28 focus:border-white/36"
              />
              <button
                type="submit"
                data-newsletter-button
                className="min-h-12 border border-white/18 bg-white px-5 text-[11px] tracking-[0.18em] text-black uppercase hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t.button}
              </button>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-xs leading-6 text-white/42">{t.consent}</p>
              <p aria-live="polite" data-newsletter-message className="text-sm leading-6 text-transparent">
                .
              </p>
            </div>
          </form>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: getNewsletterScript(locale),
        }}
      />
    </section>
  );
}

