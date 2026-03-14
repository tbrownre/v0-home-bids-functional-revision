"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";

/**
 * DemoBanner — a dismissible top bar shown on every page when
 * NEXT_PUBLIC_DEMO_MODE=true. Dismissal persists for the browser session.
 */
export function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("demo-banner-dismissed") !== "true") {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem("demo-banner-dismissed", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="relative z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold uppercase tracking-wide">
          D
        </span>
        <span>
          You&apos;re viewing a live interactive demo — no real data is stored.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-white/20 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/30"
        >
          Create Account
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss demo banner"
          className="rounded p-0.5 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
