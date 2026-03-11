"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { SubscriptionCheckout } from "@/components/subscription-checkout";
import { getContractorPlans, getHomeownerPlan, type SubscriptionPlan } from "@/lib/products";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Zap, X, Minus, AlertCircle,
  TrendingUp, Clock, Star, BarChart2, Shield,
  Activity, Users, FileText, Wrench, Thermometer, Droplets,
  Lightbulb, PaintBucket, Trees, Hammer, Bath, ChefHat,
  ArrowRight, BadgeCheck, MessageSquare, LayoutDashboard,
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

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "contractor") setUserType("contractor");
    else if (type === "homeowner") setUserType("homeowner");
  }, [searchParams]);

  const homeownerPlan = getHomeownerPlan();
  const contractorPlans = getContractorPlans();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // All plans (contractor and homeowner) go through Stripe first.
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const handleSuccess = async () => {
    const isContractor = selectedPlan?.userType === "contractor";
    setShowCheckout(false);
    if (isContractor && selectedPlan) {
      // Payment confirmed — now send contractor to complete their profile.
      router.push(`/contractors/signup?plan=${selectedPlan.id}`);
    } else {
      // Homeowner payment confirmed — go to homepage to post a job.
      router.push("/");
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
                      3-day free trial → then $9.99/month. Cancel anytime.
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
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
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
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
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
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
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
                    3-day free trial → then $9.99/month. Cancel anytime.
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
                {/* SECTION 1 — Header */}
                <div className="mb-10 text-center">
                  <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">
                    Choose Your Contractor Plan
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
                    Win more jobs. Get faster alerts. Pay less per bid.
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Contractors on <span className="font-semibold text-foreground">Pro & Elite win 2.4x more projects</span>
                  </p>
                </div>

                {/* SECTION 2 — Early Access Callout */}
                <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">Early Job Access —</span> Elite contractors see jobs{" "}
                    <span className="font-semibold">up to 10 minutes before other users</span>, giving them the best chance to win projects first.
                  </p>
                </div>

                {/* SECTION 3 — Pricing Cards */}
                <div className="grid gap-6 sm:grid-cols-3">
                  {contractorPlans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                  ))}
                </div>

                {/* SECTION 4 — Example Monthly Earnings */}
                <div className="mt-16">
                  <div className="mb-2 text-center">
                    <h2 className="text-2xl font-bold text-foreground">Example Monthly Earnings</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      See the potential revenue contractors generate using HomeBids.
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                      <span>Average Job Value: <strong className="text-foreground">$1,500</strong></span>
                      <span>Average Platform Win Rate: <strong className="text-foreground">15%</strong></span>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-6 sm:grid-cols-3">
                    {[
                      { plan: "Starter", jobs: 3, revenue: 4500, highlighted: false },
                      { plan: "Pro", jobs: 5, revenue: 7500, highlighted: true },
                      { plan: "Elite", jobs: 8, revenue: 12000, highlighted: true },
                    ].map((item) => (
                      <div
                        key={item.plan}
                        className={`rounded-2xl border bg-card p-6 shadow-sm ${
                          item.highlighted ? "border-primary ring-2 ring-primary/20" : "border-border"
                        }`}
                      >
                        <p className="text-sm font-semibold text-muted-foreground">{item.plan}</p>
                        <p className="mt-3 text-3xl font-extrabold text-foreground">
                          ${item.revenue.toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">revenue potential</p>
                        <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          {item.jobs} jobs per month
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 5 — Why Contractors Upgrade */}
                <div className="mt-16 grid gap-6 sm:grid-cols-2">
                  {[
                    {
                      title: "Pro Contractors",
                      icon: Star,
                      color: "text-primary",
                      items: ["Get alerts instantly", "Submit bids faster", "Appear higher in search"],
                    },
                    {
                      title: "Elite Contractors",
                      icon: Shield,
                      color: "text-amber-600",
                      items: ["See jobs before everyone else", "Pay the lowest bid fees", "Win the most projects"],
                    },
                  ].map((col) => (
                    <div key={col.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <col.icon className={`h-5 w-5 ${col.color}`} />
                        <h3 className="font-bold text-foreground">{col.title}</h3>
                      </div>
                      <ul className="space-y-3">
                        {col.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* SECTION 6 — Feature Comparison Table */}
                <div className="mt-16 overflow-x-auto">
                  <h2 className="mb-6 text-2xl font-bold text-foreground text-center">Feature Comparison</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 text-left font-medium text-muted-foreground w-1/2">Feature</th>
                        <th className="py-3 text-center font-medium text-muted-foreground">Starter</th>
                        <th className="py-3 text-center font-semibold text-primary">Pro</th>
                        <th className="py-3 text-center font-medium text-amber-600">Elite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { feature: "Marketplace access", starter: true, pro: true, elite: true },
                        { feature: "Bid cost", starter: "$10", pro: "$7", elite: "$4" },
                        { feature: "Job alerts", starter: "Delayed", pro: "Instant", elite: "Instant + SMS*" },
                        { feature: "Profile ranking", starter: "Standard", pro: "Priority", elite: "Top" },
                        { feature: "AI bid help", starter: false, pro: "Templates", elite: "Full AI bids" },
                        { feature: "Early job access", starter: false, pro: false, elite: true },
                        { feature: "Contractor analytics", starter: false, pro: "Basic", elite: "Advanced" },
                      ].map((row) => (
                        <tr key={row.feature}>
                          <td className="py-3 text-foreground">{row.feature}</td>
                          <td className="py-3 text-center"><TableCell value={row.starter} /></td>
                          <td className="py-3 text-center"><TableCell value={row.pro} /></td>
                          <td className="py-3 text-center"><TableCell value={row.elite} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs text-muted-foreground/60">* SMS alerts coming soon</p>
                </div>

                {/* SECTION 7 — Calculator */}
                <div className="mt-16">
                  <h2 className="mb-2 text-2xl font-bold text-foreground text-center">Contractor Earnings Calculator</h2>
                  <p className="mb-8 text-center text-sm text-muted-foreground">Estimate your monthly revenue and ROI across plans.</p>
                  <EarningsCalculator onSelect={handleSelectPlan} plans={contractorPlans} />
                </div>

                {/* SECTION 8 — Conversion Microcopy */}
                <div className="mt-10 flex flex-col items-center gap-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Most contractors upgrade to <span className="font-semibold text-foreground">Pro after winning their first job.</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Elite contractors typically win <span className="font-semibold text-foreground">2–3x more projects.</span>
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
      <Dialog open={showCheckout} onOpenChange={(open) => { if (!open) setShowCheckout(false); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {selectedPlan?.name} Plan — ${((selectedPlan?.priceInCents ?? 0) / 100).toFixed(2)}/mo
            </DialogTitle>
            <DialogDescription>
              {selectedPlan?.hasTrial === false
                ? "Billed immediately. Cancel anytime."
                : "3-day free trial included. Cancel anytime."}
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
  const monthlyPrice = (plan.priceInCents / 100).toFixed(2);
  const bidFee = plan.bidFeeInCents > 0 ? `$${(plan.bidFeeInCents / 100).toFixed(0)} per bid` : null;

  const ctaLabel =
    plan.id === "contractor-pro" ? "Upgrade to Pro"
    : plan.id === "contractor-elite" ? "Go Elite"
    : plan.hasTrial === false ? `Get ${plan.name}`
    : "Start Free Trial";

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
          {plan.hasTrial === false ? (
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

        {bidFee && (
          <div className="mt-2 inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            + {bidFee}
          </div>
        )}

        {plan.savingsCallout && (
          <div className="mt-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            {plan.savingsCallout}
          </div>
        )}

        <ul className="mt-6 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              {feature}
            </li>
          ))}
        </ul>

        {plan.id === "contractor-starter" && (
          <ul className="mt-3 space-y-2">
            {["Limited job visibility", "Higher bid fees"].map((lim) => (
              <li key={lim} className="flex items-start gap-2.5 text-sm text-muted-foreground/70">
                <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                {lim}
              </li>
            ))}
          </ul>
        )}
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

// ── TableCell ─────────────────────────────────────────────────────────────────
function TableCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle2 className="inline h-4 w-4 text-green-600" />;
  if (value === false) return <X className="inline h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-foreground">{value}</span>;
}

// ── EarningsCalculator ────────────────────────────────────────────────────────
const WIN_RATES: Record<string, number> = {
  "Beginner (10%)": 0.1,
  "Active bidder (20%)": 0.2,
  "Top contractor (30%)": 0.3,
};

const PLAN_CONFIG = [
  { id: "contractor-starter", label: "Starter", avgBids: 30, bidFeePerBid: 10, monthlySub: 9.99, cta: "Start Free Trial", highlighted: false },
  { id: "contractor-pro",     label: "Pro",     avgBids: 25, bidFeePerBid: 7,  monthlySub: 29,   cta: "Upgrade to Pro",  highlighted: true  },
  { id: "contractor-elite",   label: "Elite",   avgBids: 20, bidFeePerBid: 4,  monthlySub: 79,   cta: "Go Elite",        highlighted: false },
];

function EarningsCalculator({
  onSelect,
  plans,
}: {
  onSelect: (plan: SubscriptionPlan) => void;
  plans: SubscriptionPlan[];
}) {
  const [jobValue, setJobValue] = useState(1500);
  const [jobsWanted, setJobsWanted] = useState(5);
  const [winRateKey, setWinRateKey] = useState("Active bidder (20%)");
  const winRate = WIN_RATES[winRateKey];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Inputs */}
        <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
          <h3 className="mb-6 font-semibold text-foreground">Your Numbers</h3>
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-foreground">Average Job Value</span>
                <span className="font-semibold text-foreground">${jobValue.toLocaleString()}</span>
              </div>
              <input
                type="range" min={250} max={20000} step={250} value={jobValue}
                onChange={(e) => setJobValue(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>$250</span><span>$20,000</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-foreground">Jobs Wanted Per Month</span>
                <span className="font-semibold text-foreground">{jobsWanted}</span>
              </div>
              <input
                type="range" min={1} max={20} step={1} value={jobsWanted}
                onChange={(e) => setJobsWanted(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>1</span><span>20</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Estimated Win Rate</label>
              <select
                value={winRateKey}
                onChange={(e) => setWinRateKey(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {Object.keys(WIN_RATES).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="p-6">
          <h3 className="mb-4 font-semibold text-foreground">Estimated Results</h3>
          <div className="space-y-4">
            {PLAN_CONFIG.map((cfg) => {
              const bidsNeeded = Math.ceil(jobsWanted / winRate);
              const bidCost = bidsNeeded * cfg.bidFeePerBid;
              const jobsWon = Math.round(bidsNeeded * winRate);
              const revenue = jobsWon * jobValue;
              const platformCost = cfg.monthlySub + bidCost;
              const roi = platformCost > 0 ? Math.round(revenue / platformCost) : 0;
              const plan = plans.find((p) => p.id === cfg.id);

              return (
                <div
                  key={cfg.id}
                  className={`rounded-xl border p-4 ${
                    cfg.highlighted ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{cfg.label}</p>
                      <p className="mt-1 text-xl font-extrabold text-foreground">
                        ${revenue.toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">est. revenue</span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{bidsNeeded} bids · ${bidCost} bid cost</span>
                        <span>{jobsWon} jobs won</span>
                        <span>${platformCost.toFixed(0)}/mo total cost</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        cfg.highlighted ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}>
                        <BarChart2 className="h-3 w-3" />
                        {roi}x ROI
                      </span>
                    </div>
                  </div>
                  {plan && (
                    <Button
                      size="sm"
                      variant={cfg.highlighted ? "default" : "outline"}
                      className="mt-3 w-full"
                      onClick={() => onSelect(plan)}
                    >
                      {cfg.cta}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
