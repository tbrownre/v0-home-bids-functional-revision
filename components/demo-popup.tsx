"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare } from "lucide-react";

const SMS_HREF = "sms:+18722964991?&body=Let's%20create%20a%20new%20bid";
const SESSION_KEY = "homebids_demo_popup_seen";
const DELAY_MS = 7000;


export function DemoPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      setVisible(true);
      // Track impression
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "demo_popup_impression");
      }
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "demo_popup_dismissed");
    }
  }, []);

  const handleSmsClick = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "demo_popup_sms_click");
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
            aria-hidden="true"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-popup-title"
            aria-describedby="demo-popup-desc"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8"
          >
            <div className="px-6 pb-6 pt-6">
              {/* Close button */}
              <button
                onClick={dismiss}
                aria-label="Close demo popup"
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Headline */}
              <h2
                id="demo-popup-title"
                className="text-balance text-xl font-bold leading-snug text-foreground pr-6"
              >
                See a bid built live — in 2 minutes.
              </h2>

              {/* Subheadline */}
              <p
                id="demo-popup-desc"
                className="mt-2 text-sm text-muted-foreground"
              >
                Text us a job. Watch HomeBids handle the rest.
              </p>

              {/* Primary CTA */}
              <a
                href={SMS_HREF}
                onClick={handleSmsClick}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MessageSquare className="h-5 w-5 shrink-0" />
                Text Us for a Live Demo
              </a>

              {/* Under-button microcopy */}
              <p className="mt-3 text-center text-xs text-muted-foreground">
                No signup. Takes 30 seconds.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   Inline demo callout — reusable strip
   ───────────────────────────────────────────── */

interface DemoCalloutProps {
  text?: string;
}

export function DemoCallout({ text = "Curious how it works? Text us for a live demo." }: DemoCalloutProps) {
  const handleClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "demo_callout_click", { label: text });
    }
  };

  return (
    <a
      href={SMS_HREF}
      onClick={handleClick}
      className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-primary/60 transition-colors group-hover:text-primary" />
      {text}
    </a>
  );
}
