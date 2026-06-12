"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { HeaderWithEarlyAccess } from "@/components/header-with-early-access";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, CheckCircle2, MessageSquare, Users, ShieldCheck,
  Smartphone, Bot, Zap, FileText, TrendingUp, Star, DollarSign,
  Clock, Hammer, Home, ChevronRight, Sparkles, Send,
} from "lucide-react";

type Audience = "homeowner" | "contractor";

// ─── animation variants ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { show: { transition: { staggerChildren: 0.09 } } };
const crossfade = {
  initial: { opacity: 0, y: 18, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.25 } },
};

// ─── Floating Particle field ───────────────────────────────────────────────
function ParticleField({ count = 18, color = "#2B7FE8" }: { count?: number; color?: string }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 5,
    }))
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.current.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: color, opacity: 0.35 }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Glowing connector line ────────────────────────────────────────────────
function GlowLine({ vertical = false }: { vertical?: boolean }) {
  return (
    <motion.div
      className={`${vertical ? "w-px h-12 mx-auto" : "h-px w-full"} rounded-full`}
      style={{ background: "linear-gradient(90deg, transparent, #2B7FE840, transparent)" }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─── iMessage bubble ───────────────────────────────────────────────────────
function MessageBubble({ text, from, delay = 0 }: { text: string; from: "user" | "ai"; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      className={`flex ${from === "user" ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, x: from === "user" ? 20 : -20, scale: 0.92 }}
      animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          from === "user"
            ? "rounded-br-sm bg-[#2B7FE8] text-white"
            : "rounded-bl-sm border border-border bg-card text-foreground"
        }`}
      >
        {text}
      </div>
    </motion.div>
  );
}

// ─── Animated step card ────────────────────────────────────────────────────
function StepCard({
  number, icon: Icon, title, desc, delay = 0,
}: { number: string; icon: React.ElementType; title: string; desc: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Glow accent on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at top left, #2B7FE808, transparent 70%)" }} />
      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {number}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Orbit animation (Bid Defender) ───────────────────────────────────────
function BidDefenderOrbit() {
  const orbitingBids = ["Contractor B", "Contractor C", "Contractor D"];
  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
      {/* Center card */}
      <motion.div
        className="z-10 rounded-xl border-2 border-primary bg-card px-4 py-2.5 text-center shadow-lg"
        animate={{ boxShadow: ["0 0 0 0 #2B7FE820", "0 0 0 12px #2B7FE800"] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className="text-xs font-bold text-primary">YOUR BID</p>
        <p className="text-[10px] text-muted-foreground">Protected</p>
      </motion.div>
      {/* Orbiting competitors */}
      {orbitingBids.map((label, i) => {
        const angle = (i / orbitingBids.length) * 2 * Math.PI;
        const r = 90;
        return (
          <motion.div
            key={label}
            className="absolute rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-center text-[10px] text-muted-foreground backdrop-blur-sm"
            animate={{ rotate: 360 }}
            transition={{ duration: 14 + i * 3, repeat: Infinity, ease: "linear" }}
            style={{
              left: `calc(50% + ${Math.cos(angle) * r}px - 40px)`,
              top: `calc(50% + ${Math.sin(angle) * r}px - 18px)`,
            }}
          >
            {label}
          </motion.div>
        );
      })}
      {/* Connecting lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: "visible" }}>
        {orbitingBids.map((_, i) => {
          const angle = (i / orbitingBids.length) * 2 * Math.PI;
          const r = 90;
          return (
            <motion.line
              key={i}
              x1="50%" y1="50%"
              x2={`calc(50% + ${Math.cos(angle) * r}px)`}
              y2={`calc(50% + ${Math.sin(angle) * r}px)`}
              stroke="#2B7FE840" strokeWidth="1" strokeDasharray="3 3"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ─── Before / After comparison ─────────────────────────────────────────────
function BeforeAfter({ audience }: { audience: Audience }) {
  const data = audience === "homeowner"
    ? {
        before: ["Searching endless directories", "Waiting days for callbacks", "Comparing contractors manually", "Sharing your number too early"],
        after: ["One simple conversation", "AI handles the outreach", "Multiple options delivered", "Your info stays private"],
      }
    : {
        before: ["Manual estimates taking hours", "Lost evenings on paperwork", "Price objections you can't answer", "Looking less professional"],
        after: ["AI proposals in minutes", "Win more with faster responses", "Defend pricing with confidence", "Professional bids every time"],
      };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Before */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-6">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Before</p>
        <ul className="space-y-3">
          {data.before.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-destructive/30 bg-destructive/10 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive/60" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </motion.div>
      {/* After */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">After HomeBids</p>
        <ul className="space-y-3">
          {data.after.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

// ─── Flow step with connector ──────────────────────────────────────────────
function FlowStep({ icon: Icon, label, isLast = false, delay = 0 }: {
  icon: React.ElementType; label: string; isLast?: boolean; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-sm"
        style={{ boxShadow: "0 0 16px #2B7FE820" }}
      >
        <Icon className="h-5 w-5 text-primary" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35, delay: delay + 0.1 }}
        className="mt-2 text-center text-[11px] font-medium text-muted-foreground leading-tight max-w-[64px]"
      >
        {label}
      </motion.p>
      {!isLast && (
        <motion.div
          className="my-1 h-6 w-px"
          style={{ background: "linear-gradient(to bottom, #2B7FE860, transparent)" }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={inView ? { scaleY: 1, opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: delay + 0.2 }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function HowItWorksPage() {
  const [audience, setAudience] = useState<Audience>("homeowner");

  // Respect prefers-reduced-motion
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeaderWithEarlyAccess />

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        {!reduced && <ParticleField count={20} />}
        {/* ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, #2B7FE8, transparent 70%)", filter: "blur(48px)" }} />

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-block rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              How It Works
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {audience === "homeowner"
                ? "Tell Us About Your Project. We'll Handle The Rest."
                : "Turn Notes & Photos Into Professional Bids."}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              {audience === "homeowner"
                ? "HomeBids acts like your personal home project assistant — helping you collect bids, compare options, and find the right contractor without endless phone calls."
                : "HomeBids helps contractors build better proposals, defend pricing, and win more jobs using AI-powered tools built for how you actually work."}
            </p>

            {/* ── Premium toggle ── */}
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">I am a</p>
              <div
                className="relative inline-flex rounded-2xl border border-border p-1.5"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 2px 16px #0001, inset 0 1px 0 #fff4",
                }}
              >
                {/* sliding indicator */}
                <motion.div
                  className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-background shadow-md"
                  animate={{ left: audience === "homeowner" ? "6px" : "calc(50%)" }}
                  style={{ width: "calc(50% - 6px)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
                {(["homeowner", "contractor"] as Audience[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAudience(opt)}
                    className={`relative z-10 min-w-[120px] rounded-xl px-6 py-2.5 text-sm font-semibold capitalize transition-colors duration-200 ${
                      audience === opt ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt === "homeowner" ? (
                      <span className="flex items-center justify-center gap-1.5"><Home className="h-3.5 w-3.5" />Homeowner</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5"><Hammer className="h-3.5 w-3.5" />Contractor</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── AUDIENCE CONTENT ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {audience === "homeowner" ? (

          <motion.div key="homeowner" variants={crossfade} initial="initial" animate="animate" exit="exit">

            {/* ── HOMEOWNER: Animated Journey Flow ── */}
            <section className="overflow-hidden bg-card px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-14 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">The Journey</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Your project, handled from start to finish
                    </h2>
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <FlowStep icon={Smartphone} label="You Text HomeBids" delay={0} />
                    <FlowStep icon={Bot} label="AI Understands Your Project" delay={0.1} />
                    <FlowStep icon={Users} label="Contractor Outreach" delay={0.2} />
                    <FlowStep icon={MessageSquare} label="Multiple Bids Arrive" delay={0.3} />
                    <FlowStep icon={CheckCircle2} label="You Choose" isLast delay={0.4} />
                  </div>
                </motion.div>
              </div>
            </section>

            {/* ── HOMEOWNER: Steps ── */}
            <section className="px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-14 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Step by Step</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      From text message to hired contractor
                    </h2>
                  </motion.div>
                </motion.div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <StepCard number="1" icon={Smartphone} title="Text HomeBids" delay={0}
                    desc="Describe your project the same way you would text a friend. No forms, no accounts — just a message." />
                  <StepCard number="2" icon={Bot} title="Confirm Your Project" delay={0.07}
                    desc="Our AI summarizes your project — scope, timeline, location — and you approve before any outreach begins." />
                  <StepCard number="3" icon={Users} title="We Contact Contractors" delay={0.14}
                    desc="No searching directories. No chasing callbacks. HomeBids does the outreach to electricians, roofers, plumbers, and more." />
                  <StepCard number="4" icon={MessageSquare} title="Review Multiple Options" delay={0.21}
                    desc="Incoming bids arrive cleanly organized. Review side-by-side and decide what works best for your project." />
                  <StepCard number="5" icon={CheckCircle2} title="Hire With Confidence" delay={0.28}
                    desc="Choose the contractor that fits your timeline, budget, and goals. Your info stays private until you approve." />
                </div>
              </div>
            </section>

            {/* ── HOMEOWNER: iMessage Demo ── */}
            <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-12 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Live Demo</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Watch HomeBids Build A Project In Real Time
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                      A real conversation — from first text to organized project summary.
                    </p>
                  </motion.div>

                  <motion.div variants={fadeUp}
                    className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
                    style={{ backdropFilter: "blur(12px)" }}
                  >
                    {/* Phone top bar */}
                    <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">HomeBids AI</p>
                        <p className="text-[10px] text-primary">Online</p>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      <MessageBubble from="user" text="Hey, my roof is leaking near the chimney. Need someone to fix it." delay={0} />
                      <MessageBubble from="ai" text="Got it! A few quick questions — what's your zip code and roughly when do you need this done?" delay={0.4} />
                      <MessageBubble from="user" text="90210, within the next 2 weeks ideally." delay={0.8} />
                      <MessageBubble from="ai" text="Perfect. Here's your project summary — does this look right?" delay={1.2} />
                      {/* Summary card */}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1.6 }}
                        className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5"
                      >
                        <p className="font-semibold text-foreground">Project: Roof Leak Repair</p>
                        <p className="text-muted-foreground">Location: Beverly Hills, CA 90210</p>
                        <p className="text-muted-foreground">Timeline: Within 2 weeks</p>
                        <p className="text-muted-foreground">Area: Near chimney</p>
                        <div className="mt-2 flex items-center gap-1.5 text-primary font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Outreach ready to begin
                        </div>
                      </motion.div>
                      <MessageBubble from="user" text="Yes, that's right. Go ahead!" delay={2.0} />
                      <MessageBubble from="ai" text="Contacting 4 qualified roofers in your area now. I'll update you as bids come in." delay={2.4} />
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </section>

            {/* ── HOMEOWNER: Before / After ── */}
            <section className="px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-12 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Comparison</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Before HomeBids vs. After HomeBids
                    </h2>
                  </motion.div>
                  <BeforeAfter audience="homeowner" />
                </motion.div>
              </div>
            </section>

            {/* ── HOMEOWNER: Why ── */}
            <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-12 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Why Homeowners</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Built to make this easy for you
                    </h2>
                  </motion.div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[
                      { icon: Smartphone, title: "No apps. No accounts.", desc: "Everything works over text message. Nothing to download, sign up for, or log in to." },
                      { icon: Zap, title: "Fast and frictionless.", desc: "Most homeowners go from text to contractor options in minutes — no forms, no phone calls." },
                      { icon: ShieldCheck, title: "Your info stays private.", desc: "Contact details are never shared until you approve a contractor. AI handles early communication." },
                      { icon: CheckCircle2, title: "You stay in control.", desc: "Review your options, approve who you want, and connect directly — on your terms." },
                    ].map((card, i) => (
                      <motion.div key={card.title} variants={fadeUp} transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -3 }}
                        className="group relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ background: "radial-gradient(circle at top left, #2B7FE808, transparent 70%)" }} />
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <card.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">{card.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>

            {/* ── HOMEOWNER: CTA ── */}
            <section className="px-4 pb-20 pt-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-3xl px-8 py-14 text-center"
                  style={{ background: "linear-gradient(135deg, #1A6FD8, #2B7FE8 60%, #3D8FF0)" }}
                >
                  {!reduced && <ParticleField count={12} color="#ffffff" />}
                  <div className="relative">
                    <h2 className="text-balance text-3xl font-bold text-white sm:text-4xl">
                      Ready To Get Better Bids For Your Project?
                    </h2>
                    <p className="mt-3 text-white/80">
                      Tell HomeBids about your project and let us do the contractor outreach.
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                      <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                        <Link href="/">
                          Start Your Project
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="lg" variant="ghost" className="w-full border border-white/30 text-white hover:bg-white/10 sm:w-auto" asChild>
                        <Link href="/">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Text HomeBids
                        </Link>
                      </Button>
                    </div>
                    <p className="mt-4 text-xs text-white/50">Free for homeowners. No account or credit card required.</p>
                  </div>
                </motion.div>
              </div>
            </section>

          </motion.div>

        ) : (

          <motion.div key="contractor" variants={crossfade} initial="initial" animate="animate" exit="exit">

            {/* ── CONTRACTOR: Animated Flow ── */}
            <section className="overflow-hidden bg-card px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-14 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">The Superpower Flow</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      From raw notes to won job — in minutes
                    </h2>
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <FlowStep icon={Smartphone} label="Voice Notes & Photos" delay={0} />
                    <FlowStep icon={Bot} label="AI Processing" delay={0.1} />
                    <FlowStep icon={FileText} label="Professional Proposal" delay={0.2} />
                    <FlowStep icon={Home} label="Happy Homeowner" delay={0.3} />
                    <FlowStep icon={CheckCircle2} label="Won Job" isLast delay={0.4} />
                  </div>
                </motion.div>
              </div>
            </section>

            {/* ── CONTRACTOR: Steps ── */}
            <section className="px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-14 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Step by Step</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Your AI growth toolkit
                    </h2>
                  </motion.div>
                </motion.div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <StepCard number="1" icon={Smartphone} title="Send What You Already Have" delay={0}
                    desc="No complicated forms. Submit voice notes, photos, rough scope, and pricing the way you already work." />
                  <StepCard number="2" icon={Bot} title="AI Builds the Proposal" delay={0.07}
                    desc="Messy notes transform into a clean scope of work, pricing, exclusions, and optional upgrades — instantly." />
                  <StepCard number="3" icon={FileText} title="Review Before Sending" delay={0.14}
                    desc="You stay in control of every proposal. Preview, edit, and approve before it reaches the homeowner." />
                  <StepCard number="4" icon={Send} title="Deliver a Professional Bid" delay={0.21}
                    desc="Look more professional without extra hours. Send via PDF, SMS, or mobile — your homeowner sees it instantly." />
                  <StepCard number="5" icon={ShieldCheck} title="Protect Your Deal" delay={0.28}
                    desc="Bid Defender keeps you connected to your original lead. Stay top of mind even while homeowners explore other options." />
                </div>
              </div>
            </section>

            {/* ── CONTRACTOR: Bid Defender Visual ── */}
            <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-12 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Bid Defender</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Stay connected. Protect your deal.
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                      Your original bid stays highlighted while competitors orbit around it. HomeBids keeps you tied to your lead.
                    </p>
                  </motion.div>
                  <motion.div variants={fadeUp} className="flex justify-center">
                    <BidDefenderOrbit />
                  </motion.div>
                </motion.div>
              </div>
            </section>

            {/* ── CONTRACTOR: Before / After ── */}
            <section className="px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-12 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Comparison</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Before HomeBids vs. After HomeBids
                    </h2>
                  </motion.div>
                  <BeforeAfter audience="contractor" />
                </motion.div>
              </div>
            </section>

            {/* ── CONTRACTOR: Why ── */}
            <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <motion.div variants={fadeUp} className="mb-12 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">Why Contractors</span>
                    <h2 className="mt-3 text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Built for how you actually work
                    </h2>
                  </motion.div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[
                      { icon: Zap, title: "Respond faster, win more.", desc: "AI-generated responses mean you reply in minutes. Fast replies close more jobs." },
                      { icon: TrendingUp, title: "Defend your pricing.", desc: "Stop losing jobs to price objections. Back up every bid with confidence." },
                      { icon: FileText, title: "Cleaner estimates.", desc: "AI-structured proposals look professional and communicate value — even from the job site." },
                      { icon: DollarSign, title: "$99/month. All-in.", desc: "Unlimited AI bids, Bid Defender, AI Growth Tools — one flat price, no surprises." },
                    ].map((card, i) => (
                      <motion.div key={card.title} variants={fadeUp} transition={{ delay: i * 0.07 }}
                        whileHover={{ y: -3 }}
                        className="group relative overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-md"
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                          style={{ background: "radial-gradient(circle at top left, #2B7FE808, transparent 70%)" }} />
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <card.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground">{card.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>

            {/* ── CONTRACTOR: CTA ── */}
            <section className="px-4 pb-20 pt-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-3xl border border-primary/20 px-8 py-14 text-center"
                  style={{ background: "linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0f172a 100%)" }}
                >
                  {!reduced && <ParticleField count={14} color="#2B7FE8" />}
                  <div className="relative">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Sparkles className="h-3 w-3" /> AI-Powered
                    </span>
                    <h2 className="mt-4 text-balance text-3xl font-bold text-white sm:text-4xl">
                      Ready To Give Yourself The AI Advantage?
                    </h2>
                    <p className="mt-3 text-white/70">
                      Build professional bids faster, protect more deals, and save hours every week.
                    </p>
                    <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/80">
                      {["Unlimited AI Bids", "Bid Defender", "AI Growth Tools", "$99/month"].map((item) => (
                        <li key={item} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                      <Button size="lg" asChild className="w-full sm:w-auto">
                        <Link href="/contractors">
                          Start Using HomeBids
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="lg" variant="ghost" className="w-full border border-white/20 text-white hover:bg-white/10 sm:w-auto" asChild>
                        <Link href="/contractors">
                          See Contractor Tools
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>

      <ScrollToTop />
    </div>
  );
}
