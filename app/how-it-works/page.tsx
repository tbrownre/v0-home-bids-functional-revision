"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, ArrowRight, Users, MessageSquare,
  Briefcase, DollarSign, Search, Star, ShieldCheck,
  Home, Hammer, Thermometer, PaintBucket, Trees, Bath,
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
      <Header />

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
                      Post your project once. Compare multiple contractor bids. Choose with confidence.
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                      HomeBids makes it easier to find the right contractor without spending hours making calls or filling out multiple forms.
                    </p>
                    <p className="mt-3 text-muted-foreground">
                      Describe your project once, receive competing bids, compare your options, and connect directly with the contractor you want to hire.
                    </p>
                  </div>
                  <Card className="border-border bg-background">
                    <CardContent className="p-6 space-y-3">
                      {[
                        { icon: FileText, label: "Post one job" },
                        { icon: Users, label: "Receive multiple bids" },
                        { icon: Search, label: "Compare contractors" },
                        { icon: MessageSquare, label: "Message directly" },
                        { icon: CheckCircle2, label: "Hire who you want" },
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

            {/* Section 2 — 4-Step Process */}
            <section className="px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">The Process</h2>
                <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      step: "1", icon: FileText, title: "Tell Us About Your Project",
                      desc: "Post what you need done — description, budget, timeline, and photos if helpful.",
                      sub: "The more detail you provide, the better the bids you receive.",
                      examples: ["Bathroom remodel", "Roof repair", "HVAC replacement", "Interior painting"],
                    },
                    {
                      step: "2", icon: Users, title: "Contractors Review Your Job",
                      desc: "Contractors who match your project type can review your request and decide whether to submit a bid.",
                      sub: "This creates competition around your project instead of forcing you to chase quotes one by one.",
                      examples: [],
                    },
                    {
                      step: "3", icon: Search, title: "Compare Your Options",
                      desc: "Evaluate contractor bids based on pricing, scope, timing, experience, and reviews.",
                      sub: "More visibility means better decisions.",
                      examples: [],
                    },
                    {
                      step: "4", icon: MessageSquare, title: "Message and Move Forward",
                      desc: "Message your chosen contractor directly to finalize details and move the project forward.",
                      sub: "HomeBids helps make the connection — you stay in control of who you hire.",
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
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">Why Homeowners Use HomeBids</h2>
                <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2">
                  {[
                    { icon: DollarSign, title: "Potentially better pricing", desc: "Multiple bids can help you avoid overpaying and give you more leverage when choosing a contractor." },
                    { icon: Search, title: "More transparency", desc: "Compare contractor responses, timing, and qualifications in one place instead of across texts, calls, and emails." },
                    { icon: ShieldCheck, title: "Private communication", desc: "No spammy blast leads. Messaging happens inside the platform so your contact details stay protected." },
                    { icon: CheckCircle2, title: "Faster decision-making", desc: "Homeowners can move from \"I need help\" to \"I found someone\" much faster." },
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

            {/* Section 4 — Trust */}
            <section className="px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Simple, transparent contractor outreach</h2>
                    <p className="mt-4 text-muted-foreground">
                      HomeBids is designed to help homeowners efficiently reach multiple contractors for the same job opportunity.
                    </p>
                    <p className="mt-3 text-muted-foreground">
                      You review your options, choose who you want to talk to, and decide who you want to hire.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {["Post one job", "Receive multiple bids", "Compare contractors", "Message directly", "Hire who you want"].map((item, i) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
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

            {/* Section 5 — Homeowner CTA */}
            <section className="px-4 pb-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl rounded-2xl bg-primary px-8 py-12 text-center">
                <h2 className="text-balance text-3xl font-bold text-primary-foreground">
                  Ready to get bids on your project?
                </h2>
                <p className="mt-3 text-primary-foreground/80">
                  Start your post in minutes and begin comparing contractor interest in one place.
                </p>
                <Button size="lg" variant="secondary" className="mt-6" asChild>
                  <Link href="/subscribe?type=homeowner">
                    Post Your Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-primary-foreground/40">3-day free trial. Cancel anytime.</p>
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
                      Find homeowner projects, submit bids, and win more work
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                      HomeBids helps contractors discover active homeowner projects and bid on the jobs they actually want.
                    </p>
                    <p className="mt-3 text-muted-foreground">
                      Instead of waiting for referrals, you can browse opportunities, send proposals, and connect directly with motivated homeowners.
                    </p>
                  </div>
                  <Card className="border-border bg-background">
                    <CardContent className="p-6 space-y-3">
                      {[
                        { icon: Search, label: "Browse jobs" },
                        { icon: DollarSign, label: "Pick the right opportunities" },
                        { icon: FileText, label: "Submit bids fast" },
                        { icon: MessageSquare, label: "Message homeowners" },
                        { icon: Star, label: "Win more projects" },
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

            {/* Section 2 — 4-Step Process */}
            <section className="px-4 py-16 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">The Process</h2>
                <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      step: "1", icon: Search, title: "Browse Matching Jobs",
                      desc: "Browse available projects based on your service category and location.",
                      sub: "Focus only on the jobs that fit your business.",
                      examples: ["Roofing", "Plumbing", "HVAC", "Painting", "Remodeling", "Landscaping"],
                    },
                    {
                      step: "2", icon: FileText, title: "Submit Your Bid",
                      desc: "Respond with your estimate, timing, and why you're a strong fit for the project.",
                      sub: "A clear, professional bid helps you stand out quickly.",
                      examples: [],
                    },
                    {
                      step: "3", icon: MessageSquare, title: "Message the Homeowner",
                      desc: "Homeowners can message you after reviewing your bid to ask questions and build trust.",
                      sub: "No cold outreach — just direct conversations tied to active projects.",
                      examples: [],
                    },
                    {
                      step: "4", icon: Star, title: "Win the Job",
                      desc: "If the homeowner chooses you, you move forward directly with them.",
                      sub: "HomeBids helps create the connection and makes bidding simpler.",
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
                <h2 className="mb-10 text-center text-2xl font-bold text-foreground">Why Contractors Use HomeBids</h2>
                <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2">
                  {[
                    { icon: Home, title: "Real homeowner demand", desc: "Projects come from homeowners actively seeking bids, not passive traffic." },
                    { icon: Hammer, title: "More chances to win work", desc: "The more relevant jobs you bid on, the more opportunities you create." },
                    { icon: MessageSquare, title: "Direct homeowner messaging", desc: "Communicate inside the platform without needing to publicly post contact details." },
                    { icon: Briefcase, title: "Control over what you bid", desc: "Choose the jobs you want instead of paying for generic leads you may not even want." },
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
                    <h2 className="text-2xl font-bold text-foreground">Built for contractors who want consistent opportunity</h2>
                    <p className="mt-4 text-muted-foreground">
                      HomeBids gives contractors a simple way to stay in front of active projects, respond quickly, and create more chances to win work.
                    </p>
                    <p className="mt-3 text-muted-foreground">
                      Whether you're testing the platform or bidding aggressively, the process is designed to be straightforward and scalable.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {["Browse jobs", "Pick the right opportunities", "Submit bids fast", "Message homeowners", "Win more projects"].map((item, i) => (
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
                  Ready to start bidding on new projects?
                </h2>
                <p className="mt-3 text-primary-foreground/80">
                  Join HomeBids, view open jobs, and start competing for homeowner projects in your area.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/subscribe?type=contractor">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <Link href="/subscribe?type=contractor">View Contractor Plans</Link>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-primary-foreground/40">3-day free trial. Subscription required after trial.</p>
              </div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>

      <ScrollToTop />
    </div>
  );
}
