"use client";

import { useRef, useEffect, useState } from "react";
import { useAnimationFrame, motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Home, Wrench, Menu, X } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { Button } from "@/components/ui/button";

// ── Scrolling ticker ──────────────────────────────────────────────────────────
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
const ROW_B = [
  ...TICKER_ITEMS.slice(4),
  ...TICKER_ITEMS.slice(0, 4),
  ...TICKER_ITEMS.slice(4),
  ...TICKER_ITEMS.slice(0, 4),
];

function TickerRow({
  items,
  speed,
  reverse = false,
}: {
  items: string[];
  speed: number;
  reverse?: boolean;
}) {
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
      className="fixed inset-0 z-50 flex flex-col font-sans"
      style={{ background: "#f9fafb" }}
    >
      {/* ── Background ticker rows — desktop only, safely behind all content ── */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:flex lg:flex-col lg:justify-between overflow-hidden py-24"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      >
        <div className="overflow-hidden opacity-[0.20]">
          <TickerRow items={ROW_A} speed={14} />
        </div>
        <div className="overflow-hidden opacity-[0.16]">
          <TickerRow items={ROW_B} speed={11} reverse />
        </div>
      </div>

      {/* ── Radial vignette — clears the center for hero content ─────────── */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "radial-gradient(ellipse 88% 78% at 50% 50%, #f9fafb 40%, rgba(249,250,251,0.65) 65%, transparent 100%)",
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="relative shrink-0 border-b border-border"
        style={{ background: "#f9fafb", zIndex: 20 }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center px-6 py-3">
          {/* Logo — left on desktop, centered on mobile */}
          <div className="flex flex-1 items-center lg:flex-none">
            <Image
              src="/images/homebids-logo-new.png?v=2"
              alt="HomeBids"
              width={480}
              height={120}
              className="pointer-events-none object-contain"
              style={{ height: "clamp(44px, 8vw, 72px)", width: "auto" }}
              priority
            />
          </div>

          {/* Desktop nav — right side */}
          <nav className="hidden items-center gap-3 lg:flex">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full px-5 font-semibold"
            >
              <Link href="/login">Log In</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full px-5 font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
            >
              <Link href="/?home=1">Try For Free</Link>
            </Button>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="ml-auto flex items-center justify-center rounded-full p-2 text-foreground transition-colors hover:bg-black/5 lg:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border lg:hidden"
              style={{ background: "#f9fafb" }}
            >
              <div className="flex flex-col gap-2 px-6 py-4">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-center rounded-full font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-center rounded-full font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/?home=1">Try For Free</Link>
                </Button>
                <div className="my-1 h-px bg-border" />
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-center gap-2 rounded-full font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/?home=1">
                    <Home className="h-4 w-4" />
                    {"I'm a Homeowner"}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-center gap-2 rounded-full font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/contractors/dashboard">
                    <Wrench className="h-4 w-4" />
                    {"I'm a Contractor"}
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main content — scrollable on mobile, centered on desktop ──────── */}
      <main
        className="relative flex flex-1 flex-col items-center overflow-y-auto px-5 pb-20 pt-10 lg:overflow-hidden lg:py-0 lg:justify-center"
        style={{ zIndex: 2 }}
      >
        <div className="w-full max-w-6xl">
          {/*
            Two-column layout on desktop (lg+).
            Stacked single-column on mobile — copy first, then phone below.
          */}
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8">

            {/* ── Left: copy + CTAs ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[480px] lg:shrink-0"
            >
              <h1
                className="text-balance font-extrabold leading-[1.08] tracking-tight text-foreground"
                style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)" }}
              >
                Hi, we&apos;re HomeBids.
              </h1>

              <p
                className="mt-5 max-w-sm text-pretty leading-relaxed text-muted-foreground"
                style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
              >
                Are you a homeowner or a home service professional?
              </p>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 gap-2.5 rounded-full px-7 text-base font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 w-full sm:w-auto"
                >
                  <Link href="/?home=1">
                    <Home className="h-5 w-5 shrink-0" />
                    {"I'm a Homeowner"}
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 gap-2.5 rounded-full px-7 text-base font-semibold w-full sm:w-auto"
                >
                  <Link href="/contractors/dashboard">
                    <Wrench className="h-5 w-5 shrink-0" />
                    {"I'm a Contractor"}
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* ── Right: iPhone mockup ───────────────────────────────────── */}
            {mounted && (
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                /*
                  Key constraints:
                  - `min-w-0` prevents flex from stretching this column past its content
                  - `max-w-[90vw]` on the inner container ensures phone never exceeds viewport width on mobile
                  - No scale() transform — the phone renders at its natural size (272px / 300px)
                  - `lg:flex-1` lets it fill remaining desktop column space while keeping the phone centered
                */
                className="flex w-full items-center justify-center lg:flex-1 lg:justify-end"
                style={{ zIndex: 3 }}
              >
                {/* Soft brand glow */}
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -inset-10 rounded-full"
                    style={{
                      background:
                        "radial-gradient(ellipse 70% 50% at 50% 65%, rgba(10,132,255,0.1) 0%, transparent 72%)",
                      filter: "blur(24px)",
                      zIndex: 0,
                    }}
                    aria-hidden="true"
                  />
                  {/* Float animation wraps SmsIphonePreview at natural size — no scale */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    /*
                      max-w-[90vw] clips to viewport on narrow screens.
                      overflow-hidden ensures the SmsIphonePreview container itself doesn't bleed out.
                    */
                    className="relative max-w-[90vw] overflow-visible"
                    style={{ zIndex: 1 }}
                  >
                    <SmsIphonePreview />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="relative shrink-0 border-t border-border pb-5 pt-4 text-center"
        style={{ background: "#f9fafb", zIndex: 20 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          homebids.ai
        </p>
      </footer>
    </div>
  );
}
