"use client";

import { motion } from "framer-motion";
import { getSmsLink } from "@/lib/sms-config";
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
  Lock,
  MapPin,
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
    desc: "Send us your project details and photos.",
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
    q: "Do contractors pay HomeBids for homeowner leads?",
    a: "No. Contractors never pay HomeBids for individual leads, and we never sell your information to the highest bidder. Our goal is to connect you with qualified contractors who are a strong fit for your project, so you can compare competitive estimates and choose the option that works best for you.",
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
                  onClick={() => window.location.href = getSmsLink()}
                >
                  <Phone className="h-[18px] w-[18px] shrink-0" />
                  Text Us to Start Your Project
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
              <div
                className="relative"
                style={{ width: 300, height: 640, flexShrink: 0 }}
              >
                <div
                  className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-40 w-72 rounded-full"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 0%, rgba(10,132,255,0.12) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                  aria-hidden="true"
                />
                <div style={{ position: "absolute", inset: 0 }}>
                  <SmsIphonePreview />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8" style={{ marginTop: "28px" }}>
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
        <div className="mx-auto max-w-2xl text-center">
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
            className="mt-8 space-y-4"
          >
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-left">
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
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-left">
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
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">

          {/* Copy */}
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your Information Stays Private
            </h2>
            <p className="mt-4 text-muted-foreground">
              HomeBids protects your personal information while contractors review and prepare bids
              for your project.
            </p>
            <ul className="mt-6 space-y-3 text-left">
              {[
                "Your name, phone number, email, and exact address remain private",
                "Contractors initially receive only your project details and city/ZIP code",
                "Your contact information is shared only after you approve a contractor's bid or estimate",
                "You remain in control of who can contact you",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Privacy-focused project card mockup */}
          <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.1 }} className="mt-10">
            {/* iPhone shell */}
            <div
              className="mx-auto overflow-hidden"
              style={{
                width: 320,
                borderRadius: 40,
                border: "9px solid #1C1C1E",
                boxShadow: "0 0 0 1px #3A3A3C, 0 28px 56px -8px rgba(0,0,0,0.45)",
                background: "#000",
              }}
            >
              {/* Status bar */}
              <div
                className="relative flex items-center justify-between px-5 pt-2 pb-1"
                style={{ background: "#F2F2F7" }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "#000" }}>9:41</span>
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    width: 90,
                    height: 24,
                    background: "#1C1C1E",
                    borderRadius: 12,
                    top: 9,
                  }}
                />
                <div className="flex items-center gap-1">
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <rect x="0" y="4" width="2" height="6" rx="1" fill="#000" />
                    <rect x="3" y="2.5" width="2" height="7.5" rx="1" fill="#000" />
                    <rect x="6" y="1" width="2" height="9" rx="1" fill="#000" />
                    <rect x="9" y="0" width="2" height="10" rx="1" fill="#000" />
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#000" }}>5G</span>
                  <div style={{ width: 22, height: 11, borderRadius: 3, border: "1.5px solid #000", padding: "1.5px", display: "flex", alignItems: "center" }}>
                    <div style={{ width: "80%", height: "100%", background: "#34C759", borderRadius: 2 }} />
                  </div>
                </div>
              </div>

              {/* Card header */}
              <div
                className="flex items-center gap-2 px-4 pb-3 pt-3"
                style={{ background: "#F2F2F7", borderBottom: "0.5px solid rgba(0,0,0,0.15)" }}
              >
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#0A84FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield className="h-4 w-4" style={{ color: "#fff" }} />
                </div>
                <div className="flex flex-col text-left">
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#000" }}>Contractor View</span>
                  <span style={{ fontSize: 11, color: "#8E8E93" }}>What contractors see</span>
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-col gap-3 px-4 py-4" style={{ background: "#fff", minHeight: 340 }}>
                {/* Project details — shared */}
                <div style={{ background: "#F2F2F7", borderRadius: 14, padding: "12px 14px" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.04em" }}>Project</span>
                    <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 600, color: "#34C759" }}>
                      <CheckCircle2 className="h-3 w-3" style={{ color: "#34C759" }} />
                      Shared
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#000", marginTop: 4 }}>Roof repair — asphalt shingle</p>
                  <p style={{ fontSize: 12, color: "#636366", marginTop: 2, lineHeight: 1.4 }}>Approx. 1,800 sq ft. Storm damage on north-facing slope. Budget ~$6k.</p>
                </div>

                {/* City / ZIP — visible */}
                <div style={{ background: "#F2F2F7", borderRadius: 14, padding: "12px 14px" }}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600, color: "#000" }}>
                      <MapPin className="h-4 w-4" style={{ color: "#0A84FF" }} />
                      Austin, TX 78704
                    </span>
                    <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 600, color: "#34C759" }}>
                      <CheckCircle2 className="h-3 w-3" style={{ color: "#34C759" }} />
                      Visible
                    </span>
                  </div>
                </div>

                {/* Personal contact — private */}
                <div style={{ background: "#F8F8FA", border: "1px dashed #C7C7CC", borderRadius: 14, padding: "12px 14px" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.04em" }}>Contact Info</span>
                    <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93" }}>
                      <Lock className="h-3 w-3" style={{ color: "#8E8E93" }} />
                      Private
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5" style={{ marginTop: 8 }}>
                    {["Name", "Phone", "Email", "Exact address"].map((label) => (
                      <div key={label} className="flex items-center justify-between">
                        <span style={{ fontSize: 12, color: "#636366" }}>{label}</span>
                        <span style={{ height: 8, width: 72, borderRadius: 4, background: "#D8D8DC" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer note */}
                <div className="mt-auto flex items-center gap-2" style={{ background: "#E8F1FF", borderRadius: 12, padding: "10px 12px" }}>
                  <Lock className="h-4 w-4 shrink-0" style={{ color: "#0A84FF" }} />
                  <span style={{ fontSize: 12, color: "#0A66D6", fontWeight: 500, lineHeight: 1.35 }}>Shared only after bid approval</span>
                </div>
              </div>

              {/* Home indicator */}
              <div className="flex justify-center pb-2 pt-3" style={{ background: "#fff" }}>
                <div style={{ width: 100, height: 4, borderRadius: 2, background: "#1C1C1E" }} />
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              You stay in control of who can contact you
            </p>
          </motion.div>
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
                className="h-12 gap-2.5 rounded-full bg-white px-8 text-base font-semibold text-primary hover:bg-white/90"
                onClick={() => window.location.href = getSmsLink()}
              >
                <Phone className="h-[18px] w-[18px] shrink-0" />
                Text Us to Start Your Project
              </Button>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-full px-8 text-base font-semibold text-white transition-colors hover:bg-white/10"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)" }}
              >
                How It Works
              </Link>
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
