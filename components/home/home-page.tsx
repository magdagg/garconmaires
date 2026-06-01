"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { type Locale } from "@/lib/i18n";

const HERO_NEWSLETTER_DISMISS_KEY = "garconmaires-newsletter-dismissed";
const HERO_NEWSLETTER_EVENT = "garconmaires-newsletter-dismissed-change";
const manifestCopy = {
  label: "MANIFEST",
  headline: (
    <>
      Born in Warsaw.
      <br />
      Dressed in noir.
    </>
  ),
  body: [
    "Garçonmaires to polska marka odzieżowa, łącząca streetwear z elegancją. Stworzona w Warszawie, czerpie inspirację z polskiej kultury.",
    "Przepełniona symboliką marka, łączy elementy karciane w swojej estetyce.",
    "Buduje własny język - chłodny, wyrazisty, zakorzeniony w miejscu, z którego pochodzi.",
    "Warszawa pozostaje dla marki punktem odniesienia. Nie jako pocztówkowy obraz miasta, ale jako atmosfera: szkło, beton, metal, cień, ruch, surowość i kontrast.",
    "Garçonmaires przenosi ten kontekst na formę, znak i sposób obecności.",
    "Powstaje wokół czerni i wyrazistej symboliki.",
  ],
};

function subscribeToHeroNewsletterDismiss(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(HERO_NEWSLETTER_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(HERO_NEWSLETTER_EVENT, handler);
  };
}

function getHeroNewsletterDismissSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(HERO_NEWSLETTER_DISMISS_KEY) === "true";
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function HomePage({ locale = "pl" }: { locale?: Locale }) {
  const isHeroNewsletterDismissed = useSyncExternalStore(
    subscribeToHeroNewsletterDismiss,
    getHeroNewsletterDismissSnapshot,
    () => false,
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const manifestSectionRef = useRef<HTMLElement | null>(null);
  const manifestParagraphRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const [isManifestVisible, setIsManifestVisible] = useState(false);
  const [visibleManifestParagraphs, setVisibleManifestParagraphs] = useState<number[]>([]);
  const [manifestParallaxOffset, setManifestParallaxOffset] = useState(0);
  const manifestVisible = prefersReducedMotion || isManifestVisible;
  const manifestParagraphVisibility = prefersReducedMotion
    ? manifestCopy.body.map((_, index) => index)
    : visibleManifestParagraphs;
  const heroNewsletterCopy =
    locale === "pl"
      ? {
          eyebrow: "DROP 01 WKRÓTCE",
          title: "Dołącz przed premierą.",
          description: "Otrzymaj wcześniejszy dostęp do pierwszej kolekcji.",
          button: "DOŁĄCZ",
          success: "Dziękujemy. Jesteś na liście.",
          closeLabel: "Zamknij panel newslettera",
        }
      : {
          eyebrow: "DROP 01 SOON",
          title: "Join before the launch.",
          description: "Get early access to the first collection.",
          button: "JOIN",
          success: "Thank you. You're on the list.",
          closeLabel: "Close newsletter panel",
        };

  function dismissHeroNewsletter() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(HERO_NEWSLETTER_DISMISS_KEY, "true");
      window.dispatchEvent(new Event(HERO_NEWSLETTER_EVENT));
    }
  }

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const section = manifestSectionRef.current;
    if (!section) {
      return;
    }

    const sectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsManifestVisible(true);
          sectionObserver.disconnect();
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    sectionObserver.observe(section);

    const paragraphObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const paragraphIndex = Number(entry.target.getAttribute("data-manifest-index"));
          setVisibleManifestParagraphs((current) =>
            current.includes(paragraphIndex) ? current : [...current, paragraphIndex],
          );
          paragraphObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    manifestParagraphRefs.current.forEach((paragraph) => {
      if (paragraph) {
        paragraphObserver.observe(paragraph);
      }
    });

    return () => {
      sectionObserver.disconnect();
      paragraphObserver.disconnect();
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const section = manifestSectionRef.current;
    if (!section) {
      return;
    }

    let frame = 0;

    const updateParallax = () => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clampedProgress = Math.min(Math.max(progress, 0), 1);
      setManifestParallaxOffset((clampedProgress - 0.5) * 24);
    };

    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="bg-black text-white">
      <section
        id="hero"
        className="relative isolate overflow-hidden bg-black"
      >
        <video
          className="block h-auto w-full min-h-[32rem] object-cover md:min-h-[40rem]"
          src="/brand/home-hero-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.16)_34%,rgba(0,0,0,0.54)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_76%,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_84%_26%,rgba(255,255,255,0.03),transparent_16%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.18)_58%,#000_100%)] md:h-12" />
      </section>
      {/* HERO SECTION ENDS HERE */}

      <section
        aria-label="First drop coming soon"
        className="marquee-strip relative overflow-hidden border-y border-white/10 bg-black py-3 sm:py-4"
      >
        <div className="marquee-strip__track" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <div key={`first-drop-group-${groupIndex}`} className="marquee-strip__group">
              {Array.from({ length: 6 }).map((_, index) => (
                <span
                  key={`first-drop-coming-soon-${groupIndex}-${index}`}
                  className="font-label text-[11px] tracking-[0.34em] whitespace-nowrap uppercase text-white/78 sm:text-[12px]"
                >
                  FIRST DROP COMING SOON
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section
        id="manifest"
        ref={manifestSectionRef}
        className={`manifest-paper relative isolate overflow-hidden bg-[#f4f0e8] px-5 py-24 text-black sm:px-8 md:py-32 lg:py-40 ${manifestVisible ? "manifest-paper--visible" : ""}`}
      >
        <div className="pointer-events-none absolute inset-0 border-y border-black/10" />
        <div className="manifest-paper__noise pointer-events-none absolute inset-0" />
        <Image
          src="/brand/manifest-symbol.png"
          alt=""
          width={370}
          height={486}
          aria-hidden="true"
          className="pointer-events-none absolute top-24 left-[6%] hidden w-20 opacity-[0.06] mix-blend-multiply lg:block"
          style={{
            transform: prefersReducedMotion
              ? "translate3d(0, 0, 0)"
              : `translate3d(0, ${manifestParallaxOffset * -0.55}px, 0)`,
          }}
        />
        <Image
          src="/brand/manifest-symbol.png"
          alt=""
          width={370}
          height={486}
          aria-hidden="true"
          className="pointer-events-none absolute right-[7%] bottom-20 hidden w-16 opacity-[0.05] mix-blend-multiply lg:block"
          style={{
            transform: prefersReducedMotion
              ? "translate3d(0, 0, 0)"
              : `translate3d(0, ${manifestParallaxOffset * 0.45}px, 0) rotate(180deg)`,
          }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <Image
            src="/brand/manifest-symbol.png"
            alt=""
            width={370}
            height={486}
            priority
            aria-hidden="true"
            className={`manifest-symbol mb-10 h-auto w-16 sm:w-20 md:mb-12 md:w-24 ${manifestVisible ? "manifest-symbol--visible" : ""}`}
          />
          <p
            className={`manifest-label font-label text-[10px] tracking-[0.34em] uppercase text-black/55 ${manifestVisible ? "manifest-label--visible" : ""}`}
          >
            {manifestCopy.label}
          </p>
          <h2 className="mt-8 max-w-[50rem] font-sans text-[clamp(2.85rem,6.4vw,6.35rem)] leading-[0.94] font-black tracking-normal text-black">
            <span className="manifest-headline-line-wrap">
              <span
                className={`manifest-headline-line ${manifestVisible ? "manifest-headline-line--visible" : ""}`}
              >
                Born in Warsaw.
              </span>
            </span>
            <span className="manifest-headline-line-wrap">
              <span
                className={`manifest-headline-line manifest-headline-line--delayed ${manifestVisible ? "manifest-headline-line--visible" : ""}`}
              >
                Dressed in noir.
              </span>
            </span>
          </h2>
          <div className="manifest-copy mt-16 w-full max-w-[34rem] space-y-9 text-[17px] leading-8 font-normal text-black/82 sm:text-[21px] sm:leading-10 md:mt-20 md:space-y-10">
            {manifestCopy.body.map((paragraph, index) => (
              <p
                key={paragraph}
                ref={(element) => {
                  manifestParagraphRefs.current[index] = element;
                }}
                data-manifest-index={index}
                className={`manifest-paragraph ${manifestParagraphVisibility.includes(index) ? "manifest-paragraph--visible" : ""}`}
                style={{ transitionDelay: `${index * 110}ms` }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {!isHeroNewsletterDismissed ? (
        <>
          <div className="pointer-events-none fixed right-6 bottom-6 z-50 hidden md:block">
            <div className="pointer-events-auto w-full max-w-[25rem]">
              <div className="relative w-[25rem] max-w-[calc(100vw-3rem)] border border-white/10 bg-black/72 p-4 shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-md">
                <button
                  type="button"
                  onClick={dismissHeroNewsletter}
                  aria-label={heroNewsletterCopy.closeLabel}
                  className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center text-sm text-white/46 transition hover:text-white/78"
                >
                  ×
                </button>
                <div className="space-y-3">
                  <p className="font-label pr-8 text-[9px] tracking-[0.26em] text-white/42 uppercase">
                    {heroNewsletterCopy.eyebrow}
                  </p>
                  <div className="space-y-1.5">
                    <h2 className="font-display max-w-[15rem] text-[1.4rem] leading-[1.02] text-white">
                      {heroNewsletterCopy.title}
                    </h2>
                    <p className="max-w-[16rem] text-[12px] leading-5 text-white/58">
                      {heroNewsletterCopy.description}
                    </p>
                  </div>
                  <NewsletterForm
                    source="hero"
                    language={locale}
                    variant="hero"
                    submitLabel={heroNewsletterCopy.button}
                    successMessage={heroNewsletterCopy.success}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* NEWSLETTER SECTION STARTS OUTSIDE HERO */}
          <section
            id="newsletter-after-hero"
            className="newsletter-after-hero border-t border-white/10 bg-black px-4 py-6 md:hidden"
          >
            <div className="mx-auto flex max-w-7xl justify-end">
              <div className="w-full max-w-[420px]">
                <div className="relative border border-white/10 bg-black/72 p-4 shadow-[0_14px_30px_rgba(0,0,0,0.24)] backdrop-blur-md">
                  <button
                    type="button"
                    onClick={dismissHeroNewsletter}
                    aria-label={heroNewsletterCopy.closeLabel}
                    className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center text-sm text-white/46 transition hover:text-white/78"
                  >
                    ×
                  </button>
                  <div className="space-y-3">
                    <p className="font-label pr-8 text-[9px] tracking-[0.26em] text-white/42 uppercase">
                      {heroNewsletterCopy.eyebrow}
                    </p>
                    <div className="space-y-1.5">
                      <h2 className="font-display max-w-[15rem] text-[1.4rem] leading-[1.02] text-white">
                        {heroNewsletterCopy.title}
                      </h2>
                      <p className="max-w-[16rem] text-[12px] leading-5 text-white/58">
                        {heroNewsletterCopy.description}
                      </p>
                    </div>
                    <NewsletterForm
                      source="hero"
                      language={locale}
                      variant="hero"
                      submitLabel={heroNewsletterCopy.button}
                      successMessage={heroNewsletterCopy.success}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <FooterNewsletter locale={locale} />
    </div>
  );
}
