"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";

export function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Restore dismissed state from sessionStorage
    const dismissed = sessionStorage.getItem("demo-banner-dismissed");
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem("demo-banner-dismissed", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative z-50 flex items-center justify-center gap-3 bg-foreground px-4 py-2.5 text-background">
      <span className="text-xs font-medium tracking-wide uppercase opacity-60">Demo</span>
      <span className="h-3.5 w-px bg-background/20" />
      <p className="text-sm font-medium">
        You are viewing a live interactive demo.{" "}
        <Link
          href="/auth/sign-up"
          className="underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
        >
          Create a free account
        </Link>{" "}
        to get started.
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss demo banner"
        className="ml-2 rounded p-0.5 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
