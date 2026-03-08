"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  DollarSign,
  Users,
  TrendingUp,
  Gift,
  CheckCircle2,
  Calculator,
  Sparkles,
  Zap,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Building2,
  Globe,
  Megaphone,
  MessageSquare,
  Star,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const HOMEOWNER_PRICE = 9.99;
const HO_MONTH1_RATE = 0.5;
const HO_RECURRING_RATE = 0.2;
const HO_RECURRING_MONTHS = 5; // months 2-6
const CONTRACTOR_SIGNUP_FEE = 10;
const CONTRACTOR_BID_FEE_RATE = 0.1;
const CONTRACTOR_BID_MONTHS = 6;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="More info"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="ml-1 text-muted-foreground hover:text-foreground"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({
  label, tip, min, max, step = 1, value, onChange, format,
}: {
  label: string; tip: string; min: number; max: number; step?: number;
  value: number; onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center text-sm font-medium text-foreground">
          {label}
          <Tip text={tip} />
        </span>
        <span className="rounded-lg bg-muted px-3 py-1 text-sm font-bold text-foreground">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-green-500"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

// ─── Earnings Calculator ──────────────────────────────────────────────────────
function AffiliateEarningsCalculator() {
  // Homeowner inputs
  const [hoReferred, setHoReferred] = useState(25);
  const [hoAssumeConvert, setHoAssumeConvert] = useState(true);
  const [hoConvRate, setHoConvRate] = useState(60);

  // Contractor inputs
  const [ctReferred, setCtReferred] = useState(10);
  const [ctBidsPerMonth, setCtBidsPerMonth] = useState(30);
  const [ctAvgBidFee, setCtAvgBidFee] = useState(10);

  const [copied, setCopied] = useState(false);

  // Homeowner calcs
  const hoCalc = useMemo(() => {
    const conv = hoAssumeConvert ? 1 : hoConvRate / 100;
    const paidHo = hoReferred * conv;
    const month1 = paidHo * HOMEOWNER_PRICE * HO_MONTH1_RATE;
    const monthlyRecurring = paidHo * HOMEOWNER_PRICE * HO_RECURRING_RATE;
    const total6 = month1 + monthlyRecurring * HO_RECURRING_MONTHS;
    const annualized = month1 + monthlyRecurring * 11;
    return { month1, monthlyRecurring, total6, annualized };
  }, [hoReferred, hoAssumeConvert, hoConvRate]);

  // Contractor calcs
  const ctCalc = useMemo(() => {
    const signupComm = ctReferred * CONTRACTOR_SIGNUP_FEE;
    const monthlyBidComm = ctReferred * ctBidsPerMonth * ctAvgBidFee * CONTRACTOR_BID_FEE_RATE;
    const total6 = signupComm + monthlyBidComm * CONTRACTOR_BID_MONTHS;
    return { signupComm, monthlyBidComm, total6 };
  }, [ctReferred, ctBidsPerMonth, ctAvgBidFee]);

  const grandTotal6 = hoCalc.total6 + ctCalc.total6;

  const handleCopy = useCallback(() => {
    const conv = hoAssumeConvert ? "100%" : `${hoConvRate}%`;
    const text = `${hoReferred} homeowners/mo @${conv} conv → ${fmt(hoCalc.total6)} 6-mo | ${ctReferred} contractors @${ctBidsPerMonth} bids → ${fmt(ctCalc.total6)} 6-mo | Total: ${fmt(grandTotal6)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [hoReferred, hoAssumeConvert, hoConvRate, hoCalc, ctReferred, ctBidsPerMonth, ctCalc, grandTotal6]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-foreground">Earnings Calculator</h3>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy scenario"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Homeowner Panel */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Homeowner Referrals</span>
          </div>

          <Slider
            label="Homeowners referred / month"
            tip="How many homeowners you expect to refer each month through your link."
            min={0} max={500} value={hoReferred} onChange={setHoReferred}
            format={(v) => String(v)}
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Assume trial converts?</span>
              <Tip text="If yes, all referred users count as paid. If no, set your estimated conversion rate." />
            </div>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setHoAssumeConvert(val)}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    hoAssumeConvert === val
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {val ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {!hoAssumeConvert && (
            <Slider
              label="Trial-to-paid conversion rate"
              tip="Percentage of referred homeowners who complete the free trial and subscribe."
              min={0} max={100} value={hoConvRate} onChange={setHoConvRate}
              format={(v) => `${v}%`}
            />
          )}

          {/* Results */}
          <div className="space-y-3 rounded-xl bg-muted/40 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Month 1 commission</span>
              <span className="font-semibold text-foreground">{fmt(hoCalc.month1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly recurring (mo 2–6)</span>
              <span className="font-semibold text-foreground">{fmt(hoCalc.monthlyRecurring)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
              <span className="text-foreground">6-month total</span>
              <span className="text-green-600">{fmt(hoCalc.total6)}</span>
            </div>
          </div>
        </div>

        {/* Contractor Panel */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Contractor Referrals</span>
          </div>

          <Slider
            label="Contractors referred / month"
            tip="Number of contractors you bring to the platform each month."
            min={0} max={200} value={ctReferred} onChange={setCtReferred}
            format={(v) => String(v)}
          />
          <Slider
            label="Avg bids per contractor / month"
            tip="How many bids each contractor submits on average per month."
            min={0} max={200} value={ctBidsPerMonth} onChange={setCtBidsPerMonth}
            format={(v) => String(v)}
          />
          <Slider
            label="Avg bid fee"
            tip="The average per-bid fee paid by the contractor, typically $4–$10."
            min={0} max={10} step={0.5} value={ctAvgBidFee} onChange={setCtAvgBidFee}
            format={(v) => `$${v}`}
          />

          {/* Results */}
          <div className="space-y-3 rounded-xl bg-muted/40 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Signup commissions (this month)</span>
              <span className="font-semibold text-foreground">{fmt(ctCalc.signupComm)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bid-fee commissions / month</span>
              <span className="font-semibold text-foreground">{fmt(ctCalc.monthlyBidComm)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
              <span className="text-foreground">6-month total</span>
              <span className="text-amber-600">{fmt(ctCalc.total6)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Combined summary */}
      <div className="border-t border-border bg-muted/20 px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Combined 6-month estimate</p>
            <p className="text-2xl font-extrabold text-foreground">{fmt(grandTotal6)}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span className="text-muted-foreground">HO: <strong className="text-foreground">{fmt(hoCalc.total6)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">CT: <strong className="text-foreground">{fmt(ctCalc.total6)}</strong></span>
            </div>
          </div>
        </div>
        {/* Bar */}
        {grandTotal6 > 0 && (
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-blue-400 transition-all" style={{ width: `${(hoCalc.total6 / grandTotal6) * 100}%` }} />
            <div className="bg-amber-400 transition-all" style={{ width: `${(ctCalc.total6 / grandTotal6) * 100}%` }} />
          </div>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground/60">
          Estimates only. Actual earnings depend on subscriber retention and bid activity.
        </p>
      </div>
    </div>
  );
}

// ─── Application Form ─────────────────────────────────────────────────────────
function ApplicationForm({ onSuccess }: { onSuccess: () => void }) {
  const [data, setData] = useState({
    fullName: "", email: "", phone: "", website: "",
    audienceType: "", monthlyReach: "", region: "",
    howPromote: "", agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field: string, value: string | boolean) =>
    setData((p) => ({ ...p, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.fullName.trim()) e.fullName = "Full name is required.";
    if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email)) e.email = "Valid email required.";
    if (!data.website.trim()) e.website = "Website or social profile URL is required.";
    if (!data.audienceType) e.audienceType = "Please select your audience type.";
    if (!data.howPromote.trim()) e.howPromote = "Please describe how you'll promote HomeBids.";
    if (!data.agreeTerms) e.agreeTerms = "You must agree to the affiliate terms.";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    // Mock API — replace with real endpoint
    setTimeout(() => { setSubmitting(false); onSuccess(); }, 800);
  };

  const field = (id: string) => ({
    id,
    "aria-invalid": !!errors[id],
    "aria-describedby": errors[id] ? `${id}-err` : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full Name</Label>
        <Input {...field("fullName")} placeholder="Jane Smith" value={data.fullName} onChange={(e) => set("fullName", e.target.value)} />
        {errors.fullName && <p id="fullName-err" className="text-xs text-destructive">{errors.fullName}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input {...field("email")} type="email" placeholder="jane@example.com" value={data.email} onChange={(e) => set("email", e.target.value)} />
          {errors.email && <p id="email-err" className="text-xs text-destructive">{errors.email}</p>}
        </div>
        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="phone" type="tel" placeholder="(512) 555-0100" value={data.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <Label htmlFor="website">Website / Social Profile URL</Label>
        <Input {...field("website")} placeholder="https://yoursite.com or @handle" value={data.website} onChange={(e) => set("website", e.target.value)} />
        {errors.website && <p id="website-err" className="text-xs text-destructive">{errors.website}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Audience type */}
        <div className="space-y-1.5">
          <Label htmlFor="audienceType">Audience Type</Label>
          <Select value={data.audienceType} onValueChange={(v) => set("audienceType", v)}>
            <SelectTrigger id="audienceType" aria-invalid={!!errors.audienceType}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contractor-creator">Contractor Creator (YouTube/TikTok)</SelectItem>
              <SelectItem value="real-estate-creator">Real Estate Creator</SelectItem>
              <SelectItem value="fb-group-admin">FB Group Admin</SelectItem>
              <SelectItem value="blogger">Home Improvement Blogger</SelectItem>
              <SelectItem value="agency">Agency / Lead-Gen Operator</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.audienceType && <p id="audienceType-err" className="text-xs text-destructive">{errors.audienceType}</p>}
        </div>

        {/* Monthly reach */}
        <div className="space-y-1.5">
          <Label htmlFor="monthlyReach">Est. Monthly Reach</Label>
          <Input id="monthlyReach" type="number" placeholder="5000" value={data.monthlyReach} onChange={(e) => set("monthlyReach", e.target.value)} />
        </div>
      </div>

      {/* Region */}
      <div className="space-y-1.5">
        <Label htmlFor="region">Primary Region (City / State)</Label>
        <Input id="region" placeholder="Austin, TX" value={data.region} onChange={(e) => set("region", e.target.value)} />
      </div>

      {/* How promote */}
      <div className="space-y-1.5">
        <Label htmlFor="howPromote">How will you promote HomeBids?</Label>
        <Textarea
          {...field("howPromote")}
          id="howPromote"
          placeholder="Tell us about your audience and how you plan to drive referrals..."
          rows={4}
          value={data.howPromote}
          onChange={(e) => set("howPromote", e.target.value)}
        />
        {errors.howPromote && <p id="howPromote-err" className="text-xs text-destructive">{errors.howPromote}</p>}
      </div>

      {/* Terms */}
      <div className="space-y-1.5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border accent-green-600"
            checked={data.agreeTerms}
            onChange={(e) => set("agreeTerms", e.target.checked)}
          />
          <span className="text-sm text-muted-foreground">
            I agree to the{" "}
            <Link href="#" className="underline underline-offset-2 text-foreground hover:text-primary">
              affiliate terms
            </Link>{" "}
            and confirm I will not use spam or misleading promotions.
          </span>
        </label>
        {errors.agreeTerms && <p className="text-xs text-destructive">{errors.agreeTerms}</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Application"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="#" download>Download Program Overview</a>
        </Button>
      </div>
    </form>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
        aria-expanded={open}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{a}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AffiliatesPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600">
              <Gift className="h-4 w-4" />
              Affiliate Program
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Earn recurring revenue by referring homeowners &amp; contractors to HomeBids.
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 text-xl text-muted-foreground"
          >
            Get paid for every subscription — and for contractor bid activity. Simple tracking. Monthly payouts.
          </motion.p>

          <motion.ul
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-6 flex flex-wrap justify-center gap-4 text-sm"
          >
            {["Recurring commissions", "Tracks web + app installs", "Monthly payouts via Stripe"].map((b) => (
              <li key={b} className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {b}
              </li>
            ))}
          </motion.ul>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700" asChild>
              <a href="#apply">
                Apply to Join
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#calculator">See Earnings Calculator</a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Three simple steps to start earning</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { step: "1", icon: Users, title: "Apply and get approved", desc: "Submit your application. We review within 2 business days and onboard approved partners with a unique tracking link." },
              { step: "2", icon: Zap, title: "Share your link", desc: "Your link works across web and app installs. Share it anywhere — social, email, your site, or directly to your audience." },
              { step: "3", icon: DollarSign, title: "Earn commissions", desc: "Get paid on subscriptions and bid activity. Recurring payments for 6 months on every subscriber you refer." },
            ].map((item) => (
              <motion.div
                key={item.step}
                {...fadeUp}
                className="relative rounded-2xl border border-border bg-background p-8 text-center"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                    {item.step}
                  </div>
                </div>
                <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                  <item.icon className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Offer Cards ──────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">What You Earn</h2>
            <p className="mt-4 text-muted-foreground">Two commission streams, both paying for 6 months.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Homeowner */}
            <motion.div {...fadeUp} className="rounded-2xl border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Homeowner Referrals</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Pricing: $9.99/mo subscription</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />50% of month 1</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />20% recurring for 6 months</li>
              </ul>
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                Refer 25 homeowners/month → up to <strong className="text-foreground">~$375</strong> in 6-month recurring earnings
              </div>
            </motion.div>

            {/* Contractor */}
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Contractor Referrals</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Pricing: Plans + bid fees</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />$10 per contractor signup</li>
                <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />10% of bid fees for 6 months</li>
              </ul>
              <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                Refer 10 contractors → <strong className="text-foreground">$100 upfront</strong> + bid-fee upside for 6 months
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Calculator ───────────────────────────────────────────── */}
      <section id="calculator" className="border-t border-border bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp} className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">See Your Earning Potential</h2>
            <p className="mt-4 text-muted-foreground">Adjust the sliders to model your scenario in real time.</p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <AffiliateEarningsCalculator />
          </motion.div>
        </div>
      </section>

      {/* ── Who It's For ─────────────────────────────────────────── */}
      <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Who This Is For</h2>
            <p className="mt-4 text-muted-foreground">If your audience includes homeowners or contractors, you're a fit.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Megaphone, title: "Contractor Creators", desc: "YouTube / TikTok channels covering trades, tools, and the contractor lifestyle." },
              { icon: Building2, title: "Real Estate Creators", desc: "Agents, investors, and realtors with an engaged audience of homebuyers and sellers." },
              { icon: Users, title: "Community Leaders", desc: "Facebook group admins and neighborhood influencers with local homeowner reach." },
              { icon: Globe, title: "Home Improvement Bloggers", desc: "Writers and content creators covering DIY, remodels, and home services." },
              { icon: BarChart2, title: "Agencies & Lead-Gen Ops", desc: "Marketing agencies or operators running paid or organic campaigns in home services." },
              { icon: Sparkles, title: "Local Pros", desc: "Real estate attorneys, inspectors, or anyone with a trusted local network of homeowners." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                  <item.icon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Partner Highlights</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 mb-12">
            {[
              { name: "Carlos M.", role: "Contractor YouTube Channel", quote: "I mention HomeBids in my videos once and keep getting paid months later. The bid-fee commissions stack up fast." },
              { name: "Sarah L.", role: "Realtor & Instagram Creator", quote: "My followers are always looking for trusted contractors. HomeBids gives me a way to actually monetize those recommendations." },
              { name: "Tony R.", role: "Austin Homeowners Facebook Group", quote: "I just pinned my link. Within 60 days I had my first payout. Zero extra work." },
            ].map((t) => (
              <motion.div key={t.name} {...fadeUp} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Program highlights */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Program Highlights</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "Monthly payouts via Stripe",
                "Real-time dashboard tracking",
                "Dedicated partner support",
                "Tracks web + app installs",
                "Custom landing pages for top partners",
                "No minimum referral requirement",
              ].map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Application Form ─────────────────────────────────────── */}
      <section id="apply" className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <motion.div {...fadeUp} className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Apply to Join</h2>
            <p className="mt-4 text-muted-foreground">
              Tell us about yourself. We review every application and respond within 2 business days.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-8">
            {submitted ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Application received.</h3>
                <p className="text-muted-foreground max-w-sm">
                  We&apos;ll review your application and reach out within 2 business days. Thanks for your interest in the HomeBids Affiliate Program.
                </p>
              </div>
            ) : (
              <ApplicationForm onSuccess={() => setSubmitted(true)} />
            )}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-3xl font-bold text-foreground sm:text-4xl text-center">FAQ</h2>
          <div className="rounded-2xl border border-border bg-card px-6 divide-y divide-border">
            {[
              { q: "How do payouts work?", a: "Commissions are calculated monthly and paid out via Stripe on the 15th of each following month. You'll need to connect a Stripe account in your partner dashboard." },
              { q: "Can I promote in-app subscriptions?", a: "Yes. Your affiliate link tracks both web signups and mobile app installs. Attribution works across both surfaces." },
              { q: "What counts as a valid referral?", a: "A referral is valid when someone clicks your unique link and completes a paid subscription or contractor signup within 30 days." },
              { q: "Can I run paid ads?", a: "Yes, with restrictions. You may not bid on HomeBids brand keywords (e.g., 'HomeBids') in paid search. All other paid placements are allowed." },
              { q: "When do commissions post?", a: "Commissions post within 48 hours of a successful subscription payment. You can view pending and confirmed commissions in your dashboard." },
              { q: "Is there a minimum payout threshold?", a: "Yes, the minimum payout is $25. Unpaid balances roll over to the next month automatically." },
            ].map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to earn recurring commissions?
          </h2>
          <p className="mt-4 text-primary-foreground/70">Free to join. No minimum referrals required.</p>
          <div className="mt-8">
            <Button size="lg" variant="secondary" asChild>
              <a href="#apply">
                Apply to Join
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
