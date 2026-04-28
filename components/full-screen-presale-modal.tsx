"use client";

import { useState, useEffect } from "react";
import { X, Check, BookOpen, Users, Eye, Zap, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type ModalStep = "hero" | "checkout" | "success";

interface PresaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FullScreenPresaleModal({ open, onOpenChange }: PresaleModalProps) {
  const [step, setStep] = useState<ModalStep>("hero");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Reset step when modal closes
  useEffect(() => {
    if (!open) {
      setStep("hero");
    }
  }, [open]);

  const handleCheckoutClick = () => {
    setStep("checkout");
  };

  const handlePayment = async () => {
    if (!formData.name || !formData.email || !formData.password) return;

    setIsLoading(true);

    // Store presale data in session for checkout
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "presaleParams",
        JSON.stringify({
          role: "contractor",
          plan: "contractor-founding",
          earlyAccess: true,
          foundingContractor: true,
          userData: formData,
        })
      );
    }

    // In a real scenario, this would call your payment API
    // For now, we'll simulate success
    setTimeout(() => {
      setStep("success");
      setIsLoading(false);
    }, 1000);
  };

  const handleContinueAsVisitor = () => {
    onOpenChange(false);
    // Store that user dismissed presale
    if (typeof window !== "undefined") {
      sessionStorage.setItem("presaleDismissed", "true");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center overflow-y-auto">
      <div className="w-full min-h-screen md:min-h-auto md:max-w-2xl bg-white rounded-lg shadow-2xl">
        {/* Step 1: Hero */}
        {step === "hero" && (
          <div className="relative">
            {/* Close Button */}
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={handleContinueAsVisitor}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Header */}
            <div className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-transparent pt-16 pb-12 px-6 md:px-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 ring-2 ring-blue-200 mb-6">
                <Star className="h-8 w-8 text-blue-600" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
                Contractor Founding Access Now Open
              </h1>

              <p className="text-lg text-muted-foreground mb-2 text-balance">
                Join as an early contractor and lock in founding access while we build our trusted contractor network and fine-tune the platform before public launch.
              </p>

              <div className="inline-flex items-center gap-2 mt-6 px-3 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs font-semibold">
                <Zap className="h-3.5 w-3.5" />
                Limited Founding Spots Available
              </div>
            </div>

            {/* Content */}
            <div className="px-6 md:px-8 py-12 space-y-12">
              {/* What You Get */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">What You Get Today</h2>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Demo Login Access</p>
                      <p className="text-sm text-muted-foreground">Preview HomeBids and see the contractor experience firsthand</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 shrink-0">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Local Facebook Groups Directory</p>
                      <p className="text-sm text-muted-foreground">Access to local Facebook groups where homeowners request work</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 shrink-0">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Facebook Group Strategy Playbook</p>
                      <p className="text-sm text-muted-foreground">Our proven tactics to dominate local communities and win jobs</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Founding Contractor Badge</p>
                      <p className="text-sm text-muted-foreground">Priority placement when homeowner jobs go live</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 shrink-0">
                      <Users className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Early Bid Opportunities</p>
                      <p className="text-sm text-muted-foreground">Get in before all contractors have access at launch</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
                <p className="text-center text-sm font-medium text-blue-900">
                  <strong>Get in early while your competitors are still paying for leads.</strong>
                </p>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-50/50 p-6">
                  <p className="text-sm text-muted-foreground mb-2">Founding Contractor Pricing</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-bold text-blue-600">$10</span>
                    <span className="text-lg text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm font-medium text-blue-700">Locked in for life • 3-day free trial included</p>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <Button
                  onClick={handleCheckoutClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
                  size="lg"
                >
                  Claim Founding Access
                </Button>

                <button
                  onClick={handleContinueAsVisitor}
                  className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue as visitor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Checkout */}
        {step === "checkout" && (
          <div className="relative">
            {/* Close Button */}
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setStep("hero")}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Go back"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Header */}
            <div className="bg-gradient-to-br from-green-50 via-green-50/50 to-transparent pt-16 pb-12 px-6 md:px-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Secure Your Founder Access
              </h1>
              <p className="text-muted-foreground">Complete in 60 seconds • No credit card required for trial</p>
            </div>

            {/* Content */}
            <div className="px-6 md:px-8 py-12 space-y-8">
              {/* Order Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-foreground">Founding Contractor</p>
                    <p className="text-xs text-muted-foreground">Lifetime access at founder pricing</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">$10</p>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Total Due Today</p>
                    <p className="text-xl font-bold text-foreground">$10</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Then $10/month • Cancel anytime</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Trust Badge */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  🔒 Your founder rate never increases. Locked at $10/month for life.
                </p>
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <Button
                  onClick={handlePayment}
                  disabled={
                    isLoading ||
                    !formData.name ||
                    !formData.email ||
                    !formData.password
                  }
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
                  size="lg"
                >
                  {isLoading ? "Processing..." : "Pay $10 & Claim Access"}
                </Button>

                <button
                  onClick={() => setStep("hero")}
                  className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div className="relative">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-50 via-green-50/50 to-transparent pt-16 pb-12 px-6 md:px-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-100 ring-2 ring-green-200 mb-6">
                <Check className="h-8 w-8 text-green-600" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Welcome to Founding Contractors
              </h1>

              <p className="text-lg text-muted-foreground">
                Your founder pricing is locked in at $10/month for life.
              </p>
            </div>

            {/* Content */}
            <div className="px-6 md:px-8 py-12 space-y-8">
              {/* Success Cards */}
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <Star className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Founding Contractor Badge
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Live on your profile with priority placement when jobs launch
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Eye className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Demo Credentials</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Check your email for login access to preview the platform
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-6 w-6 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Bonus Materials
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Facebook strategy playbook + local groups directory arriving within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-3">
                <p className="font-semibold text-foreground">Next Steps:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Check your email for demo login credentials
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Watch the demo walkthrough video
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Review bonus Facebook strategy materials
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Prepare your profile for launch day
                  </li>
                </ul>
              </div>

              {/* Message */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
                <p className="text-sm font-medium text-blue-900">
                  You're in early. We'll help you win before the marketplace opens publicly.
                </p>
              </div>

              {/* CTA */}
              <Button
                onClick={() => {
                  onOpenChange(false);
                  // Redirect to dashboard or home
                  window.location.href = "/";
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
                size="lg"
              >
                Continue to HomeBids
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
