"use client";

import { useRef, useEffect, useState } from "react";
import { useAnimationFrame, motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Home, Wrench, Menu, X } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { Button } from "@/components/ui/button";

// ── Scrolling ticker (desktop only, very subtle) ──────────────────────────────
const TICKER_ITEMS = [
  "Roof Leak → Completed",
  "Kitchen Remodel → Scheduled",
  "Water Heater → Installed",
  "HVAC Repair → Complete",
  "Bathroom Tile → Finished",
  "Fence Replacement → Done",
  "Interior Paint → Complete",
  "Deck Refinish → Scheduled",
  "Window Replacement → Installed",
  "Flooring Install → Complete",
  "AC Tune-Up → Done",
  "Plumbing Leak → Fixed",
];
const ROW_A = [...TICKER_ITEMS, ...TICKER_ITEMS];
const ROW_B = [...TICKER_ITEMS.slice(5), ...TICKER_ITEMS.slice(0, 5), ...TICKER_ITEMS.slice(5), ...TICKER_ITEMS.slice(0, 5)];

function TickerRow({ items, speed, reverse = false }: { items: string[]; speed: number; reverse?: boolean }) {
  const x = useRef(0);
  const ref = useRef<HTMLDivElement>(null);
  useAnimationFrame((_, delta) => {
    if (!ref.current) return;
    const dir = reverse ? 1 : -1;
    x.current += dir * speed * (delta / 1000);
    const totalWidth = ref.current.scrollWidth / 2;
    if (!reverse && x.current <= -totalWidth) x.current += totalWidth;
    if (reverse && x.current >= 0) x.current -= totalWidth;
    ref.current.style.transform = `translateX(${x.current}px)`;
  });
  return (
    <div className="flex w-max will-change-transform" ref={ref}>
      {items.map((item, i) => (
        <span
          key={i}
          className="mr-8 inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground select-none"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Main gateway component ─────────────────────────────────────────────────────
export function GatewayLanding() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col font-sans overflow-hidden"
      style={{ background: "#f1f0f0" }}
    >
      {/* ── Background ticker rows — desktop only ─────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:flex lg:flex-col lg:justify-between overflow-hidden py-28"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      >
        <div className="overflow-hidden opacity-[0.18]">
          <TickerRow items={ROW_A} speed={14} />
        </div>
        <div className="overflow-hidden opacity-[0.14]">
          <TickerRow items={ROW_B} speed={11} reverse />
        </div>
      </div>
      {/* Vignette over tickers */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, #f1f0f0 45%, rgba(241,240,240,0.5) 70%, transparent 100%)",
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="relative shrink-0"
        style={{ background: "#f1f0f0", zIndex: 20 }}
      >
        <div className="flex items-center gap-4 px-5 py-4 lg:px-10">
          {/* Logo — left aligned */}
          <div className="flex-1">
            <Image
              src="/images/homebids-logo-new.png?v=2"
              alt="HomeBids"
              width={480}
              height={120}
              className="pointer-events-none object-contain object-left"
              style={{ height: "clamp(36px, 6vw, 52px)", width: "auto" }}
              priority
            />
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-3 lg:flex">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full px-5 font-semibold text-foreground"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full px-5 font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
            >
              <Link href="/?home=1">Try for free</Link>
            </Button>
          </nav>

          {/* Mobile: Log in + hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full px-4 font-semibold text-foreground"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full px-4 font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
            >
              <Link href="/?home=1">Try for free</Link>
            </Button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/8"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border lg:hidden"
              style={{ background: "#f1f0f0" }}
            >
              <div className="flex flex-col gap-2 px-5 py-4">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-center rounded-full font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/?home=1">
                    <Home className="h-4 w-4 mr-2" />
                    {"I'm a Homeowner"}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-center rounded-full font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/contractors/dashboard">
                    <Wrench className="h-4 w-4 mr-2" />
                    {"I'm a Contractor"}
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main — scrollable, centered content ───────────────────────────── */}
      <main
        className="relative flex flex-1 flex-col items-center overflow-y-auto"
        style={{ zIndex: 2 }}
      >
        {/* Hero copy — centered */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-col items-center px-5 pt-8 pb-6 text-center lg:pt-12"
        >
          {/* Headline */}
          <h1
            className="text-balance font-extrabold leading-[1.06] tracking-tight text-foreground"
            style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}
          >
            Hi, we&apos;re{" "}
            <span style={{ color: "#0A84FF" }}>HomeBids.</span>
          </h1>

          {/* Sub-headline */}
          <p
            className="mt-4 max-w-[480px] text-pretty leading-relaxed text-muted-foreground"
            style={{ fontSize: "clamp(1.05rem, 2vw, 1.25rem)" }}
          >
            Are you a homeowner or a home service professional?
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 gap-2.5 rounded-full px-8 text-base font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
            >
              <Link href="/?home=1">
                <Home className="h-[18px] w-[18px] shrink-0" />
                {"I'm a Homeowner"}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 gap-2.5 rounded-full px-8 text-base font-semibold"
            >
              <Link href="/contractors/dashboard">
                <Wrench className="h-[18px] w-[18px] shrink-0" />
                {"I'm a Contractor"}
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Phone mockup — centered, full width on mobile, constrained on desktop */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-full flex-col items-center pb-8"
          >
            {/* Blue glow under phone */}
            <div
              className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-40 w-64 rounded-full"
              style={{
                background: "radial-gradient(ellipse at 50% 0%, rgba(10,132,255,0.15) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
              aria-hidden="true"
            />

            {/* Float animation */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <SmsIphonePreview />
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
