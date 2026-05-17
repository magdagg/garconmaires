import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  priority?: boolean;
};

type BrandMonogramProps = {
  className?: string;
  priority?: boolean;
};

export function BrandWordmark({
  className,
  priority = false,
}: BrandWordmarkProps) {
  return (
    <div className={cn("relative h-8 w-[17rem] sm:h-10 sm:w-[22rem]", className)}>
      <Image
        src="/brand/garconmaires-top-wordmark.png"
        alt="Garçonmaires"
        fill
        priority={priority}
        className="object-contain object-left"
        sizes="(max-width: 640px) 272px, 352px"
      />
    </div>
  );
}

export function BrandMonogram({
  className,
  priority = false,
}: BrandMonogramProps) {
  return (
    <div className={cn("relative h-20 w-20 sm:h-24 sm:w-24", className)}>
      <Image
        src="/brand/garconmaires-monogram-white.png"
        alt="Garçonmaires monogram"
        fill
        priority={priority}
        className="object-contain"
        sizes="96px"
      />
    </div>
  );
}

export function BrandMonogramMetallic({
  className,
  priority = false,
}: BrandMonogramProps) {
  return (
    <div className={cn("relative h-20 w-20 sm:h-24 sm:w-24", className)}>
      <Image
        src="/brand/garconmaires-monogram-metallic.png"
        alt="Garçonmaires metallic monogram"
        fill
        priority={priority}
        className="object-contain"
        sizes="96px"
      />
    </div>
  );
}

export function BrandHeaderLogo({
  className,
  priority = false,
}: BrandWordmarkProps) {
  return (
    <div className={cn("relative h-8 w-[15rem] sm:h-9 sm:w-[19rem]", className)}>
      <Image
        src="/brand/garconmaires-top-wordmark.png"
        alt="Garçonmaires"
        fill
        priority={priority}
        className="object-contain"
        sizes="(max-width: 640px) 240px, 304px"
      />
    </div>
  );
}

export function BrandIcon({
  className,
  priority = false,
}: BrandMonogramProps) {
  return (
    <div
      aria-label="Garçonmaires icon"
      role="img"
      data-priority={priority ? "true" : undefined}
      className={cn("brand-icon-mask relative h-16 w-12 text-white sm:h-20 sm:w-14", className)}
    >
      <span className="absolute inset-0 bg-current" />
    </div>
  );
}
