"use client";

import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  FileText,
  Users,
  Shield,
  Phone,
  X,
  TrendingDown,
  BarChart2,
  Gavel,
  ChevronRight,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function HomeownersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              For Homeowners
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Stop Calling Contractors.{" "}
              <span className="text-primary">Let Them Compete</span> For Your Project.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Post your project once and receive multiple contractor bids — allowing you to compare pricing, experience, and timelines before choosing who to hire.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Homeowners often overpay because they only receive one quote. HomeBids helps you get multiple bids so you can make a smarter decision.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/">
                  Post Your Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero UI mockup */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mx-auto mt-14 max-w-3xl"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                {[
                  { step: "1", label: "Project Posted", icon: FileText, active: true },
                  { step: "2", label: "Contractors Bidding", icon: Gavel, active: true },
                  { step: "3", label: "You Choose", icon: CheckCircle2, active: false },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className={`font-medium ${s.active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                    {i < 2 && <ChevronRight className="absolute hidden" />}
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                {[
                  { name: "Mike's Roofing", bid: "$4,800", time: "2h ago" },
                  { name: "Austin Pro Contractors", bid: "$5,200", time: "3h ago" },
                  { name: "Lone Star Builds", bid: "$4,500", time: "5h ago" },
                ].map((bid, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5 text-sm">
                    <span className="font-medium text-foreground">{bid.name}</span>
                    <span className="font-semibold text-primary">{bid.bid}</span>
                    <span className="text-xs text-muted-foreground">{bid.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF TRUST STRIP ─────────────────────────── */}
      <section className="border-y border-border bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Users, text: "Multiple contractor bids per project" },
              { icon: BarChart2, text: "Competitive pricing from local professionals" },
              { icon: CheckCircle2, text: "Transparent contractor comparisons" },
              { icon: MessageSquare, text: "Private messaging with contractors" },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <item.icon className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POWER OF MULTIPLE BIDS ───────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left */}
            <motion.div {...fadeInUp}>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Most Homeowners Overpay Without Realizing It
              </h2>
              <p className="mt-4 text-muted-foreground">
                When you only get one quote, you have no way of knowing if the price is fair.
              </p>
              <p className="mt-3 text-muted-foreground">
                HomeBids changes that. By receiving multiple bids from contractors interested in your project, you can easily compare pricing and choose the best value.
              </p>
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="font-semibold text-green-800">
                  Homeowners commonly save 10–30% when comparing multiple contractor bids.
                </p>
              </div>
            </motion.div>

            {/* Right: visual comparison */}
            <motion.div {...fadeInUp} transition={{ delay: 0.15 }} className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">1 Quote</p>
                    <p className="font-bold text-red-800 text-lg">$8,500</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-red-700">No comparison. No leverage. You pay what they ask.</p>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">vs</span>
              </div>

              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <BarChart2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">4 Quotes via HomeBids</p>
                    <p className="font-bold text-green-800 text-lg">$5,800 – $7,200</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-green-700">You choose the best value. Contractors compete for your business.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── EVERYTHING IN ONE PLACE ──────────────────────────── */}
      <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.h2 {...fadeInUp} className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Everything In One Place
          </motion.h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: BarChart2,
                title: "Compare Contractors Easily",
                desc: "Review contractor bids side-by-side including pricing, experience, and project timelines. Make confident decisions without guesswork.",
              },
              {
                icon: MessageSquare,
                title: "No Spam or Endless Phone Calls",
                desc: "Your project stays organized inside HomeBids. Contractors communicate with you through private messaging, keeping everything simple and controlled.",
              },
              {
                icon: Users,
                title: "Post Once, Reach Many Contractors",
                desc: "Instead of calling multiple companies, HomeBids brings interested contractors directly to you. One post. Multiple bids.",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIMPLE PROCESS ───────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.h2 {...fadeInUp} className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Simple Process
          </motion.h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", icon: FileText, title: "Post Your Project", desc: "Describe your project and submit your request in minutes." },
              { step: "2", icon: Gavel, title: "Contractors Submit Bids", desc: "Interested contractors review your request and submit their proposals." },
              { step: "3", icon: MessageSquare, title: "Chat and Compare", desc: "Ask questions and compare contractor options through private messaging." },
              { step: "4", icon: CheckCircle2, title: "Choose Your Contractor", desc: "Select the contractor you trust most and move forward with your project." },
            ].map((s, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    Step {s.step}
                  </span>
                </div>
                <div className="mt-2 flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.p {...fadeInUp} className="mt-8 text-center text-sm text-muted-foreground">
            HomeBids simply facilitates the introduction.
          </motion.p>
        </div>
      </section>

      {/* ── DESIGNED TO PROTECT HOMEOWNERS ──────────────────── */}
      <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left */}
            <motion.div {...fadeInUp}>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Your Information Stays Private
              </h2>
              <p className="mt-4 text-muted-foreground">
                HomeBids is designed to protect homeowners from the chaos of traditional contractor searches.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Your contact information is not publicly shared",
                  "No unexpected contractor visits",
                  "No endless follow-up calls",
                  "Communication stays organized in one place",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right: messaging UI card */}
            <motion.div {...fadeInUp} transition={{ delay: 0.15 }}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Private Messages</p>
                    <p className="text-xs text-muted-foreground">Your info is never shared publicly</p>
                  </div>
                  <Shield className="ml-auto h-4 w-4 text-green-600" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      Can you start the project next week?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-foreground">
                      Yes, I'm available Monday morning.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      Great, let's move forward!
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">All communication stays inside HomeBids</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.h2 {...fadeInUp} className="text-center text-3xl font-bold text-foreground sm:text-4xl">
            Traditional Contractor Search vs HomeBids
          </motion.h2>
          <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="mt-10 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-2 bg-muted/50">
              <div className="p-4 text-center text-sm font-semibold text-muted-foreground">Traditional Method</div>
              <div className="border-l border-border bg-primary/5 p-4 text-center text-sm font-semibold text-primary">HomeBids</div>
            </div>
            {[
              ["Call contractors one by one", "Post once"],
              ["Wait days for responses", "Receive multiple bids"],
              ["Hard to compare quotes", "Compare contractors instantly"],
              ["Pricing uncertainty", "Make informed decisions"],
            ].map(([trad, hb], i) => (
              <div key={i} className={`grid grid-cols-2 border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <X className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  {trad}
                </div>
                <div className="flex items-center gap-2 border-l border-border bg-primary/5 p-4 text-sm font-medium text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                  {hb}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MARKETPLACE TRUST SIGNAL ─────────────────────────── */}
      <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div {...fadeInUp}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Gavel className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl">
              Contractors Compete For Your Project
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              When contractors know they are competing for your project, pricing becomes more competitive and service improves.
            </p>
            <p className="mt-3 text-muted-foreground">
              This marketplace dynamic works in your favor.
            </p>
            <p className="mt-4 font-semibold text-foreground">
              You stay in control of who you hire.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            {...fadeInUp}
            className="rounded-3xl bg-primary px-8 py-16 text-center"
          >
            <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
              Find the Right Contractor Without the Stress
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Post your project today and start receiving bids from contractors ready to earn your business.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/">
                  Post Your Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/how-it-works">Learn How HomeBids Works</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
