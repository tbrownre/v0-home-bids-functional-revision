"use client";

import { useState } from "react";
import { HeaderWithEarlyAccess } from "@/components/header-with-early-access";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, ArrowRight, Users, MessageSquare,
  Briefcase, DollarSign, Search, Star, ShieldCheck,
  Home, Hammer, Thermometer, PaintBucket, Trees, Bath,
  Zap, Smartphone, Bot, TrendingUp,
} from "lucide-react";

type Audience = "homeowner" | "contractor";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const childFade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function HowItWorksPage() {
  const [audience, setAudience] = useState<Audience>("homeowner");

  return (
    <div className="min-h-screen bg-background">
      <HeaderWithEarlyAccess />

      {/* ── Hero ── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              How HomeBids Works
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              One platform for homeowners to collect competing bids — and for contractors to find real projects worth quoting.
            </p>

            {/* Toggle */}
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-muted-foreground">I am a</p>
              <div className="inline-flex rounded-xl border border-border bg-muted p-1">
                {(["homeowner", "contractor"] as Audience[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAudience(opt)}
                    className={`rounded-lg px-6 py-2 text-sm font-semibold capitalize transition-all duration-200 ${
                      audience === opt
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Audience Content ── */}
      <AnimatePresence mode="wait">
        {audience === "homeowner" ? (
          <motion.div key="homeowner" variants={fadeIn} initial="initial" animate="animate" exit="exit">

            {/* Section 1 — Value Prop */}
            <section className="bg-card px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                  <div>
                    <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      Text us your project. We handle the rest.
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                      No accounts. No apps. No forms. Just send a text message and our AI takes it from there — gathering details, organizing your request, and connecting you with contractor options.
                    </p>
                    <p className="mt-3 text-muted-foreground">
                      Your contact info stays private until you approve a contractor.
                    </p>
                  </div>
                  <Card className="border-border bg-background">
                    <CardContent className="p-6 space-y-3">
                      {[
                        { icon: Smartphone, label: "Text us your project" },
                        { icon: Bot, label: "AI gathers details" },
                        { icon: Users, label: "Get contractor options" },
                        { icon: ShieldCheck, label: "Approve before connecting" },
                        { icon: CheckCircle2, label: "Direct texting unlocked" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3 text-sm font-medium text-foreground">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <item.icon className="h-4 w-4 text-primary" />
                          </div>
                          {item.label}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Section 2 — SMS-First Process */}
            <section className="px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">The Process</h2>
                <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      step: "1", icon: Smartphone, title: "Text Us Your Project",
                      desc: "Send a quick text about what you need help with — repair, renovation, maintenance, or anything else.",
                      sub: "No account or app required.",
                      examples: ["Roof leak", "AC not cooling", "Kitchen remodel", "Fence repair"],
                    },
                    {
                      step: "2", icon: Bot, title: "AI Gathers the Details",
                      desc: "Our AI asks a few smart follow-up questions to understand your project scope, timeline, and location.",
                      sub: "Fast, conversational, and done entirely over text.",
                      examples: [],
                    },
                    {
                      step: "3", icon: Users, title: "We Find Contractor Options",
                      desc: "HomeBids AI matches your project to relevant contractors and helps organize your options.",
                      sub: "You stay in control of who you connect with.",
                      examples: [],
                    },
                    {
                      step: "4", icon: MessageSquare, title: "AI Relays Communications",
                      desc: "Before you approve a contractor, our AI handles back-and-forth messaging on your behalf — keeping your contact info private.",
                      sub: "Your number is never shared without your permission.",
                      examples: [],
                    },
                    {
                      step: "5", icon: CheckCircle2, title: "Approve & Connect Directly",
                      desc: "Once you approve a contractor, direct text messaging is unlocked. You communicate with them just like you would any contact.",
                      sub: "Simple, fast, and entirely through text.",
                      examples: [],
                    },
                  ].map((s) => (
                    <motion.div key={s.step} variants={childFade}>
                      <Card className="h-full border-border bg-card">
                        <CardContent className="p-6">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                              {s.step}
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                              <s.icon className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-foreground">{s.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                          {s.examples.length > 0 && (
                            <ul className="mt-3 space-y-1">
                              {s.examples.map((ex) => (
                                <li key={ex} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                                  {ex}
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="mt-3 text-xs text-muted-foreground/70 italic">{s.sub}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Section 3 — Why Homeowners */}
            <section className="bg-card px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">Why Homeowners Choose HomeBids</h2>
                <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2">
                  {[
                    { icon: Smartphone, title: "No apps. No accounts.", desc: "Everything works over text message. There is nothing to download, sign up for, or log in to." },
                    { icon: Zap, title: "Fast and frictionless", desc: "Most homeowners go from text to contractor options in under 10 minutes — no forms, no phone calls." },
                    { icon: ShieldCheck, title: "Your info stays private", desc: "Your contact details are never shared until you approve a contractor. HomeBids AI handles early communication." },
                    { icon: CheckCircle2, title: "You stay in control", desc: "Review your options, approve who you want, and connect directly — on your terms." },
                  ].map((card) => (
                    <motion.div key={card.title} variants={childFade}>
                      <Card className="h-full border-border bg-background">
                        <CardContent className="p-6">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <card.icon className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground">{card.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Section 4 — Homeowner CTA */}
            <section className="px-4 pb-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl rounded-2xl bg-primary px-8 py-12 text-center">
                <h2 className="text-balance text-3xl font-bold text-primary-foreground">
                  Ready to get help with your project?
                </h2>
                <p className="mt-3 text-primary-foreground/80">
                  Just send us a text. Our AI takes it from there.
                </p>
                <Button size="lg" variant="secondary" className="mt-6" asChild>
                  <Link href="/">
                    Text Us Your Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-primary-foreground/40">Free for homeowners. No credit card or account required.</p>
              </div>
            </section>

          </motion.div>
        ) : (
          <motion.div key="contractor" variants={fadeIn} initial="initial" animate="animate" exit="exit">

            {/* Section 1 — Value Prop */}
            <section className="bg-card px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                  <div>
                    <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
                      AI growth tools that help you win more jobs
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                      HomeBids gives contractors lightweight AI tools to estimate faster, respond better, and close more work — without adding office staff or complex software.
                    </p>
                    <p className="mt-3 text-muted-foreground">
                      Everything is built for how contractors actually work: fast, mobile, and text-first.
                    </p>
                  </div>
                  <Card className="border-border bg-background">
                    <CardContent className="p-6 space-y-3">
                      {[
                        { icon: FileText, label: "AI Estimate Assistant" },
                        { icon: TrendingUp, label: "AI Price Check Tool" },
                        { icon: MessageSquare, label: "AI Response Assistant" },
                        { icon: Zap, label: "Respond faster, win more" },
                        { icon: CheckCircle2, label: "No office staff needed" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3 text-sm font-medium text-foreground">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <item.icon className="h-4 w-4 text-primary" />
                          </div>
                          {item.label}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Section 2 — AI Tools Process */}
            <section className="px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">Your AI Growth Toolkit</h2>
                <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      step: "01", icon: FileText, title: "AI Estimate Assistant",
                      desc: "Generate clean, professional estimates in seconds. Describe the job, and AI builds a formatted proposal you can send immediately.",
                      sub: "No more blank-page estimating.",
                      examples: ["Roofing", "HVAC", "Plumbing", "Electrical", "Remodeling"],
                    },
                    {
                      step: "02", icon: TrendingUp, title: "AI Price Check Tool",
                      desc: "Worried about underbidding or getting undercut? Run a quick price check to validate your numbers before you send.",
                      sub: "Defend your pricing with confidence.",
                      examples: [],
                    },
                    {
                      step: "03", icon: MessageSquare, title: "AI Response Assistant",
                      desc: "Get suggested replies for common objections, questions, and follow-ups. Respond faster without thinking from scratch every time.",
                      sub: "Speed up every customer conversation.",
                      examples: [],
                    },
                    {
                      step: "04", icon: Smartphone, title: "SMS-First Workflow",
                      desc: "Your tools work over text. AI-generated estimates, responses, and follow-ups can all be sent directly via SMS to the homeowner.",
                      sub: "Built for how contractors actually communicate.",
                      examples: [],
                    },
                    {
                      step: "05", icon: Bot, title: "HomeBids AI Relay",
                      desc: "For HomeBids-matched leads, our AI handles early communication until the homeowner approves direct contact — protecting everyone.",
                      sub: "No spam. No cold outreach.",
                      examples: [],
                    },
                  ].map((s) => (
                    <motion.div key={s.step} variants={childFade}>
                      <Card className="h-full border-border bg-card">
                        <CardContent className="p-6">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                              {s.step}
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                              <s.icon className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <h3 className="font-semibold text-foreground">{s.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                          {s.examples.length > 0 && (
                            <ul className="mt-3 space-y-1">
                              {s.examples.map((ex) => (
                                <li key={ex} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                                  {ex}
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="mt-3 text-xs text-muted-foreground/70 italic">{s.sub}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Section 3 — Why Contractors */}
            <section className="bg-card px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">Why Contractors Use HomeBids AI</h2>
                <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2">
                  {[
                    { icon: Zap, title: "Respond faster", desc: "AI-generated responses mean you reply in minutes, not hours. Fast replies win more jobs." },
                    { icon: TrendingUp, title: "Defend your pricing", desc: "Stop losing jobs because you can not explain your numbers. The Price Check tool helps you back up every bid." },
                    { icon: FileText, title: "Cleaner estimates", desc: "AI-structured estimates look professional and communicate value — even when you are on the job site." },
                    { icon: Smartphone, title: "Work from your phone", desc: "Everything is SMS-first. No desktop required. Your AI tools go where you go." },
                  ].map((card) => (
                    <motion.div key={card.title} variants={childFade}>
                      <Card className="h-full border-border bg-background">
                        <CardContent className="p-6">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <card.icon className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground">{card.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* Section 4 — Momentum */}
            <section className="px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Built to help you operate without extra staff</h2>
                    <p className="mt-4 text-muted-foreground">
                      HomeBids AI handles the time-consuming parts of your sales process so you can focus on doing the work.
                    </p>
                    <p className="mt-3 text-muted-foreground">
                      Estimate, respond, follow up, and win — all from your phone.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {["Estimate faster", "Respond to objections", "Validate your pricing", "Send via SMS", "Win more jobs"].map((item, i) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">{item}</span>
                        <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-green-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 — Contractor CTA */}
            <section className="px-4 pb-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl rounded-2xl bg-primary px-8 py-12 text-center">
                <h2 className="text-balance text-3xl font-bold text-primary-foreground">
                  Ready to start winning more jobs?
                </h2>
                <p className="mt-3 text-primary-foreground/80">
                  Get AI growth tools built specifically for contractors. Start your free trial today.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/subscribe?type=contractor">
                      Get AI Growth Tools
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <Link href="/contractors">See Contractor Tools</Link>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-primary-foreground/40">3-day free trial. $99/month after trial.</p>
              </div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>

      <ScrollToTop />
    </div>
  );
}
