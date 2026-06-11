"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useAnimationFrame, motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Home, Wrench } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

// Four rows offset for snake weave effect — alternating LTR / RTL
const ROW_A = [...TICKER_ITEMS, ...TICKER_ITEMS];
const ROW_B = [...TICKER_ITEMS.slice(5), ...TICKER_ITEMS.slice(0, 5), ...TICKER_ITEMS.slice(5), ...TICKER_ITEMS.slice(0, 5)];
const ROW_C = [...TICKER_ITEMS.slice(10), ...TICKER_ITEMS.slice(0, 10), ...TICKER_ITEMS.slice(10), ...TICKER_ITEMS.slice(0, 10)];
const ROW_D = [...TICKER_ITEMS.slice(3), ...TICKER_ITEMS.slice(0, 3), ...TICKER_ITEMS.slice(3), ...TICKER_ITEMS.slice(0, 3)];

const ROWS = [
  { items: ROW_A, speed: 32, reverse: false, opacity: 0.20 },
  { items: ROW_B, speed: 26, reverse: true,  opacity: 0.15 },
  { items: ROW_C, speed: 30, reverse: false, opacity: 0.18 },
  { items: ROW_D, speed: 24, reverse: true,  opacity: 0.14 },
] as const;

// ── Single ticker row ─────────────────────────────────────────────────────────
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
          className="mr-6 inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white/60 px-3.5 py-1 text-[11px] font-medium tracking-wide text-muted-foreground select-none"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Role picker modal (reused for "Try for free") ─────────────────────────────
function RolePickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
          <DialogContent
            className="sm:max-w-sm overflow-hidden rounded-3xl p-0 border-0 shadow-2xl"
            style={{ background: "#f1f0f0" }}
          >
            <DialogHeader className="px-8 pt-8 pb-0 text-center">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <Image
                  src="/images/homebids-wordmark.png"
                  alt="HomeBids"
                  width={200}
                  height={50}
                  className="h-10 w-auto object-contain"
                  style={{ mixBlendMode: "multiply" }}
                />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Welcome to HomeBids
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                Are you a homeowner or a home service professional?
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 px-8 pb-8 pt-6">
              <Button
                asChild
                size="lg"
                className="h-12 w-full gap-2.5 rounded-full text-base font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
                onClick={onClose}
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
                className="h-12 w-full gap-2.5 rounded-full text-base font-semibold bg-white hover:bg-white/90"
                onClick={onClose}
              >
                <Link href="/contractors/dashboard">
                  <Wrench className="h-[18px] w-[18px] shrink-0" />
                  {"I'm a Home Service Pro"}
                </Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function GatewayLanding() {
  const [mounted, setMounted] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const openRolePicker = useCallback(() => setRolePickerOpen(true), []);

  return (
    // Normal document flow so root-layout <Footer /> renders below naturally
    <div className="relative overflow-x-hidden font-sans" style={{ background: "#f1f0f0" }}>

      {/* ── Snake ticker rows — z-0, absolute, behind ALL content ───────────
          Four rows spread across 15 / 38 / 63 / 83 % down the above-fold area.
          Content (header + hero + phone) sits at z-10 on top.             */}
      <div
        className="pointer-events-none absolute left-0 right-0 overflow-hidden"
        aria-hidden="true"
        style={{ zIndex: 0, top: 0, height: "100vh" }}
      >
        {ROWS.map((row, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 overflow-hidden"
            style={{
              top: `${[15, 38, 63, 83][i]}%`,
              opacity: row.opacity,
            }}
          >
            <TickerRow items={row.items} speed={row.speed} reverse={row.reverse} />
          </div>
        ))}
      </div>

      {/* ── Header — z-10, transparent bg so page bg shows through ─────── */}
      <header
        className="relative w-full px-5 py-4 lg:px-10"
        style={{ zIndex: 10 }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">

          {/* Logo — left-aligned, prominent */}
          <Link href="/" className="shrink-0" tabIndex={0}>
            <Image
              src="/images/homebids-wordmark.png"
              alt="HomeBids"
              width={480}
              height={120}
              className="pointer-events-none object-contain object-left"
              style={{
                height: "clamp(44px, 8vw, 68px)",
                width: "auto",
                mixBlendMode: "multiply",
              }}
              priority
            />
          </Link>

          {/* Nav — right-aligned, noticeably smaller than the logo */}
          <nav className="flex shrink-0 items-center gap-2">
            {/* Log in — text link style */}
            <Button
              asChild
              variant="ghost"
              className="h-8 rounded-full px-4 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-black/6"
            >
              <Link href="/auth/sign-in">Log in</Link>
            </Button>

            {/* Try for free — opens role picker */}
            <Button
              onClick={openRolePicker}
              className="h-8 rounded-full px-4 text-sm font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90"
            >
              Try for free
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Main — z-10, centered column ────────────────────────────────── */}
      <main
        className="relative mx-auto flex max-w-2xl flex-col items-center px-5 pb-16 pt-4 text-center"
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
            style={{ fontSize: "clamp(2.6rem, 7vw, 5rem)" }}
          >
            Hi, we&apos;re{" "}
            <span style={{ color: "#0A84FF" }}>HomeBids.</span>
          </h1>

          <p
            className="mt-3 max-w-[400px] text-pretty leading-relaxed text-muted-foreground"
            style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)" }}
          >
            Are you a homeowner or a home service professional?
          </p>

          {/* CTA buttons */}
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
              className="h-12 gap-2.5 rounded-full px-8 text-base font-semibold bg-white/80 hover:bg-white"
            >
              <Link href="/contractors/dashboard">
                <Wrench className="h-[18px] w-[18px] shrink-0" />
                {"I'm a Home Service Pro"}
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* iPhone mockup — fixed container to prevent layout shifts when
            messages animate in. SmsIphonePreview shell = ~300×560px.       */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex justify-center"
          >
            <div
              className="relative flex-shrink-0"
              style={{ width: 320, height: 590 }}
            >
              {/* Subtle blue ambient glow */}
              <div
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full"
                style={{
                  background: "radial-gradient(ellipse at 50% 0%, rgba(10,132,255,0.13) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
                aria-hidden="true"
              />
              {/* Float animation — no `layout` prop so wrapper never resizes */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0 }}
              >
                <SmsIphonePreview />
              </motion.div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Role picker modal — opened by "Try for free" in the header nav */}
      <RolePickerModal open={rolePickerOpen} onClose={() => setRolePickerOpen(false)} />
    </div>
  );
}
