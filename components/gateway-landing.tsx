"use client";

import { useRef, useEffect, useState } from "react";
import { useAnimationFrame, motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Home, Wrench, Menu, X } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { Button } from "@/components/ui/button";

// ── Ticker items ──────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "Roof Leak → Fixed",
  "Kitchen Remodel → Scheduled",
  "Water Heater → Installed",
  "HVAC Repair → Complete",
  "Bathroom Tile → Finished",
  "Fence Replacement → Done",
  "Interior Paint → Complete",
  "Deck Refinish → Scheduled",
  "Window Replace → Installed",
  "Flooring → Complete",
  "AC Tune-Up → Done",
  "Plumbing Leak → Fixed",
  "Landscape Design → Started",
  "Pool Service → Weekly",
  "Pest Control → Treated",
  "Drywall Patch → Finished",
  "Gutter Clean → Done",
  "Sprinkler Repair → Fixed",
];

// Four rows, each offset so they feel like a snake weaving across the page
const ROW_A = [...TICKER_ITEMS, ...TICKER_ITEMS];
const ROW_B = [...TICKER_ITEMS.slice(5), ...TICKER_ITEMS.slice(0, 5), ...TICKER_ITEMS.slice(5), ...TICKER_ITEMS.slice(0, 5)];
const ROW_C = [...TICKER_ITEMS.slice(10), ...TICKER_ITEMS.slice(0, 10), ...TICKER_ITEMS.slice(10), ...TICKER_ITEMS.slice(0, 10)];
const ROW_D = [...TICKER_ITEMS.slice(3), ...TICKER_ITEMS.slice(0, 3), ...TICKER_ITEMS.slice(3), ...TICKER_ITEMS.slice(0, 3)];

// Pill opacity and speed per row — alternating directions = snake effect
const ROWS = [
  { items: ROW_A, speed: 32, reverse: false, opacity: 0.22 },
  { items: ROW_B, speed: 26, reverse: true,  opacity: 0.17 },
  { items: ROW_C, speed: 30, reverse: false, opacity: 0.19 },
  { items: ROW_D, speed: 24, reverse: true,  opacity: 0.16 },
] as const;

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
          className="mr-6 inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white/70 px-3.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground select-none"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function GatewayLanding() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    // Normal flow — root layout footer renders below this naturally
    <div className="relative min-h-screen overflow-x-hidden font-sans" style={{ background: "#f1f0f0" }}>

      {/* ── Snake ticker — absolute, spans full height, z-0 ─────────────────
          Goes BEHIND all content (z-0) but is visible in the gaps.
          Four rows are evenly distributed vertically using top percentages.  */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      >
        {ROWS.map((row, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 overflow-hidden"
            style={{
              // Distribute the 4 rows at 15%, 35%, 62%, 80% down the page
              top: `${[15, 35, 62, 80][i]}%`,
              opacity: row.opacity,
            }}
          >
            <TickerRow items={row.items} speed={row.speed} reverse={row.reverse} />
          </div>
        ))}
      </div>

      {/* ── Header — z-10, sits above tickers ───────────────────────────── */}
      <header
        className="relative w-full px-5 py-3 lg:px-10"
        style={{ zIndex: 10, background: "transparent" }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          {/* Logo — prominent, left-aligned */}
          <Link href="/" className="flex-1" tabIndex={-1}>
            <Image
              src="/images/homebids-logo-new.png?v=2"
              alt="HomeBids"
              width={480}
              height={120}
              className="pointer-events-none object-contain object-left"
              style={{ height: "clamp(48px, 7vw, 72px)", width: "auto" }}
              priority
            />
          </Link>

          {/* Desktop nav — smaller than logo */}
          <nav className="hidden items-center gap-2 lg:flex">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-4 text-sm font-medium text-foreground/80 hover:text-foreground"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-8 rounded-full px-4 text-sm font-medium bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
            >
              <Link href="/?home=1">Try for free</Link>
            </Button>
          </nav>

          {/* Mobile: log in + try for free + hamburger */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-medium text-foreground/80"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-8 rounded-full px-3 text-xs font-medium bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
            >
              <Link href="/?home=1">Try for free</Link>
            </Button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/8"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
              className="overflow-hidden border-t border-border/50 lg:hidden"
            >
              <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-4">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full justify-center rounded-full font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/?home=1">
                    <Home className="mr-2 h-4 w-4" />
                    {"I'm a Homeowner"}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full justify-center rounded-full font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/contractors/dashboard">
                    <Wrench className="mr-2 h-4 w-4" />
                    {"I'm a Contractor"}
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main content — z-10, sits above tickers ─────────────────────── */}
      <main
        className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pb-12 pt-6 text-center lg:pt-8"
        style={{ zIndex: 10 }}
      >
        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <h1
            className="text-balance font-extrabold leading-[1.06] tracking-tight text-foreground"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.8rem)" }}
          >
            Hi, we&apos;re{" "}
            <span style={{ color: "#0A84FF" }}>HomeBids.</span>
          </h1>

          <p
            className="mt-3 max-w-[440px] text-pretty leading-relaxed text-muted-foreground"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}
          >
            Are you a homeowner or a home service professional?
          </p>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
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
              className="h-12 gap-2.5 rounded-full px-8 text-base font-semibold bg-white/80 hover:bg-white"
            >
              <Link href="/contractors/dashboard">
                <Wrench className="h-[18px] w-[18px] shrink-0" />
                {"I'm a Contractor"}
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* iPhone mockup — fixed-size container prevents any layout shift when
            messages load. The SmsIphonePreview inner shell is already fixed at
            height:560px, so we just need to ensure the wrapper matches. */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex items-start justify-center"
            // Fixed dimensions matching SmsIphonePreview's inner shell exactly:
            // width: 300px (sm:w-[300px]) + 14px side buttons = ~320px
            // height: 560px shell + outer glow wrapper padding
            style={{ width: 320, height: 580 }}
          >
            {/* Subtle blue glow behind phone */}
            <div className="relative">
              <div
                className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(10,132,255,0.12) 0%, transparent 70%)",
                  filter: "blur(18px)",
                }}
                aria-hidden="true"
              />
              {/* Gentle float — no layout prop so no size change */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <SmsIphonePreview />
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
