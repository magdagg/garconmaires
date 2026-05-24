"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  links: Array<{
    href: string;
    label: string;
    mobileLabel?: string;
    ariaLabel?: string;
    isSymbol?: boolean;
  }>;
  closeLabel: string;
};

export function MobileMenu({
  open,
  onClose,
  links,
  closeLabel,
}: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-[72px] z-40 border-b border-white/10 bg-black/98 backdrop-blur-xl md:hidden",
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0",
      )}
      >
        <div className="site-shell flex flex-col gap-2 px-4 py-6">
          <button
            type="button"
            onClick={onClose}
            className="font-label mb-2 w-fit text-[11px] tracking-[0.22em] uppercase text-white/52"
          >
            {closeLabel}
          </button>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              aria-label={link.ariaLabel}
              className={cn(
                "border-b border-white/8 py-4 text-lg text-white/72",
                pathname === link.href && "text-white",
                link.isSymbol ? "text-2xl tracking-normal" : "font-label tracking-[0.16em] uppercase",
              )}
            >
              {link.mobileLabel ?? link.label}
            </Link>
          ))}
        </div>
    </div>
  );
}
