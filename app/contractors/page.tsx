"use client";

import React, { useState } from "react";
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
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  MessageSquare,
  Shield,
  Smartphone,
  MapPin,
  FileText,
  Building2,
  LogIn,
  PlayCircle,
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

const features = [
  {
    icon: FileText,
    title: "AI Estimate Assistance",
    description:
      "Build cleaner, more professional estimates in minutes. HomeBids AI helps organize project scope, timelines, pricing structure, and homeowner expectations.",
  },
  {
    icon: MessageSquare,
    title: "AI Response Assistant",
    description:
      "Respond faster to homeowner questions, objections, follow-ups, and pricing concerns with AI-assisted messaging.",
  },
  {
    icon: Shield,
    title: "Price Check Tool",
    description:
      "Help homeowners understand your pricing with easy-to-read price comparison and pricing confidence tools.",
  },
  {
    icon: MapPin,
    title: "Homeowner Opportunities",
    description:
      "When homeowners request bids through HomeBids, matching contractors may receive project opportunities in their area.",
  },
  {
    icon: Smartphone,
    title: "SMS / iMessage Workflow",
    description:
      "Manage estimates and homeowner communication through a clean, mobile-first texting workflow.",
  },
];

const steps = [
  {
    step: "1",
    icon: Zap,
    title: "Join HomeBids",
    description: "Create your contractor profile and start your free trial.",
  },
  {
    step: "2",
    icon: FileText,
    title: "Build Better Estimates",
    description: "Use HomeBids AI to structure cleaner and more professional bids.",
  },
  {
    step: "3",
    icon: MessageSquare,
    title: "Respond Faster",
    description: "Use AI-assisted responses to communicate with homeowners more effectively.",
  },
  {
    step: "4",
    icon: Shield,
    title: "Defend Your Pricing",
    description: "Help homeowners understand and trust your estimate.",
  },
  {
    step: "5",
    icon: MapPin,
    title: "Receive Homeowner Opportunities",
    description:
      "Participating contractors may receive homeowner project opportunities based on location and trade.",
  },
];

const planFeatures = [
  "AI estimate assistant",
  "AI response assistant",
  "Price check software",
  "Homeowner bid opportunities",
  "Contractor profile",
  "SMS / iMessage workflow",
  "Bid formatting assistance",
  "Homeowner communication tools",
];

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
              Win More Jobs With AI
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              HomeBids helps contractors create professional estimates, respond faster to homeowners,
              defend pricing, and manage customer conversations more effectively — all through a
              simple AI-powered workflow.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/subscribe?type=contractor">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent"
                onClick={handleDashboardClick}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                See How It Works
              </Button>
            </div>
            <div className="mt-6 space-y-1 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                $99/month &bull; 3-day free trial
              </p>
              <p className="text-xs text-muted-foreground">
                No complicated setup. No long-term contracts.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="bg-card px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Your AI-Powered Contractor Toolkit
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to estimate faster, close more jobs, and communicate
              professionally.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp} className="flex">
                <Card className="h-full w-full border-border bg-background transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <feature.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-muted-foreground">
              A simple workflow built for contractors who want to grow.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mx-auto mt-16 max-w-4xl space-y-6"
          >
            {steps.map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="pt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Step {item.step}
                    </span>
                    <h3 className="mt-0.5 font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="ml-6 mt-3 h-5 w-px bg-border" />
                )}
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
              <Link href="/subscribe?type=contractor">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
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
              One plan. Everything included. Start with a 3-day free trial.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-14 max-w-lg"
          >
            <Card className="border-0 bg-primary-foreground shadow-xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    HomeBids Contractor
                  </p>
                  <p className="mt-4 text-5xl font-bold text-foreground">$99</p>
                  <p className="mt-1 text-muted-foreground">/month</p>
                  <p className="mt-2 text-sm font-medium text-accent">3-day free trial</p>
                </div>

                <ul className="mt-8 space-y-3 border-t border-border pt-8">
                  {planFeatures.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                      <span className="text-sm text-foreground capitalize">{feat}</span>
                    </li>
                  ))}
                </ul>

                <Button size="lg" className="mt-8 w-full" asChild>
                  <Link href="/subscribe?type=contractor">Start Free Trial</Link>
                </Button>

                <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  HomeBids does not guarantee a specific number of leads or jobs. Homeowner
                  opportunities vary based on service area, category, and demand.
                </p>
              </CardContent>
            </Card>
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
            className="rounded-2xl bg-card px-8 py-16 text-center sm:px-16 border border-border"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Ready to Grow Your Business?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              A professional contractor toolkit powered by the HomeBids ecosystem. Start your free
              trial today — no setup required.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/subscribe?type=contractor">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent" onClick={handleDashboardClick}>
                Contractor Login
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              $99/month &bull; 3-day free trial &bull; No long-term contracts
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contractor Login Modal */}
      <Dialog
        open={showLoginModal}
        onOpenChange={(open) => {
          setShowLoginModal(open);
          if (!open) {
            setLoginEmail("");
            setLoginPassword("");
            setLoginError("");
            setLoginLoading(false);
          }
        }}
      >
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
                  <button type="button" className="text-xs text-muted-foreground hover:text-primary" onClick={() => alert("Password reset — contact support@homebids.ai")}>
                    Forgot password?
                  </button>
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
                <span className="bg-background px-2 text-muted-foreground">New to HomeBids?</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {"Want to join as a contractor? "}
                <a
                  href="/subscribe?type=contractor"
                  className="font-semibold text-primary hover:underline"
                >
                  Start your free trial
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
