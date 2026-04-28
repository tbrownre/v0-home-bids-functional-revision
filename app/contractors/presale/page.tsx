"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { SubscriptionCheckout } from "@/components/subscription-checkout";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  Lock, CheckCircle2, Facebook, MessageSquare, TrendingUp,
  X, AlertCircle, Sparkles, Shield, Clock, Zap
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const FOUNDING_PLAN_ID = "contractor-elite";
const FOUNDING_PRICE_CENTS = 1000; // $10/month
const FUTURE_ELITE_PRICE_CENTS = 7900; // $79/month

const BONUSES = [
  {
    icon: Facebook,
    title: "Your Local Community Facebook Group List",
    desc: "We help you discover where homeowners in your market are actively asking for help.",
  },
  {
    icon: MessageSquare,
    title: "How To Dominate These Groups",
    desc: "Messaging tactics, response angles, and positioning strategies contractors are using to generate work organically.",
  },
  {
    icon: TrendingUp,
    title: "Stop Paying For Expensive Leads",
    desc: "Some contractors are canceling lead-gen spend after using this approach.",
  },
];

export default function ContractorPresalePage() {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    checkAuth();
  }, []);

  const handleReserve = () => {
    if (!accepted) return;
    setShowCheckout(true);
  };

  const handleSuccess = () => {
    setShowCheckout(false);
    router.push(`/contractors/signup?plan=${FOUNDING_PLAN_ID}&founding_presale=true`);
  };

  const savingPercentage = Math.round(((FUTURE_ELITE_PRICE_CENTS - FOUNDING_PRICE_CENTS) / FUTURE_ELITE_PRICE_CENTS) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-4 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Founding Pricing + Bonus Access — Limited Spots</span>
            </div>

            <h1 className="text-balance text-4xl sm:text-5xl font-bold text-foreground mt-4">
              Lock In Elite Access For <span className="text-primary">$10/Month</span> — And Get Our Facebook Group Growth Playbook Included
            </h1>

            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Join as a Founding Contractor and secure lifetime Elite pricing plus get the local Facebook Group strategy many contractors are using instead of burning money on Google and Meta ads.
            </p>
          </motion.div>

          {/* Main Offer Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background p-8 sm:p-10 mb-12 shadow-lg"
          >
            {/* Pricing Header */}
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-primary mb-2">FOUNDING CONTRACTOR PLAN</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl sm:text-6xl font-bold text-foreground">$10</span>
                <span className="text-xl text-muted-foreground">/month for life</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Normally $79/month • Due Today</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-100/50 dark:bg-green-950/30 px-4 py-2 border border-green-200 dark:border-green-800">
                <Lock className="h-4 w-4 text-green-700 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">Lifetime pricing lock</span>
              </div>
            </div>

            {/* Included Items */}
            <div className="space-y-3 mb-8 pb-8 border-b border-border">
              {[
                "Everything in future Elite plan",
                "Priority opportunity visibility",
                "Founding Contractor badge",
                "Lifetime pricing lock",
                "Local Facebook Group List Bonus",
                "Facebook Group Domination Playbook",
                "Scripts + tips to win jobs in these groups",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>

            {/* CTA and Checkbox */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">
                    I want to reserve my Founding Contractor Plan at $10/month locked for life + Facebook Group bonus access
                  </p>
                </div>
              </label>

              <Button
                onClick={handleReserve}
                disabled={!accepted}
                size="lg"
                className="w-full text-base font-semibold py-6"
              >
                Pay $10 & Claim My Founder Access
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                No free trial. Billed today. Cancel anytime.
              </p>
            </div>
          </motion.div>

          {/* Comparison: Presale vs Launch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-foreground text-center mb-6">
              Join During Presale vs After Launch
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground">Join During Presale</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "$10/month forever",
                    "Elite access included",
                    "Facebook Group bonus included",
                    "Founder perks + priority visibility",
                    "Limited founding spots available",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-muted/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-bold text-foreground">Join After Launch</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "$79/month",
                    "No founder pricing",
                    "No bonus playbook",
                    "No founder perks",
                    "Standard access",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-lg font-bold text-foreground">
                Save <span className="text-primary">${savingPercentage}%</span> For Life + Get The Growth Strategy Included
              </p>
            </div>
          </motion.div>

          {/* Bonuses Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-foreground text-center mb-2">
              Join Now and Get These Bonuses Included
            </h2>
            <p className="text-center text-muted-foreground mb-8 text-sm">
              Complete bonus package valued at $997 included free
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {BONUSES.map((bonus, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <bonus.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{bonus.title}</h3>
                  <p className="text-sm text-muted-foreground">{bonus.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-900 dark:text-amber-300">
                <span className="font-semibold">Real contractors are doing this:</span> Some contractors are canceling lead-gen spend after using this approach. You're not just locking in software pricing — you're getting an unfair customer acquisition advantage.
              </p>
            </div>
          </motion.div>

          {/* Why This Is Limited */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-border bg-card p-6 mb-12"
          >
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-2">Why This Opportunity Is Limited</h3>
                <p className="text-sm text-muted-foreground">
                  We're limiting Founding Contractor spots per market to ensure quality and maintain competitive advantage for early adopters. Once your local market fills up, Founding Contractor status and $10/month pricing will no longer be available. This ensures founders like you have a real unfair advantage in your area.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Trust badges */}
          <div className="text-center space-y-2 text-sm text-muted-foreground pb-8">
            <p>✓ No credit card required to inspect offer • Takes 60 seconds to reserve</p>
            <p>✓ Cancel anytime • Money-back guarantee if not satisfied within 30 days</p>
          </div>
        </div>
      </main>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={(open) => { if (!open) setShowCheckout(false); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              Founding Contractor Plan — $10/month for life
            </DialogTitle>
            <DialogDescription>
              Billed today. Elite access + Facebook Group bonus included.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <SubscriptionCheckout
              planId={FOUNDING_PLAN_ID}
              onSuccess={handleSuccess}
              onCancel={() => setShowCheckout(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
