"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useAnimationFrame, motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Home, Wrench } from "lucide-react";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { HomeownerTextModal } from "@/components/homeowner-text-modal";
import { Button } from "@/components/ui/button";
import { getSmsLink, HOMEBIDS_SMS, isSmsCapableDevice } from "@/lib/sms-config";
import { useSignInModal } from "@/components/sign-in-modal-provider";
import { useContractorLogoHref } from "@/lib/use-contractor-logo-href";
import { RolePickerModal } from "@/components/role-picker-modal";

// ── Ticker items ──────────────────────────────────────────────────────────────
// status color keys: "sent" | "approved" | "created" | "contacted" | "done" | "started"
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  sent:      { bg: "rgba(10,132,255,0.10)",  text: "#0A84FF" }, // blue  — proposal/bid sent
  approved:  { bg: "rgba(48,209,88,0.12)",   text: "#1A8F3C" }, // green — bid approved / job won
  created:   { bg: "rgba(100,100,220,0.10)", text: "#5856D6" }, // indigo — scope/estimate created
  contacted: { bg: "rgba(255,159,10,0.12)",  text: "#B56F00" }, // amber — contractor contacted
  done:      { bg: "rgba(48,209,88,0.10)",   text: "#1A8F3C" }, // green — finished
  started:   { bg: "rgba(255,159,10,0.10)",  text: "#B56F00" }, // amber — work started
};

interface TickerItem { job: string; status: string; colorKey: keyof typeof STATUS_COLORS }

const TICKER_ITEMS: TickerItem[] = [
  { job: "Roof Leak",         status: "Proposal sent",        colorKey: "sent"      },
  { job: "HVAC Repair",       status: "Bid approved",         colorKey: "approved"  },
  { job: "Kitchen Remodel",   status: "Scope created",        colorKey: "created"   },
  { job: "Plumbing Leak",     status: "Contractor contacted", colorKey: "contacted" },
  { job: "Water Heater",      status: "Bid approved",         colorKey: "approved"  },
  { job: "Bathroom Tile",     status: "Scope created",        colorKey: "created"   },
  { job: "Fence Replacement", status: "Proposal sent",        colorKey: "sent"      },
  { job: "Interior Paint",    status: "Work started",         colorKey: "started"   },
  { job: "Deck Refinish",     status: "Bid approved",         colorKey: "approved"  },
  { job: "Window Replace",    status: "Contractor contacted", colorKey: "contacted" },
  { job: "Hardwood Floors",   status: "Scope created",        colorKey: "created"   },
  { job: "AC Tune-Up",        status: "Proposal sent",        colorKey: "sent"      },
  { job: "Drywall Repair",    status: "Work started",         colorKey: "started"   },
  { job: "Gutter Clean",      status: "Bid approved",         colorKey: "approved"  },
  { job: "Sprinkler Repair",  status: "Contractor contacted", colorKey: "contacted" },
  { job: "Landscape Design",  status: "Scope created",        colorKey: "created"   },
  { job: "Garage Door",       status: "Proposal sent",        colorKey: "sent"      },
  { job: "Pool Resurfacing",  status: "Bid approved",         colorKey: "approved"  },
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
function TickerRow({ items, speed, reverse = false }: { items: TickerItem[]; speed: number; reverse?: boolean }) {
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
      {items.map((item, i) => {
        const colors = STATUS_COLORS[item.colorKey];
        return (
          <span
            key={i}
            className="mr-5 inline-flex shrink-0 items-center gap-0 rounded-full border border-border bg-white/70 select-none overflow-hidden"
            style={{ fontSize: 11, fontWeight: 500 }}
          >
            {/* Job label */}
            <span className="px-3 py-[5px] text-muted-foreground/80 tracking-wide">
              {item.job}
            </span>
            {/* Divider */}
            <span className="text-border/60 pr-1">·</span>
            {/* Status badge */}
            <span
              className="px-2.5 py-[5px] rounded-full mr-[3px] tracking-wide font-semibold"
              style={{ background: colors.bg, color: colors.text }}
            >
              {item.status}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function GatewayLanding() {
  const [mounted, setMounted] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const { openSignIn } = useSignInModal();
  const logoHref = useContractorLogoHref();

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
            <HomeBidsLogo size="clamp(20px, 2.5vw, 26px)" href={logoHref} />
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
            style={{ fontSize: "clamp(2.6rem, 7vw, 4.0625rem)" }}
          >
            Home Service help,{" "}
            <span style={{ color: "#0A84FF" }}>handled by text.</span>
          </h1>

          <p
            className="mt-3 max-w-[400px] text-pretty leading-relaxed text-muted-foreground"
            style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)" }}
          >
            HomeBids helps homeowners start projects faster and helps contractors create professional bids in minutes.
          </p>

          {/* CTA buttons */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={HOMEBIDS_SMS.homeowner.href}
              onClick={(e) => {
                if (!isSmsCapableDevice()) {
                  e.preventDefault();
                  localStorage.setItem("homebids_audience", "homeowner");
                  setTextModalOpen(true);
                }
              }}
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-8 text-base font-semibold bg-[#0A84FF] text-white hover:bg-[#0A84FF]/90 transition-colors"
            >
              <Home className="h-[18px] w-[18px] shrink-0" />
              {"I'm a Homeowner"}
            </a>
            <Button
              variant="outline"
              size="lg"
              className="h-12 gap-2.5 rounded-full px-8 text-base font-semibold bg-white/80 text-foreground hover:bg-white hover:text-foreground"
              onClick={() => {
                localStorage.setItem("homebids_audience", "contractor");
                window.location.href = "/contractors";
              }}
            >
              <Wrench className="h-[18px] w-[18px] shrink-0" />
              {"I'm a Home Service Pro"}
            </Button>
          </div>

          {/* Below-CTA reassurance line */}
          <p className="mt-4 text-muted-foreground/70 tracking-wide" style={{ fontSize: "11px" }}>
            No app to download.&nbsp; No software to learn.&nbsp; Start by text.
          </p>
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

      {/* Desktop text modal — shown when a non-SMS-capable device taps "I'm a Homeowner" */}
      <HomeownerTextModal open={textModalOpen} onClose={() => setTextModalOpen(false)} />
    </div>
  );
}
