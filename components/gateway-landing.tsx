"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useAnimationFrame } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, Wrench } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";

// ── Scrolling ticker items ────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "Roof leak → Completed",
  "Bathroom remodel → Scheduled",
  "HVAC replacement → 3 bids received",
  "Kitchen renovation → In progress",
  "Water heater install → Completed",
  "Exterior paint → Contractor booked",
  "Tile repair → Quotes received",
  "Fence replacement → 2 bids received",
  "Electrical panel upgrade → Completed",
  "Plumbing leak → Contractor booked",
  "Garage door repair → Scheduled",
  "Driveway pressure wash → Completed",
  "Tree removal → In progress",
  "Deck refinishing → 4 bids received",
  "AC tune-up → Completed",
];

// Duplicate for seamless loop
const ROW_A = [...TICKER_ITEMS, ...TICKER_ITEMS];
const ROW_B = [...TICKER_ITEMS.slice(7), ...TICKER_ITEMS.slice(0, 7), ...TICKER_ITEMS.slice(7), ...TICKER_ITEMS.slice(0, 7)];

function TickerRow({ items, speed, reverse = false }: { items: string[]; speed: number; reverse?: boolean }) {
  const x = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    if (!ref.current) return;
    const dir = reverse ? 1 : -1;
    x.current += dir * speed * (delta / 1000);
    // Reset after half width for seamless loop
    const totalWidth = ref.current.scrollWidth / 2;
    if (!reverse && x.current <= -totalWidth) x.current += totalWidth;
    if (reverse && x.current >= 0) x.current -= totalWidth;
    ref.current.style.transform = `translateX(${x.current}px)`;
  });

  return (
    <div className="flex w-max overflow-visible will-change-transform" ref={ref}>
      {items.map((item, i) => (
        <span
          key={i}
          className="mr-8 inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/40 backdrop-blur-sm select-none"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── iMessage-style phone mockup wrapper ───────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[310px]">
      {/* Glow beneath phone */}
      <div
        className="pointer-events-none absolute -inset-8 rounded-full"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(10,132,255,0.22) 0%, transparent 75%)",
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />
      {/* Phone shell */}
      <div
        className="relative z-10 overflow-hidden rounded-[48px] shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #1c1c1e 0%, #111 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
          padding: "12px 8px 20px",
        }}
      >
        {/* Dynamic island */}
        <div className="mb-3 flex justify-center">
          <div className="h-7 w-24 rounded-full bg-black" />
        </div>
        {/* Chat content */}
        <div
          className="overflow-hidden rounded-[36px]"
          style={{ background: "#000", minHeight: 480 }}
        >
          <SmsIphonePreview />
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function GatewayLanding() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden font-sans"
      style={{ background: "#08090a" }}
    >
      {/* ── Background ticker rows ─────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col justify-between overflow-hidden py-20"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      >
        {/* Row 1 — top area, scrolls left */}
        <div className="mt-4 overflow-hidden opacity-100">
          <TickerRow items={ROW_A} speed={36} />
        </div>
        {/* Row 2 — middle, scrolls right */}
        <div className="overflow-hidden opacity-100">
          <TickerRow items={ROW_B} speed={28} reverse />
        </div>
        {/* Row 3 — bottom area, scrolls left */}
        <div className="mb-4 overflow-hidden opacity-100">
          <TickerRow items={ROW_A.slice(8)} speed={32} />
        </div>
      </div>

      {/* ── Subtle center dark vignette (keeps ticker readable near edges only) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(8,9,10,0.82) 0%, transparent 100%)",
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-center px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/images/homebids-logo-new.png?v=2"
            alt="HomeBids"
            width={200}
            height={50}
            className="pointer-events-none object-contain"
            style={{ height: "clamp(44px, 9vw, 64px)", width: "auto", filter: "brightness(0) invert(1)" }}
            priority
          />
        </motion.div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-8 lg:py-0">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">

            {/* ── Left: copy + CTAs ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[520px]"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
                style={{
                  background: "rgba(10,132,255,0.12)",
                  border: "1px solid rgba(10,132,255,0.3)",
                  color: "#0A84FF",
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0A84FF] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0A84FF]" />
                </span>
                AI-Powered Home Service
              </motion.div>

              {/* Headline */}
              <h1
                className="text-balance font-extrabold leading-[1.05] tracking-tight text-white"
                style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
              >
                Meet HomeBids AI
              </h1>

              {/* Sub */}
              <p className="mt-3 max-w-sm text-pretty leading-relaxed text-white/55 sm:text-xl" style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)" }}>
                Your new assistant for all things home service.
              </p>

              {/* Separator question */}
              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-white/35 sm:text-sm">
                Are you a homeowner or a home service company?
              </p>

              {/* CTA buttons */}
              <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Link
                    href="/?home=1"
                    className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl px-7 text-base font-bold text-white transition-all sm:w-auto"
                    style={{
                      background: "#0A84FF",
                      boxShadow: "0 0 24px rgba(10,132,255,0.4)",
                    }}
                  >
                    <Home className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                    {"I'm a Homeowner"}
                    <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Link
                    href="/contractors/dashboard"
                    className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl px-7 text-base font-bold transition-all sm:w-auto"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      color: "rgba(255,255,255,0.85)",
                      boxShadow: "0 0 0 0 transparent",
                    }}
                  >
                    <Wrench className="h-5 w-5 transition-transform group-hover:rotate-12" />
                    {"I'm a Contractor"}
                    <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              </div>

              {/* Tagline */}
              <p className="mt-6 text-sm text-white/25 tracking-wide">
                Better bids. Better homes.
              </p>
            </motion.div>

            {/* ── Right: animated iPhone mockup ────────────────────────── */}
            {mounted && (
              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center lg:justify-end"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PhoneMockup />
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer tagline ─────────────────────────────────────────────────── */}
      <footer className="relative z-10 pb-8 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-xs text-white/20 tracking-widest uppercase"
        >
          homebids.ai
        </motion.p>
      </footer>
    </div>
  );
}
