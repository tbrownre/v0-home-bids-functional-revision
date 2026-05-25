"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { HeaderWithEarlyAccess } from "@/components/header-with-early-access";
import { Button } from "@/components/ui/button";
import {
  Link2,
  Users,
  TrendingUp,
  DollarSign,
  Repeat2,
  Star,
  Zap,
  ArrowRight,
  Home,
  Hammer,
  RefreshCw,
  MousePointerClick,
  Award,
  CheckCircle2,
  Infinity,
} from "lucide-react";

// ─── Animation variants ───────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

// ─── Smooth animated number hook ──────────────────────────────────────
function useAnimatedNumber(target: number, duration = 600): number {
  const [displayed, setDisplayed] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return displayed;
}

// ─── Earnings counter ─────────────────────────────────────────────────
const COUNTER_STEPS = [0, 347, 1284, 4920, 11760, 28440];

function EarningsCounter() {
  const [index, setIndex] = useState(0);
  const animated = useAnimatedNumber(COUNTER_STEPS[index], 900);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % COUNTER_STEPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-block tabular-nums">
      ${animated.toLocaleString()}
    </span>
  );
}

// ─── Floating social proof ────────────────────────────────────────────
const NOTIFICATION_MESSAGES = [
  "Alex just earned $1,240",
  "Sarah just earned $1,875",
  "Michael just earned $2,310",
  "Jessica just earned $3,420",
  "Chris just earned $4,180",
  "Amanda just earned $5,760",
  "Ryan just earned $2,950",
  "Lauren just earned $6,430",
  "Brandon just earned $7,125",
  "Ashley just earned $3,880",
  "Jason just earned $8,240",
  "Megan just earned $1,690",
  "Tyler just earned $4,950",
  "Brittany just earned $5,210",
  "Kevin just earned $9,875",
  "Nicole just earned $2,760",
  "Daniel just earned $6,890",
  "Rachel just earned $3,140",
  "Justin just earned $7,640",
  "Emily just earned $4,720",
  "Matt just earned $1,995",
  "Olivia just earned $8,910",
  "Andrew just earned $5,480",
  "Samantha just earned $2,425",
  "Jordan just earned $6,275",
  "Taylor just earned $3,995",
  "Morgan just earned $9,240",
  "Casey just earned $4,360",
  "Dylan just earned $7,890",
  "Brooke just earned $5,995",
];

function FloatingSocialProof() {
  // { text, id } — id changes each cycle so AnimatePresence remounts cleanly
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const indexRef = useRef(0);
  const idRef = useRef(0);

  useEffect(() => {
    const show = () => {
      const text = NOTIFICATION_MESSAGES[indexRef.current % NOTIFICATION_MESSAGES.length];
      indexRef.current += 1;
      idRef.current += 1;
      setToast({ text, id: idRef.current });

      // Hide after 3.6 s
      setTimeout(() => setToast(null), 3600);
    };

    // First popup after 4 s, then every 8 s (3.6 s visible + 4.4 s gap)
    const first = setTimeout(show, 4000);
    const loop  = setInterval(show, 8000);
    return () => { clearTimeout(first); clearInterval(loop); };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-6 left-4 z-50 sm:bottom-8 sm:left-6">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl shadow-black/5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <p className="whitespace-nowrap text-sm font-medium text-foreground">
              <span>{toast.text.split(" just earned ")[0]}</span>{" "}
              <span className="font-normal text-muted-foreground">just earned</span>{" "}
              <span className="font-bold text-green-600">
                {toast.text.split(" just earned ")[1]}
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Earnings simulator ───────────────────────────────────────────────
const HO_MONTHLY_PRICE = 9.99;
const CONTRACTOR_PLAN_OPTIONS = [
  { label: "$9.99/mo",  value: 9.99 },
  { label: "$29/mo",   value: 29 },
  { label: "$79/mo",   value: 79 },
];
const COMMISSION_RATE = 0.2;

function EarningsSimulator() {
  const [homeowners, setHomeowners] = useState(25);
  const [contractors, setContractors] = useState(25);
  const [ctPlanIndex, setCtPlanIndex] = useState(1); // default $29/mo

  const ctPlan = CONTRACTOR_PLAN_OPTIONS[ctPlanIndex];
  const monthly =
    homeowners * HO_MONTHLY_PRICE * COMMISSION_RATE +
    contractors * ctPlan.value * COMMISSION_RATE;
  const annual = monthly * 12;

  const animatedMonthly = useAnimatedNumber(Math.round(monthly), 500);
  const animatedAnnual = useAnimatedNumber(Math.round(annual), 500);
  const animatedHO = useAnimatedNumber(homeowners, 200);
  const animatedCT = useAnimatedNumber(contractors, 200);

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-sm">
      {/* Inputs */}
      <div className="grid gap-8 sm:grid-cols-2">
        {/* Homeowners */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Homeowners referred
            </label>
            <span className="w-12 text-right text-lg font-bold tabular-nums text-foreground">
              {animatedHO}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={homeowners}
            onChange={(e) => setHomeowners(Number(e.target.value))}
            className="mt-3 h-2 w-full cursor-pointer accent-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            @ ${HO_MONTHLY_PRICE}/mo plan
          </p>
        </div>

        {/* Contractors */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Contractors referred
            </label>
            <span className="w-12 text-right text-lg font-bold tabular-nums text-foreground">
              {animatedCT}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={contractors}
            onChange={(e) => setContractors(Number(e.target.value))}
            className="mt-3 h-2 w-full cursor-pointer accent-foreground"
          />
          {/* Contractor plan selector */}
          <div className="mt-3 flex gap-2">
            {CONTRACTOR_PLAN_OPTIONS.map((opt, i) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setCtPlanIndex(i)}
                className={`flex-1 rounded-xl border px-2 py-1.5 text-xs font-semibold transition-colors ${
                  ctPlanIndex === i
                    ? "border-foreground bg-foreground text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Commission badge */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          20% lifetime commission — locked in forever
        </span>
      </div>

      {/* Output — fixed min-height prevents layout shift */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-muted px-6 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Est. Monthly Recurring
          </p>
          <p className="mt-2 min-w-[6ch] text-3xl font-bold tabular-nums tracking-tight text-foreground">
            ${animatedMonthly.toLocaleString()}
          </p>
        </div>
        <div className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-foreground px-6 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
            Est. Annual Recurring
          </p>
          <p className="mt-2 min-w-[6ch] text-3xl font-bold tabular-nums tracking-tight text-primary-foreground">
            ${animatedAnnual.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Because commissions are lifetime, every referral can keep paying you{" "}
        <strong className="text-foreground">month after month.</strong>
      </p>
    </div>
  );
}

// ─── Scroll-triggered section ─────────────────────────────────────────
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      id={id}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Levels ───────────────────────────────────────────────────────────
const LEVELS = [
  {
    level: 1,
    title: "Starter Affiliate",
    range: "1–10 referrals",
    perks: ["Affiliate starter badge", "Share scripts", "Local posting playbook"],
    dark: false,
    featured: false,
  },
  {
    level: 2,
    title: "Growth Partner",
    range: "11–50 referrals",
    perks: ["Priority affiliate support", "Bonus swipe files", "Featured partner shoutout"],
    dark: false,
    featured: false,
  },
  {
    level: 3,
    title: "Power Partner",
    range: "51–150 referrals",
    perks: ["Apple Watch bonus eligibility", "Private growth strategy call", "Early access to new affiliate tools"],
    dark: true,
    featured: false,
  },
  {
    level: 4,
    title: "Elite Partner",
    range: "151+ referrals",
    perks: ["Premium prize eligibility", "VIP partner status", "Advanced dashboard access", "Exclusive HomeBids partner opportunities"],
    dark: true,
    featured: true,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────
export default function AffiliatesPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderWithEarlyAccess />

      {/* Floating social proof notification */}
      <FloatingSocialProof />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-sm">
                <Zap className="h-3 w-3" /> Founding Affiliates Open
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-6 text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl"
            >
              Turn Every Home Project Into{" "}
              <em className="not-italic underline decoration-muted-foreground/30 underline-offset-4">
                Recurring Income
              </em>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Earn <strong className="text-foreground">20% lifetime commissions</strong> on every homeowner AND
              contractor you refer. Paid monthly. No cap. Forever.
            </motion.p>

            {/* Animated earnings counter */}
            <motion.div
              variants={fadeUp}
              className="mx-auto mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-8 py-5 shadow-sm"
            >
              <TrendingUp className="h-5 w-5 shrink-0 text-green-600" />
              <p className="text-sm font-medium text-muted-foreground">
                Affiliate earnings:&nbsp;
                <span className="text-xl font-bold text-foreground">
                  <EarningsCounter />
                </span>
                <span className="ml-1 text-base font-medium text-muted-foreground">/month</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Your referrals can compound across homeowners and contractors — month after month.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Button size="lg" className="h-12 gap-2 px-8 text-base" asChild>
                <Link href="#signup">
                  Start Earning Now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 bg-transparent px-8 text-base"
                asChild
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            >
              {[
                "Paid monthly",
                "No cap",
                "Earn from both sides",
                "Founding advantages",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <Section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Three Steps. Lifetime Income.
            </h2>
            <p className="mt-3 text-muted-foreground">
              No experience needed. No risk. Just share and earn.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Link2,
                step: "01",
                title: "Share Your Link",
                body: "Post in Facebook groups, text homeowners, or send to contractors. One link. Every platform.",
              },
              {
                icon: Users,
                step: "02",
                title: "They Join HomeBids",
                body: "Homeowners post jobs. Contractors bid on those jobs. The platform does the rest.",
              },
              {
                icon: Repeat2,
                step: "03",
                title: "You Get Paid for Life",
                body: "Earn 20% from ALL revenue generated by your referrals — homeowners AND contractors — forever.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative rounded-3xl border border-border bg-card p-7 shadow-sm"
              >
                <span className="absolute right-6 top-6 select-none text-4xl font-black leading-none text-muted-foreground/20">
                  {item.step}
                </span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── The Flywheel ──────────────────────────────────────────────── */}
      <Section className="bg-foreground px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div variants={fadeUp}>
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              {"This Isn't a One-Time Referral."}
              <br />
              {"It's a Flywheel."}
            </h2>
            <p className="mt-4 text-primary-foreground/70">
              Every referral compounds. Every project generates more referrals. You earn from all of it.
            </p>
          </motion.div>

          {/* Flywheel nodes */}
          <motion.div
            variants={fadeUp}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { label: "You share", icon: Link2 },
              { label: "Homeowner joins", icon: Home },
              { label: "Contractors bid", icon: Hammer },
              { label: "More homeowners", icon: Users },
              { label: "You earn again", icon: DollarSign },
            ].map((node, i, arr) => (
              <React.Fragment key={node.label}>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
                    <node.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="max-w-[72px] text-center text-xs font-semibold leading-tight text-primary-foreground/80">
                    {node.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary-foreground/30" />
                )}
              </React.Fragment>
            ))}
            <div className="ml-1 flex items-center gap-1 text-primary-foreground/40">
              <RefreshCw className="h-4 w-4" />
              <span className="text-xs font-semibold">loops</span>
            </div>
          </motion.div>

          <motion.div variants={stagger} className="mt-10 grid gap-4 text-left sm:grid-cols-2">
            {[
              "You refer a homeowner → they post a job",
              "Contractors join to bid → YOU earn from them too",
              "Those contractors bring MORE homeowners → YOU earn again",
              "This compounds over time with zero extra work",
            ].map((point) => (
              <motion.div
                key={point}
                variants={fadeUp}
                className="flex items-start gap-3 rounded-2xl bg-primary-foreground/5 px-5 py-4"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                <p className="text-sm text-primary-foreground/80">{point}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── Commission Structure ───────────────────────────────────────── */}
      <Section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple. Transparent. Powerful.
            </h2>
          </motion.div>

          <motion.div variants={stagger} className="mt-12 grid gap-6 sm:grid-cols-2">
            <motion.div
              variants={fadeUp}
              className="rounded-3xl border border-border bg-card p-8 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                <Home className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Homeowner
              </p>
              <p className="mt-2 text-4xl font-bold text-foreground">20%</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Lifetime Commission</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Earn 20% of every payment made by homeowners you refer.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-3xl border border-border bg-card p-8 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
                <Hammer className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Contractor
              </p>
              <p className="mt-2 text-4xl font-bold text-foreground">20%</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Lifetime Commission</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Earn 20% of every payment made by contractors you refer.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-6 flex items-start gap-4 rounded-3xl border-2 border-foreground bg-card px-8 py-6"
          >
            <Infinity className="mt-0.5 h-6 w-6 shrink-0 text-foreground" />
            <div>
              <p className="font-bold text-foreground">
                This is LIFETIME. Not 30 days. Not 1 year. Forever.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                As long as your referrals remain active on HomeBids, you keep earning.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── Earnings Simulator ────────────────────────────────────────── */}
      <Section className="bg-muted/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What Could 1,000 Referrals Become?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Homeowners are fixed. Contractors can scale up to higher monthly plans — and you earn 20% for life.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The more contractors you refer, the more powerful the upside becomes.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-10">
            <EarningsSimulator />
          </motion.div>
        </div>
      </Section>

      {/* ── Affiliate Levels ──────────────────────────────────────────── */}
      <Section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your Affiliate Journey
            </h2>
            <p className="mt-3 text-muted-foreground">
              Progress through levels and unlock exclusive rewards as you grow.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {LEVELS.map((lvl) => (
              <motion.div
                key={lvl.level}
                variants={fadeUp}
                className={`relative flex flex-col rounded-3xl p-7 ${
                  lvl.dark ? "bg-foreground" : "border border-border bg-card"
                } ${lvl.featured ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
              >
                {lvl.featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                    Most Rewarding
                  </span>
                )}
                <div
                  className={`mb-1 text-xs font-semibold uppercase tracking-widest ${
                    lvl.dark ? "text-primary-foreground/50" : "text-muted-foreground"
                  }`}
                >
                  Level {lvl.level}
                </div>
                <h3
                  className={`text-base font-bold ${
                    lvl.dark ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {lvl.title}
                </h3>
                <p
                  className={`mb-5 mt-1 text-xs ${
                    lvl.dark ? "text-primary-foreground/50" : "text-muted-foreground"
                  }`}
                >
                  {lvl.range}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {lvl.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          lvl.dark ? "text-green-400" : "text-green-600"
                        }`}
                      />
                      <span
                        className={`text-xs leading-snug ${
                          lvl.dark ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── Strategy ──────────────────────────────────────────────────── */}
      <Section className="bg-muted/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How Our Top Affiliates Win
            </h2>
            <p className="mt-3 text-muted-foreground">
              Simple tactics. Repeatable results. We handle everything else.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="mt-12 grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: Users,
                title: "Post in local Facebook groups",
                body: "Homeowners ask for contractor recommendations daily. Drop your link and become the trusted source.",
              },
              {
                icon: Home,
                title: "Respond to homeowners",
                body: "When someone is looking for a roofer, plumber, or remodeler — you have the answer.",
              },
              {
                icon: Hammer,
                title: "Share with contractors",
                body: "Contractors want more jobs. HomeBids delivers them. One text to a local pro = recurring income.",
              },
              {
                icon: Link2,
                title: "Be the connector",
                body: "You introduce people to the platform. We handle onboarding, payments, and everything else.",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="flex gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <item.icon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── Dashboard Preview ─────────────────────────────────────────── */}
      <Section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your Dashboard, At a Glance
            </h2>
            <p className="mt-3 text-muted-foreground">
              Track earnings, referrals, and growth — all in one clean view.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
          >
            {/* Mock browser chrome */}
            <div className="flex items-center gap-2 border-b border-border px-6 py-4">
              <div className="h-3 w-3 rounded-full bg-muted" />
              <div className="h-3 w-3 rounded-full bg-muted" />
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span className="ml-3 text-xs font-medium text-muted-foreground">
                  affiliates.homebids.ai/dashboard
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
              {[
                { label: "Total Earnings", value: "$2,841", icon: DollarSign, trend: "+14%" },
                { label: "Monthly Recurring", value: "$483", icon: Repeat2, trend: "+8%" },
                { label: "Active Referrals", value: "31", icon: Users, trend: "+3" },
                { label: "Conversions", value: "68%", icon: MousePointerClick, trend: "+4%" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-muted px-4 py-5">
                  <div className="flex items-start justify-between">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      {stat.trend}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">Power Affiliate</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Level 3
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[34%] rounded-full bg-foreground transition-all" />
                  </div>
                  <span className="text-xs text-muted-foreground">68/200 to Legend</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── You're Family ─────────────────────────────────────────────── */}
      <Section className="bg-foreground px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div variants={stagger}>
            <motion.div variants={fadeUp} className="flex justify-center">
              <Star className="h-8 w-8 text-primary-foreground/50" />
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="mt-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl"
            >
              {"You're Not Just an Affiliate."}
              <br />
              {"You're Family."}
            </motion.h2>
            <motion.div variants={stagger} className="mt-8 flex flex-col gap-3">
              {[
                "We treat our partners like insiders.",
                "We build WITH you.",
                "We grow TOGETHER.",
              ].map((line) => (
                <motion.p
                  key={line}
                  variants={fadeUp}
                  className="text-lg font-medium text-primary-foreground/80"
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>
            <motion.p variants={fadeUp} className="mt-6 text-sm text-primary-foreground/40">
              Early partners will always have the biggest advantage. This window does not stay open forever.
            </motion.p>
          </motion.div>
        </div>
      </Section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <Section id="signup" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div variants={stagger}>
            <motion.h2
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
            >
              Start Building Your Income Stream Today
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
              No experience needed. No risk. Just share and earn.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Button size="lg" className="h-12 gap-2 px-10 text-base" asChild>
                <a href="mailto:affiliates@homebids.ai">
                  Get Your Affiliate Link <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 bg-transparent px-10 text-base"
                asChild
              >
                <a href="mailto:affiliates@homebids.ai?subject=Founding Affiliate Application">
                  Join as a Founding Affiliate
                </a>
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-6 text-sm font-medium text-muted-foreground">
              Early partners will have the biggest advantage.{" "}
              <span className="text-foreground">The window is closing.</span>
            </motion.p>
          </motion.div>
        </div>
      </Section>

      {/* Footer note */}
      <div className="border-t border-border px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Affiliate commissions are paid monthly. Terms apply.
        </p>
      </div>
    </div>
  );
}
