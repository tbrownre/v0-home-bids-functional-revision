"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useAnimationFrame, motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Home, Wrench } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { useSignInModal } from "@/components/sign-in-modal-provider";
import {
  Dialog,
  DialogContent,
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

// ── SMS number — update this to the real HomeBids number ─────────────────────
const HOMEBIDS_SMS_NUMBER = "18005551234";

// ── Role picker modal (opened by "Try for free") ──────────────────────────────
function RolePickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const handleHomeowner = () => {
    onClose();
    localStorage.setItem("homebids_audience", "homeowner");
    const body = encodeURIComponent("Hey HomeBids, I need help with");
    window.open(`sms:${HOMEBIDS_SMS_NUMBER}&body=${body}`, "_self");
  };

  const handlePro = () => {
    onClose();
    localStorage.setItem("homebids_audience", "contractor");
    const body = encodeURIComponent("Hey HomeBids, lets build a bid");
    window.open(`sms:${HOMEBIDS_SMS_NUMBER}&body=${body}`, "_self");
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
          <DialogContent
            className="sm:max-w-md overflow-hidden rounded-3xl p-0 border-0"
            style={{
              background: "linear-gradient(160deg, #ffffff 0%, #f0f4ff 100%)",
              boxShadow: "0 32px 80px rgba(10,132,255,0.18), 0 8px 24px rgba(0,0,0,0.10)",
            }}
          >
            {/* Top accent bar removed */}

            <div className="flex flex-col items-center px-8 pt-8 pb-8">

              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <HomeBidsLogo size="32px" linked={false} />
              </div>

              {/* Question */}
              <p className="mb-7 text-center text-[22px] font-extrabold leading-tight tracking-tight text-foreground">
                Are you a homeowner or a home service professional?
              </p>

              {/* Choice cards */}
              <div className="flex w-full flex-col gap-3">

                {/* Homeowner card */}
                <button
                  type="button"
                  onClick={handleHomeowner}
                  className="group relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-2xl border border-[#0A84FF]/20 bg-white px-5 py-5 text-center shadow-sm transition-all duration-200 hover:border-[#0A84FF]/60 hover:shadow-[0_4px_20px_rgba(10,132,255,0.18)] active:scale-[0.98]"
                >
                  {/* Icon */}
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #0A84FF, #34aaff)" }}
                  >
                    <Home className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-[15px] font-bold text-foreground">{"I'm a Homeowner"}</p>
                    <p className="text-xs text-muted-foreground">Get bids from verified pros via text</p>
                  </div>

                  {/* Hover shimmer */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "linear-gradient(100deg, transparent 40%, rgba(10,132,255,0.04) 100%)" }}
                  />
                </button>

                {/* Contractor card */}
                <button
                  type="button"
                  onClick={handlePro}
                  className="group relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-2xl border border-foreground/10 bg-white px-5 py-5 text-center shadow-sm transition-all duration-200 hover:border-foreground/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] active:scale-[0.98]"
                >
                  {/* Icon */}
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #1c1c1e, #3a3a3c)" }}
                  >
                    <Wrench className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-[15px] font-bold text-foreground">{"I'm a Home Service Pro"}</p>
                    <p className="text-xs text-muted-foreground">Build winning bids with AI</p>
                  </div>

                  {/* Hover shimmer */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "linear-gradient(100deg, transparent 40%, rgba(0,0,0,0.025) 100%)" }}
                  />
                </button>
              </div>

              {/* Trust line */}
              <p className="mt-5 text-center text-[11px] text-muted-foreground/60">
                No app download required &middot; Free to start &middot; Cancel anytime
              </p>
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
  const { openSignIn } = useSignInModal();

  useEffect(() => setMounted(true), []);

  const openRolePicker = useCallback(() => setRolePickerOpen(true), []);

  return (
    // Normal document flow so root-layout <Footer /> renders below naturally
    <div className="relative overflow-x-hidden font-sans" style={{ background: "#f9f9f9" }}>

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
          <div className="shrink-0">
            <HomeBidsLogo size="clamp(20px, 2.5vw, 26px)" />
          </div>

          {/* Nav — right-aligned, noticeably smaller than the logo */}
          <nav className="flex shrink-0 items-center gap-2">
            {/* Log in — opens sign-in modal */}
            <button
              type="button"
              onClick={openSignIn}
              className="inline-flex h-8 items-center rounded-full px-3.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Log in
            </button>

            {/* Try for free — opens role picker */}
            <button
              type="button"
              onClick={openRolePicker}
              className="inline-flex h-8 items-center rounded-full px-3.5 text-sm font-semibold bg-[#0A84FF] text-white hover:bg-[#006EDB] transition-colors"
            >
              Try for free
            </button>
          </nav>
        </div>
      </header>

      {/* ── Main — z-10, centered column ────────────────────────────────── */}
      <main
        className="relative mx-auto flex max-w-2xl flex-col items-center px-5 pt-4 text-center"
        style={{ zIndex: 10, paddingBottom: "47px" }}
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
            <a
              href="sms:+18722964991?&body=Hi%20Ava%2C%20I%20need%20help%20with%20a%20home%20project"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-8 text-base font-semibold bg-[#0A84FF] text-white hover:bg-[#006EDB] transition-colors"
            >
              <Home className="h-[18px] w-[18px] shrink-0" />
              {"I'm a Homeowner"}
            </a>
            <a
              href="https://homebids-semi-app-ac7g.vercel.app/sign-in"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-8 text-base font-semibold border border-border bg-white/80 text-foreground hover:bg-white transition-colors"
            >
              <Wrench className="h-[18px] w-[18px] shrink-0" />
              {"I'm a Contractor"}
            </a>
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
              style={{ width: 320, height: 640 }}
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
              {/* No float — static after entrance so it doesn't bob */}
              <SmsIphonePreview />
            </div>
          </motion.div>
        )}
      </main>

      {/* Role picker modal — opened by "Try for free" in the header nav */}
      <RolePickerModal open={rolePickerOpen} onClose={() => setRolePickerOpen(false)} />
    </div>
  );
}
