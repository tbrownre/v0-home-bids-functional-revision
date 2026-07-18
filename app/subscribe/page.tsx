"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { SubscriptionCheckout } from "@/components/subscription-checkout";
import { getContractorPlans, getHomeownerPlan, type SubscriptionPlan } from "@/lib/products";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Zap,
  TrendingUp, BarChart2,
  Activity, Users, FileText,
  Thermometer, Droplets,
  Lightbulb, PaintBucket, Trees, Hammer, Bath, ChefHat,
  ArrowRight, BadgeCheck, Link2,
  Shield, Star,
  Smartphone, Bot,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

type UserTypeFilter = "homeowner" | "contractor";

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userType, setUserType] = useState<UserTypeFilter>("homeowner");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "contractor") setUserType("contractor");
    else if (type === "homeowner") setUserType("homeowner");

    // If a plan ID is provided, auto-select it and show checkout
    const planId = searchParams.get("plan");
    if (planId) {
      const plan = [getHomeownerPlan(), ...getContractorPlans()].find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        setShowCheckout(true);
      } else {
        setError("Please select a contractor plan to continue.");
      }
    }

    // If coming from new contractor signup, auto-select the contractor plan and show checkout
    const userId = searchParams.get("userId");
    if (userId && type === "contractor" && !planId) {
      const plan = getContractorPlans()[0];
      if (plan) {
        setSelectedPlan(plan);
        setShowCheckout(true);
      }
    }
  }, [searchParams]);

  const homeownerPlan = getHomeownerPlan();
  const contractorPlans = getContractorPlans();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Homeowner plan is free — skip Stripe and go straight to posting
    if (plan.userType === "homeowner") {
      router.push("/new-job");
      return;
    }
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleSuccess = async () => {
    const isContractor = selectedPlan?.userType === "contractor";
    
    setShowCheckout(false);
    if (isContractor) {
      // Payment confirmed — send contractor to their dashboard
      router.push("/contractors/dashboard");
    } else {
      // Homeowner payment confirmed — send them to post their first job
      router.push("/new-job");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AnimatePresence mode="wait">
            {userType === "homeowner" ? (
              <motion.div
                key="homeowner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* HERO — side by side on desktop */}
                <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
                  {/* Left: hero copy */}
                  <div className="flex-1 text-center lg:text-left">
                    <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">
                      Get Multiple Contractor Bids for Your Project
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                      Post your project once and local contractors compete for the job.
                    </p>
                    <p className="mt-2 text-base text-muted-foreground">
                      Compare prices, ask questions, and hire the right contractor with confidence.
                    </p>
                    <div className="mt-5 flex items-center gap-2 justify-center lg:justify-start">
                      <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-sm text-muted-foreground">
                        Most homeowners receive <span className="font-semibold text-foreground">3–5 contractor bids</span> within 24 hours.
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/50">
                      Zero cost to homeowners. No credit card required.
                    </p>
                  </div>
                  {/* Right: plan card */}
                  <div className="w-full max-w-sm shrink-0">
                    <PlanCard plan={homeownerPlan} onSelect={handleSelectPlan} />
                  </div>
                </div>

                {/* Activity signal */}
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span>New contractor bids are submitted every hour.</span>
                </div>

                {/* Stats bar */}
                <div className="mt-10 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3">
                  {[
                    { icon: FileText, label: "Projects Posted", desc: "Thousands of homeowners post projects each month" },
                    { icon: Users, label: "Contractor Network", desc: "Verified local contractors ready to bid" },
                    { icon: BarChart2, label: "Average Bids", desc: "Most projects receive 3–5 contractor bids" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-semibold text-foreground">{stat.label}</p>
                      <p className="text-xs text-muted-foreground">{stat.desc}</p>
                    </div>
                  ))}
                </div>

                {/* How It Works */}
                <div className="mt-16">
                  <h2 className="text-center text-2xl font-bold text-foreground">How HomeBids Works</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-3">
                    {[
                      { step: "1", icon: FileText, title: "Post Your Project", desc: "Describe what you need done in under 2 minutes." },
                      { step: "2", icon: Users, title: "Contractors Submit Bids", desc: "Local professionals send quotes and availability." },
                      { step: "3", icon: BadgeCheck, title: "Compare & Hire", desc: "Review bids, ask questions, and hire the contractor you trust." },
                    ].map((s) => (
                      <div key={s.step} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {s.step}
                        </div>
                        <s.icon className="h-6 w-6 text-primary" />
                        <p className="font-semibold text-foreground">{s.title}</p>
                        <p className="text-sm text-muted-foreground">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Most homeowners receive multiple bids within hours.
                  </p>
                </div>

                {/* Savings / Competition section */}
                <div className="mt-16 rounded-2xl border border-border bg-card p-8">
                  <h2 className="text-2xl font-bold text-foreground">Contractors Compete For Your Project</h2>
                  <p className="mt-3 text-muted-foreground">
                    When multiple contractors bid on your project, you get better pricing and more options.
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Typical projects receive <span className="font-semibold text-foreground">3–5 bids</span>, allowing homeowners to compare:
                  </p>
                  <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {["Price", "Timeline", "Reviews", "Experience"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-sm text-muted-foreground border-t border-border pt-4">
                    Hiring without multiple quotes often costs hundreds or thousands more.
                  </p>
                </div>

                {/* Verified Contractors */}
                <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Verified Contractors</h2>
                    <p className="mt-3 text-muted-foreground">
                      Every contractor profile includes information to help you choose the right professional.
                    </p>
                    <ul className="mt-5 space-y-3">
                      {[
                        "Business information",
                        "Customer reviews",
                        "Google rating history",
                        "Direct messaging access",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 text-sm text-muted-foreground">
                      You stay in control and choose who to hire.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Contractor Verified</p>
                        <p className="text-xs text-muted-foreground">Profile reviewed by HomeBids</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {["Business info on file", "4.8 ★ Google rating", "12 customer reviews", "3 years on HomeBids"].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Service categories */}
                <div className="mt-16">
                  <h2 className="text-center text-2xl font-bold text-foreground">Contractors Ready to Bid Near You</h2>
                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { icon: Thermometer, label: "HVAC Repair" },
                      { icon: Hammer, label: "Roofing" },
                      { icon: Droplets, label: "Plumbing" },
                      { icon: Lightbulb, label: "Electrical" },
                      { icon: ChefHat, label: "Kitchen Remodeling" },
                      { icon: Trees, label: "Landscaping" },
                      { icon: PaintBucket, label: "Painting" },
                      { icon: Bath, label: "Bathroom Remodeling" },
                    ].map((cat) => (
                      <div key={cat.label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center">
                        <cat.icon className="h-6 w-6 text-primary" />
                        <span className="text-xs font-medium text-foreground">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent activity feed */}
                <div className="mt-16">
                  <h2 className="text-center text-2xl font-bold text-foreground">Recent Activity on HomeBids</h2>
                  <div className="mt-6 space-y-3">
                    {[
                      { icon: FileText, text: "A homeowner in Phoenix posted a kitchen remodel project", time: "2 min ago" },
                      { icon: TrendingUp, text: "A roofing contractor submitted a bid", time: "10 min ago" },
                      { icon: Users, text: "A bathroom renovation received 4 bids today", time: "1 hr ago" },
                      { icon: Activity, text: "A landscaping project received 3 bids this morning", time: "3 hr ago" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <p className="flex-1 text-sm text-foreground">{item.text}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final CTA */}
                <div className="mt-16 rounded-2xl bg-primary px-8 py-12 text-center">
                  <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
                    Ready to Get Contractor Bids?
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
                    Post your project in under 2 minutes and start receiving quotes from local contractors.
                  </p>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="mt-8"
                    onClick={() => handleSelectPlan(homeownerPlan)}
                  >
                    Post Your Project Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="mt-3 text-xs text-primary-foreground/40">
                    Completely free for homeowners. No credit card required.
                  </p>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="contractor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* HEADER */}
                <div className="mb-10 text-center">
                  <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">
                    AI Growth Tools for Contractors
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
                    Estimate faster. Respond better. Win more jobs.
                  </p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-primary">
                    One Plan For All
                  </p>
                </div>

                {/* SINGLE PLAN CARD */}
                <div className="flex justify-center">
                  {contractorPlans.slice(0, 1).map((plan) => (
                    <div key={plan.id} className="w-full max-w-md">
                      <PlanCard plan={plan} onSelect={handleSelectPlan} />
                    </div>
                  ))}
                </div>

                {/* WHAT'S INCLUDED */}
                <div className="mt-16">
                  <h2 className="mb-8 text-center text-2xl font-bold text-foreground">What&apos;s Included</h2>
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                      {
                        icon: FileText,
                        title: "AI Estimate Assistant",
                        desc: "Generate clean, professional estimates in seconds. Describe the job and AI builds a formatted proposal you can send immediately.",
                      },
                      {
                        icon: Link2,
                        title: "Shareable Bid Link Previews",
                        desc: "Turn every bid into a polished, shareable link. Homeowners see a rich preview with your bid details the moment you send it.",
                      },
                      {
                        icon: Smartphone,
                        title: "SMS-First Workflow",
                        desc: "Send estimates and responses via SMS directly from your phone. No desktop required.",
                      },
                      {
                        icon: Bot,
                        title: "HomeBids AI Relay",
                        desc: "For HomeBids-matched leads, our AI handles early communication until the homeowner approves direct contact.",
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BUILT FOR CONTRACTORS */}
                <div className="mt-16 rounded-2xl border border-border bg-card p-8">
                  <h2 className="text-2xl font-bold text-foreground">Built for how contractors actually work</h2>
                  <p className="mt-3 text-muted-foreground">
                    No complex CRM. No heavy dashboard. Just fast, lightweight AI tools that help you estimate, respond, and win — all from your phone.
                  </p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      "Send bids to homeowners in minutes, not hours",
                      "Create professional estimates on the job site",
                      "Share every bid as a polished link preview",
                      "Stay organized without adding office staff",
                      "Send everything via text message",
                      "Works on any device — no app required",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* FINAL CTA */}
                <div className="mt-16 rounded-2xl bg-primary px-8 py-12 text-center">
                  <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
                    Ready to win more jobs?
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
                    Start your free 3-day trial today. No commitment — cancel anytime.
                  </p>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="mt-8"
                    onClick={() => contractorPlans[0] && handleSelectPlan(contractorPlans[0])}
                  >
                    Get AI Growth Tools
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="mt-3 text-xs text-primary-foreground/40">
                    $99/month after 3-day trial. Cancel anytime.
                  </p>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            HomeBids does not process project payments between homeowners and contractors.
            Billing is for platform access only.
          </p>
        </div>
      </main>

      {/* Checkout Modal */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="rounded-lg bg-destructive/10 border border-destructive/50 p-6 max-w-md">
            <h3 className="font-semibold text-destructive mb-2">Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => setError(null)} className="w-full">Dismiss</Button>
          </div>
        </div>
      )}
      
      <Dialog open={showCheckout} onOpenChange={(open) => { if (!open) setShowCheckout(false); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {selectedPlan?.name} Plan — ${((selectedPlan?.priceInCents ?? 0) / 100).toFixed(2)}/mo
            </DialogTitle>
            <DialogDescription>
              {selectedPlan?.hasTrial === false
                ? "Billed immediately. Cancel anytime."
                : "Cancel anytime."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {selectedPlan && (
              <SubscriptionCheckout
                planId={selectedPlan.id}
                onSuccess={handleSuccess}
                onCancel={() => setShowCheckout(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ── PlanCard ──────────────────────────────────────────────────────────────────
function PlanCard({ plan, onSelect }: { plan: SubscriptionPlan; onSelect: (plan: SubscriptionPlan) => void }) {
  const monthlyPrice = (plan.priceInCents / 100).toFixed(0);

  const ctaLabel =
    plan.id === "contractor-growth" ? "Start Free Trial"
    : plan.id === "homeowner-monthly" ? "Post Your Project — Free"
    : plan.hasTrial === false ? `Get ${plan.name}`
    : "Get Started";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${
        plan.highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            <Zap className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

        <div className="mt-4">
          {plan.priceInCents === 0 ? (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">Free</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground/50">
                No credit card required
              </p>
            </div>
          ) : plan.hasTrial === false ? (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-foreground">${monthlyPrice}</span>
              <span className="text-sm font-medium text-muted-foreground">/month</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">$0</span>
                <span className="text-sm font-medium text-muted-foreground">today</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground/50">
                then ${monthlyPrice}/month after free trial
              </p>
            </>
          )}
        </div>

        {plan.savingsCallout && (
          <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {plan.savingsCallout}
          </div>
        )}

        <ul className="mt-6 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>

      </div>

      <Button
        className="mt-6 w-full"
        variant={plan.highlighted ? "default" : "outline"}
        onClick={() => onSelect(plan)}
      >
        {ctaLabel}
      </Button>
    </motion.div>
  );
}
