"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { Button } from "@/components/ui/button";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  MessageSquare,
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  Phone,
  Shield,
  Star,
  ChevronDown,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const JOURNEY_STEPS = [
  {
    step: "1",
    icon: MessageSquare,
    title: "Text HomeBids",
    desc: "Send us your project details, photos, videos, or voice notes.",
  },
  {
    step: "2",
    icon: FileText,
    title: "AI Builds Your Project Scope",
    desc: "We help organize your project details, timeline, budget, and requirements.",
  },
  {
    step: "3",
    icon: Users,
    title: "Contractor Outreach Begins",
    desc: "HomeBids contacts qualified contractors that match your project.",
  },
  {
    step: "4",
    icon: CheckCircle2,
    title: "Compare Options",
    desc: "Review bids and choose the contractor that best fits your needs.",
  },
];

const FAQS = [
  {
    q: "Is HomeBids free for homeowners?",
    a: "Yes — HomeBids is completely free to use for homeowners. You post your project, receive bids, and compare contractors at no cost.",
  },
  {
    q: "How do I start a project?",
    a: "Just text us your project details. Our AI will help organize the scope, timeline, and requirements so contractors can submit accurate bids.",
  },
  {
    q: "Will contractors contact me directly?",
    a: "Only contractors you choose to engage with can message you. Your contact information stays private until you decide to share it.",
  },
  {
    q: "What types of projects can I post?",
    a: "Any home improvement, remodeling, repair, or maintenance project — roofing, plumbing, HVAC, painting, flooring, landscaping, and more.",
  },
  {
    q: "How many bids will I receive?",
    a: "It depends on your project type and location, but HomeBids reaches out to qualified contractors in your area to maximize your options.",
  },
];

export default function HomeownersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-0 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:gap-12">

            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="flex-1 text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                For Homeowners
              </span>

              <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Get Better Bids for Your{" "}
                <span className="text-primary">Home Project</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                Text HomeBids and our AI will help define your project, organize the details, and
                connect you with qualified contractors.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="h-12 gap-2.5 rounded-full px-8 text-base font-semibold"
                  onClick={() => window.open("sms:+1?body=Hi%2C%20I%27d%20like%20to%20start%20a%20home%20project", "_blank")}
                >
                  <Phone className="h-[18px] w-[18px] shrink-0" />
                  Text Us to Start Your Project
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full px-8 text-base font-semibold"
                  asChild
                >
                  <Link href="#how-it-works">
                    How It Works
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Trust strip */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Free for homeowners
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-green-600" />
                  Your info stays private
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500" />
                  Multiple bids, your choice
                </span>
              </div>
            </motion.div>

            {/* Right — iPhone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2 }}
              className="flex shrink-0 justify-center"
            >
              <div className="relative" style={{ width: 300, height: 580 }}>
                <div
                  className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 0%, rgba(10,132,255,0.12) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                  aria-hidden="true"
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <SmsIphonePreview />
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeInUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start your project with a simple text message. HomeBids handles the rest.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY_STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-block rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    Step {s.step}
                  </span>
                </div>
                <div className="mt-3 flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY MULTIPLE BIDS ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fadeInUp}>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Most Homeowners Overpay Without Knowing It
              </h2>
              <p className="mt-4 text-muted-foreground">
                When you only get one quote, you have no way of knowing if the price is fair.
                HomeBids changes that — multiple contractors compete for your project so you can
                make a smarter, more confident decision.
              </p>
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="font-semibold text-green-800">
                  Homeowners commonly save 10–30% when comparing multiple contractor bids.
                </p>
              </div>
            </motion.div>

            <motion.div
              {...fadeInUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-4"
            >
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  1 Quote — No Comparison
                </p>
                <p className="mt-1 text-2xl font-bold text-red-800">$8,500</p>
                <p className="mt-1 text-sm text-red-700">
                  No leverage. No way to know if it&apos;s fair.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">vs</span>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  4 Quotes via HomeBids
                </p>
                <p className="mt-1 text-2xl font-bold text-green-800">$5,800 – $7,200</p>
                <p className="mt-1 text-sm text-green-700">
                  You choose the best value. Contractors compete.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── PRIVACY + CONTROL ─────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Messaging card mockup */}
            <motion.div {...fadeInUp} className="order-2 lg:order-1">
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
                      Can you start next week?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-foreground">
                      Yes, available Monday morning.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      Let&apos;s move forward!
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  All communication stays inside HomeBids
                </p>
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.1 }} className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your Information Stays Private
              </h2>
              <p className="mt-4 text-muted-foreground">
                HomeBids is designed to protect homeowners from the chaos of traditional contractor
                searches.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Your contact info is not publicly shared",
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
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.h2
            {...fadeInUp}
            className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Homeowner FAQs
          </motion.h2>
          <div className="mt-10 space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <p className="font-semibold text-foreground">{faq.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            {...fadeInUp}
            className="rounded-3xl bg-primary px-8 py-16 text-center"
          >
            <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to Start Your Home Project?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Text HomeBids and get connected with qualified contractors — no forms, no spam, no
              hassle.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 gap-2.5 rounded-full px-8 text-base font-semibold"
                onClick={() =>
                  window.open(
                    "sms:+1?body=Hi%2C%20I%27d%20like%20to%20start%20a%20home%20project",
                    "_blank"
                  )
                }
              >
                <Phone className="h-[18px] w-[18px] shrink-0" />
                Text Us to Start Your Project
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-primary-foreground/30 px-8 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="#how-it-works">How It Works</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/60">
              Free for homeowners &bull; No account required to start
            </p>
          </motion.div>
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
