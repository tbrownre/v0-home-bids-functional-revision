"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { signIn as supabaseSignIn } from "@/lib/supabase/actions";
import { AlertCircle, Loader2 as Loader } from "lucide-react";
import { ScrollToTop } from "@/components/scroll-to-top";
import { DemoPopup, DemoCallout } from "@/components/demo-popup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  FileText,
  Building2,
  LogIn,
  Clock,
  DollarSign,
  ChevronRight,
} from "lucide-react";

/* ─── Animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};


/* ─── Rotating words ─── */
const rotatingWords = ["Win More Jobs", "Build Better Bids", "Send Bids Faster", "Save Hours Every Week"];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % rotatingWords.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block overflow-hidden" style={{ minWidth: "20ch" }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
          className="inline-block text-primary"
        >
          {rotatingWords[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─── Animated counter ─── */
function AnimatedNumber({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (inView) mv.set(target);
  }, [inView, target, mv]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);
  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ─── Floating particle background ─── */
function ParticleField() {
  const particles = useRef(
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 14 + 10,
      delay: Math.random() * 6,
    }))
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.current.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -40, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}


/* ─── Plan features ─── */
const planFeatures = [
  "Unlimited AI Bid Builder",
  "SMS / iMessage Workflow",
  "Homeowner Bid Opportunities",
  "Contractor Profile",
  "No bid fees — ever",
  "3-day free trial",
];

/* ─── ROI Calculator ─── */
function ROICalculator() {
  const [jobValue, setJobValue] = useState(100);
  const savedValue = jobValue;
  const monthlyPlan = 99;
  const roi = Math.round((savedValue / monthlyPlan) * 10) / 10;

  return (
    <div className="mx-auto max-w-2xl">
      <div
        className="rounded-2xl border border-primary/20 p-8"
        style={{ background: "rgba(43,127,232,0.04)", backdropFilter: "blur(12px)" }}
      >
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Interactive Calculator</p>
          <h3 className="mt-2 text-2xl font-bold text-foreground">What Is One Lost Job Worth?</h3>
          <p className="mt-2 text-sm text-muted-foreground">Move the slider to see how HomeBids stacks up against a single saved deal.</p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Average Job Value</span>
              <span className="text-xl font-bold text-foreground">${jobValue.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={100}
              max={25000}
              step={500}
              value={jobValue}
              onChange={(e) => setJobValue(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Average job value"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>$100</span>
              <span>$25,000</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-border p-4 text-center" style={{ background: "rgba(0,0,0,0.03)" }}>
              <p className="text-xs text-muted-foreground">HomeBids Cost</p>
              <p className="mt-1 text-2xl font-bold text-foreground">$99</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
            <div className="rounded-xl border border-primary/30 p-4 text-center" style={{ background: "rgba(43,127,232,0.08)" }}>
              <p className="text-xs text-primary">If You Save 1 Job</p>
              <p className="mt-1 text-2xl font-bold text-primary">${savedValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">value recovered</p>
            </div>
            <div className="rounded-xl border border-border p-4 text-center" style={{ background: "rgba(0,0,0,0.03)" }}>
              <p className="text-xs text-muted-foreground">Return</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{roi}x</p>
              <p className="text-xs text-muted-foreground">your investment</p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Illustrative example only. HomeBids does not guarantee specific results or job outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}



/* ─── Before / After comparison ─── */
const beforeItems = [
  "Messy handwritten notes",
  "Bids sent days later (or never)",
  "Awkward pricing conversations",
  "Losing jobs to faster competitors",
  "Manual, inconsistent proposals",
];
const afterItems = [
  "Professional bids in minutes",
  "Shareable bid link sent same day",
  "Confident pricing conversations",
  "First bid out wins more jobs",
  "Polished, consistent proposals",
];

export default function ContractorsPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleContractorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const result = await supabaseSignIn(loginEmail, loginPassword);
    if (result.error) {
      if (result.error.toLowerCase().includes("email not confirmed") || result.error.toLowerCase().includes("not confirmed")) {
        setShowLoginModal(false);
        window.location.href = `/auth/verify-email?status=pending&email=${encodeURIComponent(loginEmail)}`;
        return;
      }
      setLoginError(result.error);
      setLoginLoading(false);
      return;
    }
    window.location.replace("/contractors/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(43,127,232,0.12) 0%, transparent 70%)",
            }}
          />
          <motion.div
            className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, rgba(43,127,232,0.3) 0%, transparent 70%)", filter: "blur(40px)" }}
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-1/4 top-1/2 h-72 w-72 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, rgba(43,127,232,0.4) 0%, transparent 70%)", filter: "blur(50px)" }}
            animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <ParticleField />
          {/* Blueprint grid lines */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.025]" aria-hidden>
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <Zap className="h-3 w-3" /> AI-Powered Contractor Tools
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              The Fastest Way for Contractors
              <br />
              to Create Winning Bids
            </motion.h1>

            <motion.div variants={fadeUp} className="mt-4 text-3xl font-bold sm:text-4xl">
              <RotatingWord />
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            >
              Text us job details, photos, or voice notes. The AI Bid Builder asks follow-up questions,
              organizes the scope, and generates a clean proposal you can review, edit, and send.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="sms:+18722964991?&body=Let%27s%20create%20a%20new%20bid"
                className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 active:scale-[0.98]"
              >
                <ArrowRight className="h-4 w-4" />
                Text Us To Build A Bid
              </a>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-4 flex justify-center">
              <Button
                size="sm"
                variant="ghost"
                className="h-9 rounded-full px-5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setShowLoginModal(true)}
              >
                Already a contractor? Sign in
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> $99/month</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> 3-day free trial</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No contracts</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="relative mx-auto mt-20 max-w-3xl"
        >
          <div
            className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border p-6"
            style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(16px)" }}
          >
            {[
              { value: 3, prefix: "", suffix: "min", label: "Average bid time" },
              { value: 10, prefix: "", suffix: "x", label: "Faster than manual bids" },
              { value: 99, prefix: "$", suffix: "", label: "Per month, all-in" },
            ].map((s, i) => (
              <div key={i} className="px-4 text-center">
                <p className="text-3xl font-extrabold text-primary">
                  <AnimatedNumber target={s.value} prefix={s.prefix} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── BEFORE / AFTER ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="mb-14 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">The Shift</span>
              <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
                Before HomeBids vs. After HomeBids
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Before */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-destructive/20 p-8"
                style={{ background: "rgba(239,68,68,0.03)" }}
              >
                <p className="mb-5 text-xs font-bold uppercase tracking-widest text-destructive/60">Without HomeBids</p>
                <ul className="space-y-3">
                  {beforeItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-destructive/30 text-[10px] text-destructive/60">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* After */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-primary/25 p-8"
                style={{ background: "rgba(43,127,232,0.05)", backdropFilter: "blur(8px)" }}
              >
                <p className="mb-5 text-xs font-bold uppercase tracking-widest text-primary">With HomeBids</p>
                <ul className="space-y-3">
                  {afterItems.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-3 text-sm text-foreground"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── NOTES → BID DEMO ── */}
      <section className="bg-card px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="mb-14 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Bid Builder</span>
              <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
                Turn 5 Minutes of Notes Into a Professional Bid
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Watch chaos become professionalism in real time.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Notes side */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-border p-7"
                style={{ background: "rgba(0,0,0,0.02)" }}
              >
                <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Contractor Notes
                </p>
                <div className="rounded-xl border border-border bg-background p-4 font-mono text-sm leading-relaxed text-muted-foreground">
                  <p>"Paint master bedroom and hallway."</p>
                  <p className="mt-2">"Repair drywall — 2 spots."</p>
                  <p className="mt-2">"Labor $950. Materials around $200."</p>
                  <p className="mt-2">"2 days of work maybe 3."</p>
                  <p className="mt-2">"Need to prep trim and ceiling edges."</p>
                </div>
                <div className="mt-5 flex justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 text-xs font-medium text-primary"
                  >
                    <Zap className="h-4 w-4" />
                    AI Processing...
                  </motion.div>
                </div>
              </motion.div>

              {/* Proposal side */}
              <motion.div
                variants={fadeUp}
                className="relative rounded-2xl border border-primary/30 p-7"
                style={{ background: "rgba(43,127,232,0.04)", backdropFilter: "blur(10px)", boxShadow: "0 0 40px rgba(43,127,232,0.08)" }}
              >
                <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Professional Proposal
                </p>
                <div className="rounded-xl border border-border bg-background p-5 text-sm leading-relaxed">
                  <p className="font-bold text-foreground">Interior Painting & Drywall Repair</p>
                  <p className="mt-1 text-xs text-muted-foreground">Prepared by: [Your Company]</p>
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <div className="flex justify-between"><span className="text-muted-foreground">Drywall Repair (2 areas)</span><span className="font-medium">Included</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Master Bedroom + Hallway</span><span className="font-medium">$750</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Trim & Ceiling Edges</span><span className="font-medium">$200</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Materials</span><span className="font-medium">$200</span></div>
                    <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold text-foreground">
                      <span>Total</span><span className="text-primary">$1,150</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Timeline: 2–3 days &bull; Fully insured &bull; License #XXXX</p>
                </div>
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  animate={{ boxShadow: ["0 0 0px rgba(43,127,232,0)", "0 0 30px rgba(43,127,232,0.15)", "0 0 0px rgba(43,127,232,0)"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
            <motion.div variants={fadeUp} className="mt-8 flex justify-center">
              <DemoCallout text="Want to try it yourself? Text us and we'll build a real bid live." />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── WHY IT WORKS ── */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="mb-14 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Why It Works</span>
              <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
                Built Around How Contractors Actually Win Jobs
              </h2>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: FileText,
                  title: "Text, Don't Type",
                  body: "Send rough notes, a photo, or a voice memo. The AI asks the right follow-up questions and organizes everything into a scope of work.",
                },
                {
                  icon: Zap,
                  title: "First Bid Wins",
                  body: "Over 70% of homeowners hire the first contractor who sends a professional proposal. HomeBids gets yours there before the competition.",
                },
                {
                  icon: ChevronRight,
                  title: "You Stay in Control",
                  body: "Review and edit before anything goes out. Approve with one tap, share a link, or download the PDF — your choice, every time.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="rounded-2xl border border-border p-7"
                  style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}
                >
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: "rgba(43,127,232,0.08)" }}
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="bg-card px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="mb-14 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</span>
              <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-muted-foreground">One plan. Everything included. Start with a 3-day free trial.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="mx-auto max-w-sm">
              <div
                className="relative rounded-3xl border border-primary/30 p-8"
                style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(43,127,232,0.12)" }}
              >
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  animate={{ boxShadow: ["0 0 0px rgba(43,127,232,0)", "0 0 50px rgba(43,127,232,0.15)", "0 0 0px rgba(43,127,232,0)"] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <div className="relative text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">HomeBids Contractor</p>
                  <div className="mt-5 flex items-end justify-center gap-1">
                    <span className="text-6xl font-extrabold text-foreground">$99</span>
                    <span className="mb-2 text-muted-foreground">/mo</span>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Clock className="h-3 w-3" /> 3-day free trial
                  </span>
                </div>

                <ul className="relative mt-8 space-y-3 border-t border-border pt-8">
                  {planFeatures.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-foreground capitalize">{feat}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="sms:+18722964991?&body=Let%27s%20create%20a%20new%20bid"
                  className="relative mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
                >
                  <ArrowRight className="h-4 w-4" />
                  Start A Bid By Text
                </a>
                <div className="relative mt-3 text-center">
                  <Link href="/subscribe?type=contractor" className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                    Prefer to use a form?
                  </Link>
                </div>

                <p className="relative mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  HomeBids does not guarantee a specific number of leads or jobs. Homeowner
                  opportunities vary based on service area, category, and demand.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── DEMO CALLOUT ── */}
      <div className="relative overflow-hidden px-4 py-14 text-center sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(43,127,232,0.1) 0%, transparent 70%)" }}
          aria-hidden
        />
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Live Demo</p>
        <h3 className="mt-2 text-balance text-2xl font-bold text-foreground sm:text-3xl">
          Not ready to sign up? See it work first.
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-base text-muted-foreground">
          Text us a job and we&apos;ll build a real bid live — no account needed.
        </p>
        <div className="mt-6 flex justify-center">
          <DemoCallout text="Text Us for a Live Demo" variant="primary" />
        </div>
      </div>

      {/* ── ROI CALCULATOR ── */}
      <section className="bg-card px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">ROI</span>
              <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
                {"What Is One Lost Job Worth?"}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                {"HomeBids doesn't cost you $99 a month. It saves you far more than that."}
              </p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <ROICalculator />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(43,127,232,0.1) 0%, transparent 70%)" }}
          aria-hidden
        />
        <ParticleField />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <h2 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Your Competitors Are Still
            <br />
            Building Bids Manually.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">You don&apos;t have to.</p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <a
              href="sms:+18722964991?&body=Let%27s%20create%20a%20new%20bid"
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-primary px-10 text-lg font-bold text-primary-foreground shadow-xl transition-colors hover:bg-primary/90 active:scale-[0.98]"
            >
              <ArrowRight className="h-5 w-5" />
              Text Us To Build A Bid
            </a>
            <Link href="/subscribe?type=contractor" className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              Use web form instead
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-primary" />$99/month</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" />Unlimited AI Bids</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" />No Contracts</span>
          </div>
        </motion.div>
      </section>

      {/* ── LOGIN MODAL ── */}
      <Dialog
        open={showLoginModal}
        onOpenChange={(open) => {
          setShowLoginModal(open);
          if (!open) {
            setLoginEmail("");
            setLoginPassword("");
            setLoginError("");
            setLoginLoading(false);
          }
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pb-6 pt-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <DialogHeader className="relative">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-semibold">Contractor Login</DialogTitle>
              <DialogDescription className="text-center text-muted-foreground">
                Sign in to access your dashboard and manage bids
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6">
            <form onSubmit={handleContractorLogin} className="space-y-4">
              {loginError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {loginError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="contractor-email">Email</Label>
                <Input
                  id="contractor-email"
                  type="email"
                  placeholder="you@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-11"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contractor-password">Password</Label>
                  <button type="button" className="text-xs text-muted-foreground hover:text-primary" onClick={() => alert("Password reset — contact support@homebids.ai")}>
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="contractor-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-11"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full gap-2 text-base"
                disabled={loginLoading || !loginEmail.trim() || !loginPassword.trim()}
              >
                {loginLoading ? <Loader className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Sign In
              </Button>
            </form>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">New to HomeBids?</span>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {"Want to join as a contractor? "}
              <a href="/subscribe?type=contractor" className="font-semibold text-primary hover:underline">
                Start your free trial
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DemoPopup />
      <ScrollToTop />
    </div>
  );
}
