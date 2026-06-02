"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getSmsLink, isMobileDevice, SMS_PHONE_DISPLAY, SMS_PHONE_NUMBER, SMS_BODY_PREFIX } from "@/lib/sms-config";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import {
  MessageSquare,
  Copy,
  Check,
  ArrowRight,
  Smartphone,
  CheckCircle,
  Zap,
  Users,
  ShieldCheck,
} from "lucide-react";

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function SmartInput({
  onSubmit,
}: {
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const handleAction = useCallback(() => {
    const trimmed = value.trim();

    if (isMobile) {
      const body = trimmed
        ? encodeURIComponent(`Hi, I need help with ${trimmed}`)
        : encodeURIComponent(SMS_BODY_PREFIX + "...");
      window.location.href = `sms:${SMS_PHONE_NUMBER}?&body=${body}`;
      onSubmit(trimmed);
    } else {
      // Desktop — copy number and show confirmation
      navigator.clipboard.writeText(SMS_PHONE_DISPLAY).catch(() => {});
      setCopied(true);
      setSubmitted(true);
      onSubmit(trimmed);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [value, isMobile, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      handleAction();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center overflow-hidden rounded-full border border-border bg-card shadow-sm transition-shadow focus-within:shadow-md">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you need help with?"
          className="flex-1 bg-transparent px-5 py-4 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          aria-label="Describe your project"
        />
        <div className="pr-2">
          <Button
            size="sm"
            className="h-10 gap-1.5 rounded-full px-4 font-semibold"
            onClick={handleAction}
            disabled={!value.trim() && !submitted}
          >
            {isMobile ? (
              <>
                <MessageSquare className="h-4 w-4" />
                Text us
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Get started
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Desktop confirmation message */}
      <AnimatePresence>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center justify-center gap-1.5 text-sm text-[#0A84FF]"
          >
            <Check className="h-4 w-4" />
            Number copied — text us to get started
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------------
// Live activity items
// ------------------------------------------------------------------

const ACTIVITY = [
  { label: "AC Repair", location: "Phoenix, AZ" },
  { label: "Bathroom Remodel", location: "Scottsdale, AZ" },
  { label: "Roof Inspection", location: "Tampa, FL" },
  { label: "Fence Repair", location: "Austin, TX" },
  { label: "Plumbing Leak", location: "Denver, CO" },
  { label: "Electrical Panel Upgrade", location: "Las Vegas, NV" },
];

function LiveActivity() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % ACTIVITY.length);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const item = ACTIVITY[index];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0A84FF] opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0A84FF]" />
      </span>
      <span className="text-sm text-muted-foreground">
        Projects being posted right now:
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-sm font-medium text-foreground"
        >
          {item.label} — {item.location}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------------
// Main HomeLanding
// ------------------------------------------------------------------

interface HomeLandingProps {
  onOpenForm: () => void;
}

export function HomeLanding({ onOpenForm }: HomeLandingProps) {
  const [numberCopied, setNumberCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const handleCopyNumber = useCallback(() => {
    navigator.clipboard.writeText(SMS_PHONE_DISPLAY).catch(() => {});
    setNumberCopied(true);
    setTimeout(() => setNumberCopied(false), 2500);
  }, []);

  const handlePrimaryClick = useCallback(() => {
    if (isMobile) {
      window.location.href = getSmsLink();
    } else {
      handleCopyNumber();
    }
  }, [isMobile, handleCopyNumber]);

  return (
    <div className="w-full font-sans">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left — copy + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge — clickable to start SMS */}
            <button
              onClick={handlePrimaryClick}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 transition-all hover:border-primary hover:bg-primary/5 active:scale-95"
            >
              <Zap className="h-3.5 w-3.5 text-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                AI-Powered · Text to Start
              </span>
            </button>

            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
              Text us your project.
              <br />
              Contractors bid.
              <br />
              <span className="text-[#0A84FF]">Compare. Choose. Done.</span>
            </h1>

            <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
              Start with a quick text. Answer a few simple questions—we&apos;ll bring you multiple bids from contractors ready to win your job.
            </p>

            {/* Primary + Secondary CTAs */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-6 text-base font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
                onClick={handlePrimaryClick}
              >
                <MessageSquare className="h-5 w-5" />
                Text us to start your project
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-12 gap-2 rounded-full px-6 text-base"
                onClick={handleCopyNumber}
              >
                {numberCopied ? (
                  <>
                    <Check className="h-4 w-4 text-[#0A84FF]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy number
                  </>
                )}
              </Button>
            </div>

            {/* Phone number display */}
            <p className="mt-3 text-2xl font-bold tracking-wide text-foreground">
              {SMS_PHONE_DISPLAY}
            </p>

            {/* Microcopy */}
            <p className="mt-2 text-sm text-muted-foreground">
              Takes less than 60 seconds
            </p>

            {/* Live activity */}
            <div className="mt-6">
              <LiveActivity />
            </div>
          </motion.div>

          {/* Right — iPhone chat simulation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <SmsIphonePreview />
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Text us your project",
                body: "Start for free. Just send a quick text message.",
                icon: <MessageSquare className="h-5 w-5" />,
              },
              {
                step: "02",
                title: "AI gathers the details",
                body: "Our AI asks a few smart questions to understand your job.",
                icon: <Zap className="h-5 w-5" />,
              },
              {
                step: "03",
                title: "Compare bids & choose",
                body: "Receive bids from vetted local contractors. Pick the best.",
                icon: <Users className="h-5 w-5" />,
              },
            ].map(({ step, title, body, icon }) => (
              <div key={step} className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {icon}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{step}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────── */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Why HomeBids
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: <Users className="h-5 w-5" />,
                title: "100+ matching contractors",
                body: "We contact every relevant contractor in your area.",
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: "AI handles the heavy lifting",
                body: "Smart intake means no lengthy forms or follow-up calls.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Real bids. No spam.",
                body: "Your contact info stays private until you approve a bid.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  {icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to get your first bids?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No apps. Just text us.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-13 w-full gap-2 rounded-full px-8 text-base font-semibold sm:w-auto"
              onClick={handlePrimaryClick}
            >
              <MessageSquare className="h-5 w-5" />
              {isMobile ? "Text Us Now" : "Copy Number"}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-13 w-full gap-1 rounded-full px-6 text-base sm:w-auto"
              onClick={onOpenForm}
            >
              Or fill out a form instead
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {SMS_PHONE_DISPLAY}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              "Takes under 60 seconds",
              "Free to try",
              "Info stays private",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-[#0A84FF]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
