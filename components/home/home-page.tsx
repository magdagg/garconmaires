"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FooterNewsletter } from "@/components/layout/footer-newsletter";
import { type Locale } from "@/lib/i18n";

const manifestCopyByLocale = {
  pl: {
    label: "MANIFEST",
    headlineTop: "Born in Warsaw.",
    headlineBottom: "Dressed in noir.",
    body: [
      "Garçonmaires to polska marka odzieżowa, łącząca streetwear z elegancją. Stworzona w Warszawie, czerpie inspirację z polskiej kultury.",
      "Przepełniona symboliką marka łączy elementy karciane z czystą, czarną garderobą.",
      "Buduje własny język: chłodny, wyrazisty i zakorzeniony w miejscu, z którego pochodzi.",
      "Warszawa pozostaje punktem odniesienia. Nie jako pocztówkowy obraz miasta, ale jako atmosfera: szkło, beton, metal, cień, ruch, surowość i kontrast.",
      "Garçonmaires przenosi ten kontekst na formę, znak i sposób obecności.",
      "DROP 01 powstaje wokół czerni, krótkiej serii i rozpoznawalnego symbolu.",
    ],
  },
  en: {
    label: "MANIFESTO",
    headlineTop: "Born in Warsaw.",
    headlineBottom: "Dressed in noir.",
    body: [
      "Garçonmaires is a Polish clothing label shaped by streetwear, elegance, and a disciplined black wardrobe.",
      "The brand draws from card symbolism and turns it into a restrained visual language.",
      "Its tone is cool, graphic, and rooted in the city it comes from.",
      "Warsaw remains the reference point: glass, concrete, metal, shadow, movement, rawness, and contrast.",
      "Garçonmaires translates that atmosphere into silhouette, mark, and presence.",
      "DROP 01 begins with black, limited quantities, and a symbol built to stay.",
    ],
  },
} satisfies Record<
  Locale,
  {
    label: string;
    headlineTop: string;
    headlineBottom: string;
    body: string[];
  }
>;

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
  const manifestCopy = manifestCopyByLocale[locale];
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
                {manifestCopy.headlineTop}
              </span>
            </span>
            <span className="manifest-headline-line-wrap">
              <span
                className={`manifest-headline-line manifest-headline-line--delayed ${manifestVisible ? "manifest-headline-line--visible" : ""}`}
              >
                {manifestCopy.headlineBottom}
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

      <FooterNewsletter locale={locale} />
    </div>
  );
}
