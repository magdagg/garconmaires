"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BrandIcon, BrandWordmark } from "@/components/ui/brand-logo";
import { SectionHeading } from "@/components/ui/section-heading";
import { copy, withLocalePath, type Locale } from "@/lib/i18n";

export function HomePage({ locale = "pl" }: { locale?: Locale }) {
  const t = copy[locale].home;
  const stageRef = useRef<HTMLElement | null>(null);
  const markRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const mark = markRef.current;
    const aura = auraRef.current;

    if (!stage || !mark || !aura) {
      return;
    }

    let frame = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let isPointerInside = false;

    const render = () => {
      currentX += (targetX - currentX) * 0.09;
      currentY += (targetY - currentY) * 0.09;

      const rotateY = currentX * 10;
      const rotateX = currentY * -10;
      const translateX = currentX * 26;
      const translateY = currentY * 20;

      mark.style.transform = [
        "translate3d(0, 0, 0)",
        `translate3d(${translateX}px, ${translateY}px, 0)`,
        `rotateX(${rotateX}deg)`,
        `rotateY(${rotateY}deg)`,
        "scale3d(1.02, 1.02, 1.02)",
      ].join(" ");

      aura.style.transform = [
        "translate3d(0, 0, 0)",
        `translate3d(${currentX * 42}px, ${currentY * 34}px, 0)`,
        `scale(${1 + Math.abs(currentX) * 0.05 + Math.abs(currentY) * 0.05})`,
      ].join(" ");

      if (
        isPointerInside ||
        Math.abs(targetX - currentX) > 0.001 ||
        Math.abs(targetY - currentY) > 0.001
      ) {
        frame = window.requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    const queueRender = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      targetX = (x - 0.5) * 2;
      targetY = (y - 0.5) * 2;
      isPointerInside = true;
      queueRender();
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
      isPointerInside = false;
      queueRender();
    };

    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div className="bg-black text-white">
      <section
        ref={stageRef}
        className="leather-stage relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden border-b border-white/10 px-6 [perspective:1400px]"
      >
        <div className="leather-stage__glow absolute inset-0" />
        <div className="leather-stage__grain absolute inset-0" />
        <div className="leather-stage__flow absolute inset-[-8%]" />
        <div className="leather-stage__flow-delayed absolute inset-[-10%]" />
        <div
          ref={auraRef}
          className="hero-mark-aura absolute inset-0 transition-transform duration-300"
        />
        <div
          ref={markRef}
          className="relative z-10 transform-gpu will-change-transform [transform-style:preserve-3d]"
        >
          <BrandIcon className="hero-mark-presence h-40 w-28 sm:h-52 sm:w-36 md:h-64 md:w-44" />
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="grain absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_30%),linear-gradient(180deg,#090909_0%,#030303_100%)]" />
        <div className="site-shell relative grid min-h-[calc(100svh-72px)] items-center gap-16 px-4 py-20 md:grid-cols-[0.95fr_1.05fr] md:px-6 md:py-28">
          <div className="hero-reveal max-w-xl space-y-8">
            <p className="font-label text-[11px] tracking-[0.24em] text-white/40 uppercase">
              {t.eyebrow}
            </p>
            <BrandWordmark
              priority
              className="h-14 w-full max-w-[21rem] sm:h-20 sm:max-w-[34rem]"
            />
            <h1 className="font-display whitespace-pre-line text-4xl leading-[0.98] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>
            <p className="max-w-lg whitespace-pre-line text-sm leading-8 text-white/62 sm:text-base">
              {t.description}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href={withLocalePath("/about", locale)}
                className="font-label inline-flex items-center justify-center bg-white px-7 py-4 text-[11px] tracking-[0.22em] uppercase text-black hover:opacity-85"
              >
                {t.primaryCta}
              </Link>
              <Link
                href={withLocalePath("/about", locale)}
                className="font-label inline-flex items-center justify-center border border-white/20 px-7 py-4 text-[11px] tracking-[0.22em] uppercase text-white hover:bg-white hover:text-black"
              >
                {t.secondaryCta}
              </Link>
            </div>
          </div>

          <SectionHeading
            eyebrow={t.featuredEyebrow}
            title={t.featuredTitle}
            description={t.featuredDescription}
          />
        </div>
      </section>
    </div>
  );
}
