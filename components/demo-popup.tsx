"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, CheckCircle2 } from "lucide-react";

const SMS_HREF = "sms:+18722964991?&body=Hey%20HomeBids%2C%20lets%20build%20a%20new%20bid!";
const SESSION_KEY = "homebids_demo_popup_seen";
const DELAY_MS = 7000;

const bullets = [
  "Upload photos, screenshots, or voice notes",
  "AI organizes everything into a professional bid",
  "PDF generated and ready to send in under 2 minutes",
  "No signup required to see it work",
];


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

          {/* Modal — perfectly centered */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-popup-title"
            aria-describedby="demo-popup-desc"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="px-6 pb-7 pt-6">
              {/* Close button */}
              <button
                onClick={dismiss}
                aria-label="Close demo popup"
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Eyebrow */}
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Live Demo
              </p>

              {/* Headline */}
              <h2
                id="demo-popup-title"
                className="mt-1.5 text-balance text-xl font-bold leading-snug text-foreground pr-6"
              >
                Build a bid in under 2 minutes.
              </h2>

              {/* Subheadline */}
              <p
                id="demo-popup-desc"
                className="mt-2 text-sm text-muted-foreground"
              >
                Text us a job. Watch HomeBids handle the rest.
              </p>

              {/* Bullets */}
              <ul className="mt-4 space-y-2">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>

              {/* Primary CTA */}
              <a
                href={SMS_HREF}
                onClick={handleSmsClick}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MessageSquare className="h-5 w-5 shrink-0" />
                Text Us for a Live Demo
              </a>

              {/* Microcopy */}
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
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
      {text}
    </a>
  );
}
