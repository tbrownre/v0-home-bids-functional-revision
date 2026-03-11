"use client";

import React from "react"

import { useState } from "react";
import { Header } from "@/components/header";
import { signIn as supabaseSignIn } from "@/lib/supabase/actions";
import { AlertCircle, Loader2 as Loader } from "lucide-react";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  TrendingDown,
  SlidersHorizontal,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  X,
  Target,
  Clock,
  BarChart3,
  Shield,
  Zap,
  MapPin,
  Calculator,
  Briefcase,
  Building2,
  LogIn,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function ContractorsPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleDashboardClick = () => {
    setShowLoginModal(true);
  };

  const handleContractorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const result = await supabaseSignIn(loginEmail, loginPassword);

    if (result.error) {
      if (
        result.error.toLowerCase().includes("email not confirmed") ||
        result.error.toLowerCase().includes("not confirmed")
      ) {
        setShowLoginModal(false);
        window.location.href = `/auth/verify-email?status=pending&email=${encodeURIComponent(loginEmail)}`;
        return;
      }
      setLoginError(result.error);
      setLoginLoading(false);
      return;
    }

    // Hard navigation so middleware picks up the new session cookie.
    window.location.replace("/contractors/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Stop Buying Leads. Start Winning Jobs.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              HomeBids.io connects you with verified homeowner projects. Subscribe to access the marketplace, then pay a small per-bid fee only when you choose to bid. No wasted spend on dead leads.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/subscribe?type=contractor">
                  View Contractor Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent"
                onClick={handleDashboardClick}
              >
                Contractor Dashboard
                <Briefcase className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ROI Comparison */}
      <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              The Math That Makes Sense
            </h2>
            <p className="mt-4 text-muted-foreground">
              See how HomeBids.io compares to traditional lead generation
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2"
          >
            {/* Traditional Lead Gen */}
            <Card className="border-border bg-background">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">Traditional Lead Gen</h3>
                  <X className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Cost per lead", value: "$50-200" },
                    { label: "Lead quality", value: "Unknown" },
                    { label: "Conversion rate", value: "~10-20%" },
                    { label: "Cost to acquire customer", value: "$500-2,000" },
                    { label: "Wasted spend", value: "80-90%" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">
                    Pay upfront for leads that may never convert
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* HomeBids.io */}
            <Card className="border-2 border-accent bg-background">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">HomeBids</h3>
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Monthly subscription", value: "From $9.99" },
                    { label: "Lead quality", value: "100% Verified" },
                    { label: "Per-bid fee", value: "$4 – $10" },
                    { label: "Cost to acquire customer", value: "Bid only when you want" },
                    { label: "Wasted spend", value: "Near zero" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg bg-accent/10 p-4">
                  <p className="text-sm text-accent">Bid on verified jobs. Pay only for bids you submit.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Bid Controls */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Full Control Over Your Bids
              </h2>
              <p className="mt-4 text-muted-foreground">
                Set your preferences and only see jobs that match your business. No spam, no
                irrelevant leads.
              </p>

              <div className="mt-8 space-y-6">
                {[
                  {
                    icon: MapPin,
                    title: "ZIP Code Filtering",
                    description: "Define your service area and only see jobs within your range.",
                  },
                  {
                    icon: DollarSign,
                    title: "Budget Preferences",
                    description:
                      "Set minimum job values to focus on projects worth your time.",
                  },
                  {
                    icon: SlidersHorizontal,
                    title: "Job Type Selection",
                    description: "Choose the categories and project types you specialize in.",
                  },
                  {
                    icon: Clock,
                    title: "Availability Settings",
                    description: "Pause notifications when your schedule is full.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-border bg-card">
                <CardContent className="p-8">
                  <h3 className="mb-6 text-lg font-semibold text-foreground">Your Bid Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Service Area
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {["78701", "78702", "78703", "78704"].map((zip) => (
                          <span
                            key={zip}
                            className="rounded-full bg-secondary px-3 py-1 text-sm text-foreground"
                          >
                            {zip}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Minimum Job Value
                      </label>
                      <div className="mt-2 rounded-lg bg-secondary px-4 py-3">
                        <span className="font-semibold text-foreground">$1,000+</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Job Categories
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {["HVAC", "Plumbing", "Electrical"].map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-accent" />
                        <span className="font-medium text-foreground">Actively Bidding</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-primary px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              One low monthly subscription. Pay a small fee only when you choose to bid.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-16 grid gap-8 sm:grid-cols-3"
          >
            {[
              {
                icon: Calculator,
                value: "From $9.99",
                label: "Monthly Subscription",
                description: "Access verified homeowner jobs in your area",
              },
              {
                icon: Target,
                value: "$4 – $10",
                label: "Per Bid Submitted",
                description: "Only pay when you choose to bid on a job",
              },
              {
                icon: Trophy,
                value: "$0",
                label: "No Win Fee",
                description: "Keep 100% of your earnings when you win",
              },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="border-0 bg-primary-foreground/10 backdrop-blur">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
                      <item.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <p className="text-3xl font-bold text-primary-foreground">{item.value}</p>
                    <p className="mt-1 font-medium text-primary-foreground">{item.label}</p>
                    <p className="mt-2 text-sm text-primary-foreground/70">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 flex justify-center"
          >
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/subscribe?type=contractor">
                  View Contractor Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-primary-foreground/70">
                No contracts. Cancel anytime.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Here's What Your Dashboard Looks Like
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to manage bids, track your pipeline, and win more jobs
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-12"
          >
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl sm:rounded-2xl">
              <Image
                src="/images/contractor-dashboard-v2.png"
                alt="HomeBids contractor dashboard showing total pipeline value, bid statuses, job recommendations, bid details, and homeowner messaging"
                width={1200}
                height={1500}
                className="w-full object-cover"
              />
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Real-time pipeline tracking, bid management, and direct homeowner messaging
            </p>
          </motion.div>
        </div>
      </section>

      {/* Simple Onboarding */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Get Started in Minutes
            </h2>
            <p className="mt-4 text-muted-foreground">
              Simple onboarding to start bidding on jobs today
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-4"
          >
            {[
              {
                icon: Zap,
                step: "1",
                title: "Sign Up",
                description: "Create your free account",
              },
              {
                icon: Shield,
                step: "2",
                title: "Verify",
                description: "Confirm your business details",
              },
              {
                icon: SlidersHorizontal,
                step: "3",
                title: "Set Preferences",
                description: "Define your service area",
              },
              {
                icon: BarChart3,
                step: "4",
                title: "Start Bidding",
                description: "Browse and bid on jobs",
              },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                  <item.icon className="h-7 w-7 text-foreground" />
                </div>
                <span className="text-sm font-semibold text-accent">Step {item.step}</span>
                <h3 className="mt-1 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Button size="lg" asChild>
              <Link href="/contractors/signup">
                Create Your Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Why Contractors Choose HomeBids.io
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: TrendingDown,
                title: "Lower CAC",
                description: "Reduce your customer acquisition cost significantly",
              },
              {
                icon: DollarSign,
                title: "No Wasted Spend",
                description: "Stop paying for leads that never convert",
              },
              {
                icon: SlidersHorizontal,
                title: "Full Control",
                description: "Choose which jobs to bid on and when",
              },
              {
                icon: Trophy,
                title: "Win More Work",
                description: "Compete on quality, not just who pays more for leads",
              },
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full border-border bg-background transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <feature.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-primary px-8 py-16 text-center sm:px-16"
          >
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              Ready to Grow Your Business?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Join thousands of contractors winning real work on HomeBids.io
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/subscribe?type=contractor">
                View Contractor Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contractor Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={(open) => {
        setShowLoginModal(open);
        if (!open) {
          setLoginEmail("");
          setLoginPassword("");
          setLoginError("");
          setLoginLoading(false);
        }
      }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-8 pb-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <DialogHeader className="relative">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-semibold">
                Contractor Login
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground">
                Sign in to access your dashboard and manage bids
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <form onSubmit={handleContractorLogin} className="space-y-4">
              {loginError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {loginError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="contractor-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="contractor-email"
                  type="email"
                  placeholder="you@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-11"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contractor-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="contractor-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-11"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 gap-2 text-base"
                disabled={loginLoading || !loginEmail.trim() || !loginPassword.trim()}
              >
                {loginLoading ? <Loader className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Sign In
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  New to HomeBids?
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {"Want to join as a contractor? "}
                <a
                  href="/contractors/signup"
                  className="font-semibold text-primary hover:underline"
                >
                  Apply now
                </a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollToTop />
    </div>
  );
}
