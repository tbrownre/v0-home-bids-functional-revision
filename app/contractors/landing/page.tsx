"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { useSignInModal } from "@/components/sign-in-modal-provider";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Shield,
  Zap,
  MessageSquare,
  MapPin,
  ChevronDown,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const TOOLS = [
  {
    icon: FileText,
    title: "AI Bid Builder",
    desc: "Turn rough notes, pricing, photos, and voice recordings into professional estimates. Stop losing jobs to contractors who look more organized.",
  },
  {
    icon: Shield,
    title: "Bid Defender",
    desc: "Help homeowners feel confident in your pricing before they shop around. Explain your value before competitors get a chance to undercut you.",
  },
  {
    icon: MapPin,
    title: "HomeBids Opportunities",
    desc: "Receive project opportunities from homeowners actively seeking bids in your area. Only pay for your subscription — no per-lead fees.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Zap,
    title: "Start Free",
    desc: "Create your contractor profile and activate your 3-day free trial.",
  },
  {
    step: "2",
    icon: FileText,
    title: "Build Better Estimates",
    desc: "Use the AI Bid Builder to turn job notes into professional, itemized proposals.",
  },
  {
    step: "3",
    icon: Shield,
    title: "Defend Your Pricing",
    desc: "Use Bid Defender to help homeowners understand and trust your estimate.",
  },
  {
    step: "4",
    icon: MessageSquare,
    title: "Respond Faster",
    desc: "AI-assisted messaging helps you communicate professionally without extra effort.",
  },
  {
    step: "5",
    icon: MapPin,
    title: "Receive Homeowner Opportunities",
    desc: "Opt in to receive project leads from homeowners seeking bids in your trade and area.",
  },
];

const PLAN_FEATURES = [
  "AI Bid Builder",
  "Bid Defender",
  "Homeowner bid opportunities",
  "AI-assisted homeowner messaging",
  "Contractor profile",
  "SMS / iMessage workflow",
  "Bid formatting assistance",
  "Homeowner communication tools",
  "Affiliate program access",
];

export default function ContractorLandingPage() {
  const { openSignIn } = useSignInModal();
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              For Home Service Professionals
            </span>

            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Win More Jobs Without{" "}
              <span className="text-primary">More Admin Work</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              AI-powered tools designed to help contractors create professional estimates, protect
              pricing, and manage opportunities — all in one simple workflow.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-8 text-base font-semibold"
                asChild
              >
                <Link href="/subscribe?type=contractor">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full px-8 text-base font-semibold"
                asChild
              >
                <Link href="#tools">
                  Explore Contractor Tools
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                3-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                No long-term contracts
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                No complicated setup
              </span>
            </div>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6 rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
          >
            {[
              { value: "3", label: "AI-powered tools" },
              { value: "$99", label: "per month" },
              { value: "3-day", label: "free trial" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-bold text-primary sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CONTRACTOR TOOLS ───────────────────────────────────────────── */}
      <section id="tools" className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your AI Contractor Toolkit
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three focused tools built specifically for home service professionals.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-12 grid gap-6 sm:grid-cols-3"
          >
            {TOOLS.map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
              >
                <Card className="h-full border-border bg-background transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <tool.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{tool.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {tool.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeInUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              A simple workflow built for contractors who want to grow their business.
            </p>
          </motion.div>

          <div className="mx-auto mt-14 max-w-2xl space-y-5">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Step {item.step}
                    </span>
                    <h3 className="mt-0.5 font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="ml-6 mt-4 h-5 w-px bg-border" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeInUp} className="mt-12 text-center">
            <Button size="lg" className="h-12 rounded-full px-10 text-base font-semibold" asChild>
              <Link href="/subscribe?type=contractor">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <motion.div {...fadeInUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              One plan. Everything included. Start with a 3-day free trial.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-10"
          >
            <Card className="border-border shadow-xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    HomeBids Contractor
                  </p>
                  <p className="mt-4 text-5xl font-bold text-foreground">$99</p>
                  <p className="mt-1 text-muted-foreground">/month</p>
                  <p className="mt-2 text-sm font-semibold text-primary">3-day free trial</p>
                </div>

                <ul className="mt-8 space-y-3 border-t border-border pt-8">
                  {PLAN_FEATURES.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      <span className="text-sm capitalize text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className="mt-8 h-12 w-full rounded-full text-base font-semibold"
                  asChild
                >
                  <Link href="/subscribe?type=contractor">Start Free Trial</Link>
                </Button>

                <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  HomeBids does not guarantee a specific number of leads or jobs. Opportunities vary
                  based on service area, trade, and demand.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── AFFILIATE ─────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            {...fadeInUp}
            className="rounded-2xl border border-border bg-card px-8 py-12 text-center shadow-sm"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Affiliate Program
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Refer other contractors to HomeBids and earn recurring commissions. The more
              contractors you bring in, the more you earn — month after month.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="mt-6 h-12 rounded-full px-8 text-base font-semibold"
              asChild
            >
              <Link href="/affiliates">Learn About Affiliates</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to Grow Your Business?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              A professional contractor toolkit powered by HomeBids AI. Start your free trial today
              — no setup, no long-term commitment.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 gap-2 rounded-full px-10 text-base font-semibold"
                asChild
              >
                <Link href="/subscribe?type=contractor">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-primary-foreground/30 px-8 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10"
                onClick={openSignIn}
              >
                Contractor Login
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/60">
              $99/month &bull; 3-day free trial &bull; No long-term contracts
            </p>
          </motion.div>
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
