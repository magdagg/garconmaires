import type { Locale } from "@/lib/i18n";

const COOKIE_CONSENT_KEY = "garconmaires_cookie_consent";
const COOKIE_CONSENT_VERSION = "1";
const OPEN_PREFERENCES_EVENT = "garconmaires:open-cookie-preferences";

type CookieConsentProps = {
  locale: Locale;
};

type CookieCopy = {
  title: string;
  body: string;
  acceptAll: string;
  rejectAll: string;
  manage: string;
  preferencesTitle: string;
  savePreferences: string;
  close: string;
  necessaryLabel: string;
  necessaryBody: string;
  analyticsLabel: string;
  analyticsBody: string;
  marketingLabel: string;
  marketingBody: string;
  alwaysActive: string;
};

const copyByLocale: Record<Locale, CookieCopy> = {
  pl: {
    title: "ZGODA NA PLIKI COOKIE",
    body: "Używamy niezbędnych plików cookie, aby strona działała poprawnie. Za Twoją zgodą możemy używać także plików analitycznych i marketingowych, aby mierzyć skuteczność oraz ulepszać doświadczenie.",
    acceptAll: "Akceptuję wszystkie",
    rejectAll: "Odrzucam wszystkie",
    manage: "Ustawienia",
    preferencesTitle: "Ustawienia cookie",
    savePreferences: "Zapisz ustawienia",
    close: "Zamknij",
    necessaryLabel: "Niezbędne",
    necessaryBody: "Wymagane do prawidłowego działania strony. Zawsze aktywne.",
    analyticsLabel: "Analityczne",
    analyticsBody: "Pomagają zrozumieć, jak odwiedzający korzystają ze strony.",
    marketingLabel: "Marketingowe",
    marketingBody: "Służą do reklam i pomiaru skuteczności kampanii.",
    alwaysActive: "Zawsze aktywne",
  },
  en: {
    title: "COOKIE CONSENT",
    body: "We use necessary cookies to make the site work. With your consent, we may also use analytics or marketing cookies to understand performance and improve the experience.",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    manage: "Manage preferences",
    preferencesTitle: "Cookie preferences",
    savePreferences: "Save preferences",
    close: "Close",
    necessaryLabel: "Necessary",
    necessaryBody: "Required for the website to function. Always active.",
    analyticsLabel: "Analytics",
    analyticsBody: "Helps us understand how visitors use the website.",
    marketingLabel: "Marketing",
    marketingBody: "Used for advertising and campaign measurement.",
    alwaysActive: "Always active",
  },
};

function getCookieConsentScript() {
  return `
(() => {
  const STORAGE_KEY = ${JSON.stringify(COOKIE_CONSENT_KEY)};
  const VERSION = ${JSON.stringify(COOKIE_CONSENT_VERSION)};
  const OPEN_EVENT = ${JSON.stringify(OPEN_PREFERENCES_EVENT)};
  const banner = document.getElementById("cookie-consent-banner");
  const modal = document.getElementById("cookie-consent-modal");
  const analyticsInput = document.getElementById("cookie-consent-analytics");
  const marketingInput = document.getElementById("cookie-consent-marketing");

  if (!banner || !modal || !analyticsInput || !marketingInput) {
    return;
  }

  const save = (value) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("garconmaires:cookie-consent-changed", { detail: value }));
  };

  const read = () => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);

      if (
        parsed &&
        parsed.necessary === true &&
        typeof parsed.analytics === "boolean" &&
        typeof parsed.marketing === "boolean" &&
        typeof parsed.updatedAt === "string" &&
        parsed.version === VERSION
      ) {
        return parsed;
      }
    } catch {}

    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  };

  const createState = (analytics, marketing) => ({
    necessary: true,
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
    version: VERSION,
  });

  const syncInputs = (consent) => {
    analyticsInput.checked = Boolean(consent && consent.analytics);
    marketingInput.checked = Boolean(consent && consent.marketing);
  };

  const hideBanner = () => {
    banner.hidden = true;
  };

  const showBanner = () => {
    banner.hidden = false;
  };

  const hideModal = () => {
    modal.hidden = true;
  };

  const showModal = () => {
    modal.hidden = false;
  };

  const applyConsent = (consent) => {
    save(consent);
    syncInputs(consent);
    hideBanner();
    hideModal();

    // TODO: Load analytics scripts only when consent.analytics === true.
    // TODO: Load marketing scripts only when consent.marketing === true.
  };

  const openPreferences = () => {
    syncInputs(read());
    hideBanner();
    showModal();
  };

  const closePreferences = () => {
    hideModal();
    if (!read()) {
      showBanner();
    }
  };

  const bindClick = (selector, handler) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.addEventListener("click", handler);
    });
  };

  bindClick('[data-cookie-action="accept-all"]', () => {
    applyConsent(createState(true, true));
  });

  bindClick('[data-cookie-action="reject-all"]', () => {
    applyConsent(createState(false, false));
  });

  bindClick('[data-cookie-action="manage"]', () => {
    openPreferences();
  });

  bindClick('[data-cookie-settings-trigger="true"]', () => {
    openPreferences();
  });

  bindClick('[data-cookie-action="save-preferences"]', () => {
    applyConsent(createState(analyticsInput.checked, marketingInput.checked));
  });

  bindClick('[data-cookie-action="close-preferences"]', () => {
    closePreferences();
  });

  window.addEventListener(OPEN_EVENT, openPreferences);

  const initialConsent = read();
  syncInputs(initialConsent);

  if (initialConsent) {
    hideBanner();
    hideModal();
  } else {
    showBanner();
    hideModal();
  }
})();
`;
}

function ToggleRow({
  inputId,
  label,
  body,
  disabled = false,
  checked = false,
  badge,
  toggleName,
}: {
  inputId: string;
  label: string;
  body: string;
  disabled?: boolean;
  checked?: boolean;
  badge?: string;
  toggleName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border border-white/10 bg-white/[0.02] px-4 py-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm text-white">{label}</h3>
          {badge ? (
            <span className="font-label text-[9px] tracking-[0.18em] text-white/38 uppercase">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-7 text-white/68">{body}</p>
      </div>
      <label
        data-cookie-toggle={toggleName}
        className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center"
      >
        <input
          id={inputId}
          type="checkbox"
          defaultChecked={checked}
          disabled={disabled}
          className="peer sr-only"
          aria-label={label}
        />
        <span className="pointer-events-none relative inline-flex h-[1.75rem] w-[3.25rem] items-center rounded-full border border-white/18 bg-white/[0.06] transition peer-checked:border-white peer-checked:bg-white peer-disabled:cursor-default peer-disabled:opacity-80">
          <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-6 peer-checked:bg-black" />
        </span>
      </label>
    </div>
  );
}

export function CookieConsent({ locale }: CookieConsentProps) {
  const t = copyByLocale[locale];

  return (
    <>
      <div
        id="cookie-consent-banner"
        hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] px-3 pb-3 sm:px-4 sm:pb-4"
      >
        <div className="pointer-events-auto mx-auto w-full max-w-5xl border border-white/12 bg-black/96 shadow-[0_-12px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="grid gap-6 px-4 py-4 sm:px-5 sm:py-5 md:grid-cols-[1.45fr_auto] md:items-end">
            <div className="space-y-3">
              <p className="font-label text-[10px] tracking-[0.24em] text-white/42 uppercase">
                {t.title}
              </p>
              <p className="max-w-2xl text-[14px] leading-7 text-white/72 sm:text-[15px]">
                {t.body}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 md:min-w-[27rem]">
              <button
                type="button"
                data-cookie-action="accept-all"
                className="min-h-11 border border-white/18 bg-white px-4 text-[11px] tracking-[0.18em] text-black uppercase hover:bg-white/92"
              >
                {t.acceptAll}
              </button>
              <button
                type="button"
                data-cookie-action="reject-all"
                className="min-h-11 border border-white/18 bg-transparent px-4 text-[11px] tracking-[0.18em] text-white uppercase hover:border-white/36 hover:bg-white/[0.04]"
              >
                {t.rejectAll}
              </button>
              <button
                type="button"
                data-cookie-action="manage"
                className="min-h-11 border border-white/18 bg-transparent px-4 text-[11px] tracking-[0.18em] text-white/84 uppercase hover:border-white/36 hover:bg-white/[0.04] hover:text-white"
              >
                {t.manage}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        id="cookie-consent-modal"
        hidden
        className="pointer-events-auto fixed inset-0 z-[130] flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      >
        <div className="pointer-events-auto w-full max-w-2xl border border-white/12 bg-[#0a0a0a] shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
            <div className="space-y-2">
              <p className="font-label text-[10px] tracking-[0.24em] text-white/42 uppercase">
                {t.title}
              </p>
              <h2 className="font-display text-xl leading-tight text-white sm:text-2xl">
                {t.preferencesTitle}
              </h2>
            </div>
            <button
              type="button"
              data-cookie-action="close-preferences"
              className="font-label min-h-10 min-w-10 border border-white/12 px-3 text-[10px] tracking-[0.22em] text-white/66 uppercase hover:border-white/28 hover:text-white"
              aria-label={locale === "pl" ? "Zamknij ustawienia cookie" : "Close cookie settings"}
            >
              {t.close}
            </button>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
            <ToggleRow
              inputId="cookie-consent-necessary"
              label={t.necessaryLabel}
              body={t.necessaryBody}
              checked
              disabled
              badge={t.alwaysActive}
            />
            <ToggleRow
              inputId="cookie-consent-analytics"
              label={t.analyticsLabel}
              body={t.analyticsBody}
              toggleName="analytics"
            />
            <ToggleRow
              inputId="cookie-consent-marketing"
              label={t.marketingLabel}
              body={t.marketingBody}
              toggleName="marketing"
            />
          </div>

          <div className="grid gap-2 border-t border-white/10 px-4 py-4 sm:grid-cols-3 sm:px-6 sm:py-5">
            <button
              type="button"
              data-cookie-action="save-preferences"
              className="min-h-11 border border-white/18 bg-white px-4 text-[11px] tracking-[0.18em] text-black uppercase hover:bg-white/92"
            >
              {t.savePreferences}
            </button>
            <button
              type="button"
              data-cookie-action="reject-all"
              className="min-h-11 border border-white/18 bg-transparent px-4 text-[11px] tracking-[0.18em] text-white uppercase hover:border-white/36 hover:bg-white/[0.04]"
            >
              {t.rejectAll}
            </button>
            <button
              type="button"
              data-cookie-action="accept-all"
              className="min-h-11 border border-white/18 bg-transparent px-4 text-[11px] tracking-[0.18em] text-white uppercase hover:border-white/36 hover:bg-white/[0.04]"
            >
              {t.acceptAll}
            </button>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: getCookieConsentScript(),
        }}
      />
    </>
  );
}
