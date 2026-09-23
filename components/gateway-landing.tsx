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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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

// ── Role picker modal (opened by "Try for free") ──────────────────────────────
function RolePickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logoHref = useContractorLogoHref();

  const handleHomeowner = () => {
    onClose();
    localStorage.setItem("homebids_audience", "homeowner");
    // On SMS-capable devices (phones, Mac with Messages) open the native SMS
    // thread. On other desktop environments go to the homeowner page —
    // /new-job is retired (homeowners create jobs by texting Ava).
    if (isSmsCapableDevice()) {
      window.location.href = HOMEBIDS_SMS.homeowner.href;
    } else {
      window.location.href = "/homeowners";
    }
  };

  const handlePro = () => {
    onClose();
    localStorage.setItem("homebids_audience", "contractor");
    window.location.href = "/contractors/signup";
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
                <HomeBidsLogo 
                  size="32px" 
                  href={logoHref} 
                />
              </div>

              {/* Question */}
              <p className="mb-7 text-center text-[22px] font-extrabold leading-tight tracking-tight text-foreground">
                Are you a homeowner or a home service professional?
              </p>
