"use client";

import { useRef, useEffect, useState } from "react";
import { useAnimationFrame, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, Wrench } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { Button } from "@/components/ui/button";

// ── Scrolling ticker items — home-service project statuses ─────────────────────
const TICKER_ITEMS = [
  "Roof leak repair · Austin, TX",
  "Bathroom remodel · Phoenix, AZ",
  "HVAC replacement · Tampa, FL",
  "Kitchen renovation · Denver, CO",
  "Water heater install · Las Vegas, NV",
  "Exterior painting · Scottsdale, AZ",
  "Tile repair · Dallas, TX",
  "Fence replacement · Charlotte, NC",
  "Electrical panel upgrade · Miami, FL",
  "Plumbing leak fix · Seattle, WA",
  "Garage door repair · Portland, OR",
  "Deck refinishing · Nashville, TN",
  "Window replacement · Atlanta, GA",
  "AC tune-up · Orlando, FL",
  "Driveway reseal · San Diego, CA",
];

// Duplicate for seamless loop
const ROW_A = [...TICKER_ITEMS, ...TICKER_ITEMS];
const ROW_B = [
  ...TICKER_ITEMS.slice(5),
  ...TICKER_ITEMS.slice(0, 5),
  ...TICKER_ITEMS.slice(5),
  ...TICKER_ITEMS.slice(0, 5),
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
    // Slowed down — speed values are lower than before
    x.current += dir * speed * (delta / 1000);
    const totalWidth = ref.current.scrollWidth / 2;
    if (!reverse && x.current <= -totalWidth) x.current += totalWidth;
    if (reverse && x.current >= 0) x.current -= totalWidth;
    ref.current.style.transform = `translateX(${x.current}px)`;
  });

  return (
    <div
      className="flex w-max overflow-visible will-change-transform"
      ref={ref}
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="mr-10 inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground select-none"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Phone mockup — wraps SmsIphonePreview in a simple frame ───────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[300px]">
      {/* Soft blue glow beneath phone — uses brand color, matches site */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(10,132,255,0.12) 0%, transparent 75%)",
          filter: "blur(18px)",
          zIndex: 0,
        }}
      />
      {/* Phone shell — neutral, matches site's card styling */}
      <div
        className="relative z-10 overflow-hidden rounded-[44px]"
        style={{
          background: "linear-gradient(160deg, #1c1c1e 0%, #111 100%)",
          border: "1px solid rgba(0,0,0,0.12)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)",
          padding: "12px 8px 20px",
        }}
      >
        {/* Dynamic island */}
        <div className="mb-3 flex justify-center">
          <div className="h-7 w-24 rounded-full bg-black" />
        </div>
        {/* Chat content */}
        <div
          className="overflow-hidden rounded-[34px]"
          style={{ background: "#000", minHeight: 460 }}
        >
          <SmsIphonePreview />
        </div>
      </div>
    </div>
  );
}

// ── Main gateway component ─────────────────────────────────────────────────────
export function GatewayLanding() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden font-sans"
      style={{ background: "#f9fafb" }}
    >
      {/* ── Background ticker rows — desktop only, z-0, behind everything ── */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:flex lg:flex-col lg:justify-between overflow-hidden py-20"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      >
        {/* Row 1 — near top */}
        <div className="overflow-hidden opacity-[0.30]">
          <TickerRow items={ROW_A} speed={20} />
        </div>
        {/* Row 2 — middle */}
        <div className="overflow-hidden opacity-[0.22]">
          <TickerRow items={ROW_B} speed={15} reverse />
        </div>
        {/* Row 3 — near bottom */}
        <div className="overflow-hidden opacity-[0.28]">
          <TickerRow items={ROW_A.slice(6)} speed={18} />
        </div>
      </div>

      {/* ── Vignette — strong center fade so ticker never overlaps hero copy.
           Uses a layered approach: full-width white center + soft edge fade ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 50%, #f9fafb 38%, rgba(249,250,251,0.7) 62%, transparent 100%)",
          zIndex: 1,
        }}
        aria-hidden="true"
      />
      {/* Extra horizontal safe-zone for the hero columns on wider viewports */}
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(to right, #f9fafb 0%, transparent 20%, transparent 80%, #f9fafb 100%)",
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* ── Header — logo centered, matching site header treatment ─────── */}
      <header className="relative z-10 flex items-center justify-center border-b border-border px-6 py-3" style={{ background: "#f9fafb" }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/images/homebids-logo-new.png?v=2"
            alt="HomeBids"
            width={480}
            height={120}
            className="pointer-events-none object-contain"
            style={{ height: "clamp(56px, 12vw, 96px)", width: "auto" }}
            priority
          />
        </motion.div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-8 lg:py-0">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">

            {/* ── Left: copy + CTAs ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[500px]"
            >
              {/* Badge — matches the site's existing badge style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0A84FF] opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0A84FF]" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  AI-Powered · Home Service
                </span>
              </motion.div>

              {/* Headline — matches site typography */}
              <h1
                className="text-balance font-extrabold leading-[1.08] tracking-tight text-foreground"
                style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
              >
                Meet HomeBids AI
              </h1>

              {/* Sub-headline */}
              <p
                className="mt-4 max-w-sm text-pretty leading-relaxed text-muted-foreground"
                style={{ fontSize: "clamp(1rem, 2.2vw, 1.2rem)" }}
              >
                Your new assistant for all things home service.
              </p>

              {/* Separator question */}
              <p className="mt-7 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Are you a homeowner or a home service company?
              </p>

              {/* CTA buttons — match site's existing button styles exactly */}
              <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 gap-2 rounded-full px-6 text-base font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 w-full sm:w-auto"
                >
                  <Link href="/?home=1">
                    <Home className="h-5 w-5" />
                    {"I'm a Homeowner"}
                    <ArrowRight className="h-4 w-4 opacity-70" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 gap-2 rounded-full px-6 text-base font-semibold w-full sm:w-auto"
                >
                  <Link href="/contractors/dashboard">
                    <Wrench className="h-5 w-5" />
                    {"I'm a Contractor"}
                    <ArrowRight className="h-4 w-4 opacity-50" />
                  </Link>
                </Button>
              </div>

              {/* Tagline — matches site microcopy style */}
              <p className="mt-5 text-sm text-muted-foreground">
                Better bids. Better homes.
              </p>
            </motion.div>

            {/* ── Right: iPhone mockup ──────────────────────────────────── */}
            {mounted && (
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center lg:justify-end"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PhoneMockup />
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border pb-6 pt-4 text-center" style={{ background: "#f9fafb" }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          homebids.ai
        </motion.p>
      </footer>
    </div>
  );
}
