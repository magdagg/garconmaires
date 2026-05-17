"use client";

import { useState } from "react";
import type { CheckoutItemInput } from "@/lib/commerce";
import { copy, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type CheckoutButtonProps = {
  items: CheckoutItemInput[];
  label: string;
  locale: Locale;
  className?: string;
  onBeforeRedirect?: () => void;
};

export function CheckoutButton({
  items,
  label,
  locale,
  className,
  onBeforeRedirect,
}: CheckoutButtonProps) {
  const t = copy[locale].checkout;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items, locale }),
      });

      const data = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? t.startError);
        setIsLoading(false);
        return;
      }

      onBeforeRedirect?.();
      window.location.href = data.url;
    } catch {
      setError(t.startError);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading || items.length === 0}
        className={cn(
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {isLoading ? t.redirecting : label}
      </button>
      {error ? (
        <p className="text-xs tracking-[0.08em] text-white/52">{error}</p>
      ) : null}
    </div>
  );
}
