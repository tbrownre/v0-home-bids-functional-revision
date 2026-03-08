"use client";

/**
 * DemoBanner
 *
 * Dismissible top bar displayed when NEXT_PUBLIC_DEMO_MODE=true.
 * Dismissal is persisted in sessionStorage so it doesn't reappear on navigation.
 * Does nothing (renders null) outside of demo mode.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { isDemoMode } from "@/lib/demo/config";

const STORAGE_KEY = "homebids_demo_banner_dismissed";

export function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isDemoMode()) return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <div
      role="banner"
      className="relative z-50 flex items-center justify-center gap-3 bg-primary px-4 py-2.5 text-primary-foreground"
    >
      <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium">
        You&apos;re viewing a live demo of HomeBids.{" "}
        <Link
          href="/auth/sign-up/homeowner"
          className="underline underline-offset-2 hover:no-underline"
        >
          Create a free account
        </Link>{" "}
        to get started.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
        aria-label="Dismiss demo banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
