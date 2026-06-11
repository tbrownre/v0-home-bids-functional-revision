"use client";

import { useRef, useEffect, useState } from "react";
import { useAnimationFrame, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Home, Wrench } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { Button } from "@/components/ui/button";

// ── Scrolling ticker — home-service project completions only ──────────────────
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
const ROW_B = [...TICKER_ITEMS.slice(4), ...TICKER_ITEMS.slice(0, 4), ...TICKER_ITEMS.slice(4), ...TICKER_ITEMS.slice(0, 4)];

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
    <div className="flex w-max overflow-visible will-change-transform" ref={ref}>
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
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden font-sans"
      style={{ background: "#f9fafb" }}
    >
      {/* ── Background ticker rows — desktop only ─────────────────────────── */}
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

      {/* ── Vignette — clears the center for hero content ─────────────────── */}
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
        className="relative flex shrink-0 items-center justify-center border-b border-border px-6 py-3"
        style={{ background: "#f9fafb", zIndex: 10 }}
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
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main
        className="relative flex flex-1 flex-col items-center justify-start overflow-y-auto px-5 pt-10 pb-6 lg:justify-center lg:overflow-hidden lg:py-0"
        style={{ zIndex: 2 }}
      >
        <div className="w-full max-w-6xl">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">

            {/* ── Left: copy + CTAs ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[480px]"
            >
              {/* Headline */}
              <h1
                className="text-balance font-extrabold leading-[1.08] tracking-tight text-foreground"
                style={{ fontSize: "clamp(2.6rem, 6vw, 4.2rem)" }}
              >
                Hi, we&apos;re HomeBids.
              </h1>

              {/* Sub-headline */}
              <p
                className="mt-5 max-w-sm text-pretty leading-relaxed text-muted-foreground"
                style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.25rem)" }}
              >
                Are you a homeowner or a home service professional?
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-13 gap-2.5 rounded-full px-7 text-base font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 w-full sm:w-auto"
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
                  className="h-13 gap-2.5 rounded-full px-7 text-base font-semibold w-full sm:w-auto"
                >
                  <Link href="/contractors/dashboard">
                    <Wrench className="h-5 w-5 shrink-0" />
                    {"I'm a Contractor"}
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* ── Right: iPhone — full SmsIphonePreview, scaled up ─────── */}
            {mounted && (
              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex justify-center lg:justify-end"
                style={{ zIndex: 3 }}
              >
                {/* Soft brand glow beneath the phone */}
                <div
                  className="pointer-events-none absolute -inset-8 rounded-full"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 50% at 50% 65%, rgba(10,132,255,0.1) 0%, transparent 72%)",
                    filter: "blur(20px)",
                    zIndex: 0,
                  }}
                  aria-hidden="true"
                />
                {/* Subtle float animation */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                  style={{ zIndex: 1 }}
                >
                  {/*
                    Scale up the phone ~25% beyond SmsIphonePreview's default sm:w-[300px].
                    We do this by wrapping in a div that overrides the inner w-[272px]/sm:w-[300px]
                    via a CSS scale transform — keeps all proportions and the internal
                    layout correct without touching the SmsIphonePreview source.
                  */}
                  <div
                    style={{
                      transform: "scale(1.25)",
                      transformOrigin: "top center",
                      // Reserve the scaled footprint so it doesn't collapse the layout
                      marginBottom: "calc((1.25 - 1) * 560px * 0.5)",
                    }}
                  >
                    <SmsIphonePreview />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="relative shrink-0 border-t border-border pb-5 pt-4 text-center"
        style={{ background: "#f9fafb", zIndex: 10 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          homebids.ai
        </p>
      </footer>
    </div>
  );
}
