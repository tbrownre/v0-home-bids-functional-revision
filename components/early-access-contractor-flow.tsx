"use client";

import { useState } from "react";
import { ChevronLeft, Star, Check, BookOpen, Users, Zap, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EarlyAccessContractorFlowProps {
  onBack: () => void;
  onClose: () => void;
}

export function EarlyAccessContractorFlow({ onBack, onClose }: EarlyAccessContractorFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<"offer" | "bonuses" | "payment" | "success">("offer");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleStepChange = (newStep: typeof step) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(newStep);
  };

  const handlePayment = async () => {
    setIsLoading(true);
    
    // Store early access params for checkout
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('earlyAccessParams', JSON.stringify({
        role: 'contractor',
        plan: 'contractor-founding',
        earlyAccess: true,
        foundingContractor: true,
        userData: formData,
      }));
    }

    // Redirect to checkout with founding plan
    router.push(`/subscribe?type=contractor&plan=contractor-founding&early_access=true&founding_contractor=true`);
  };

  return (
    <>
      {/* Step 1: Offer Popup */}
      {step === "offer" && (
        <>
          <div className="relative bg-gradient-to-br from-amber-50/50 via-background to-transparent px-6 pt-8 pb-6">
            <button
              onClick={onBack}
              className="absolute top-4 left-4 p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">
                Lock In Elite Access For $10/Month For Life
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground mt-2 text-base">
                Join as a Founding Contractor and get lifetime Elite pricing plus our local Facebook Group growth system included.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-8 space-y-6">
            {/* Limited Spots Badge */}
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-900">
                <Lock className="h-3.5 w-3.5" />
                Limited Founding Spots
              </span>
            </div>

            {/* Pricing Highlight */}
            <div className="rounded-xl border-2 border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <p className="text-sm text-muted-foreground mb-2">Founding Contractor Pricing</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-amber-700">$10</span>
                <span className="text-lg text-muted-foreground">/month</span>
              </div>
              <p className="text-sm font-medium text-amber-700">Price locked for life • 87% off regular pricing</p>
            </div>

            {/* Value Stack */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Included Today:</p>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Elite Access</p>
                    <p className="text-xs text-muted-foreground">$79/month value — unlimited bidding, top placement</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Local Facebook Groups List</p>
                    <p className="text-xs text-muted-foreground">Personalized for your market</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Facebook Group Domination Playbook</p>
                    <p className="text-xs text-muted-foreground">Scripts, tactics, and strategies contractors use</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Founding Contractor Badge</p>
                    <p className="text-xs text-muted-foreground">Priority visibility + lifetime credibility</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Callout */}
            <div className="rounded-lg bg-orange-100/50 border border-orange-200 p-3">
              <p className="text-sm text-orange-900 font-medium">
                💡 Some contractors are replacing expensive lead-gen spend with this strategy.
              </p>
            </div>

            {/* Microcopy */}
            <p className="text-xs text-center text-muted-foreground font-medium">
              $10 due today • Price locked for life
            </p>

            {/* CTA */}
            <Button
              onClick={() => handleStepChange("bonuses")}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6 text-lg"
              size="lg"
            >
              Claim My Founding Spot
            </Button>
          </div>
        </>
      )}

      {/* Step 2: Bonus Reinforcement */}
      {step === "bonuses" && (
        <>
          <div className="relative bg-gradient-to-br from-blue-50/50 via-background to-transparent px-6 pt-8 pb-6">
            <button
              onClick={() => handleStepChange("offer")}
              className="absolute top-4 left-4 p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">
                You're Also Getting Our Facebook Group Growth Bonus
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground mt-2 text-base">
                The complete package to land jobs locally
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-8 space-y-6">
            {/* Bonus Details */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Find the Right Communities</p>
                  <p className="text-sm text-muted-foreground">We help you identify local groups where homeowners are already active</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 shrink-0">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Proven Tactics & Scripts</p>
                  <p className="text-sm text-muted-foreground">See exactly how top contractors are winning jobs in these groups</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 shrink-0">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Compete With Insider Knowledge</p>
                  <p className="text-sm text-muted-foreground">Strategies many contractors would pay for, included free</p>
                </div>
              </div>
            </div>

            {/* Callout */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm font-medium text-blue-900">
                ✨ Many contractors would pay $200-500/year for this strategy guide alone. Included free as your founder bonus.
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-2 p-4 rounded-lg bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Your Founder Package:</p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> $10/month founder pricing</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Elite access (unlimited bidding)</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Facebook Group bonus package</p>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => handleStepChange("payment")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
              size="lg"
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Payment */}
      {step === "payment" && (
        <>
          <div className="relative bg-gradient-to-br from-slate-50/50 via-background to-transparent px-6 pt-8 pb-6">
            <button
              onClick={() => handleStepChange("bonuses")}
              className="absolute top-4 left-4 p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-bold text-center">
                Secure Your Founder Access
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground mt-2">
                Complete your profile and payment in 60 seconds
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-8 space-y-6">
            {/* Order Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">Founding Contractor</p>
                  <p className="text-xs text-muted-foreground">Lifetime access at founder pricing</p>
                </div>
                <p className="text-lg font-bold text-foreground">$10</p>
              </div>
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Total Due Today</p>
                  <p className="text-xl font-bold text-foreground">$10</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Then $10/month • Includes Elite access + Facebook bonus package</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Trust Line */}
            <p className="text-xs text-center text-muted-foreground">
              🔒 Your founder rate never increases. Locked at $10/month for life.
            </p>

            {/* CTA */}
            <Button
              onClick={handlePayment}
              disabled={isLoading || !formData.name || !formData.email || !formData.password}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
              size="lg"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Processing..." : "Pay $10 & Secure Access"}
            </Button>
          </div>
        </>
      )}

      {/* Step 4: Success */}
      {step === "success" && (
        <>
          <div className="relative bg-gradient-to-br from-green-50/50 via-background to-transparent px-6 pt-8 pb-6">
            <DialogHeader className="relative text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 ring-2 ring-green-200">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-3xl font-bold">
                You're In!
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground mt-2 text-base">
                You secured founder pricing and unlocked the Facebook Group bonus package.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-8 space-y-6">
            {/* Success Details */}
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <Star className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Founding Contractor Badge</p>
                  <p className="text-sm text-muted-foreground mt-1">This appears on your profile and gives you priority placement with homeowners.</p>
                </div>
              </div>
            </div>

            {/* Delivery Callout */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm font-medium text-blue-900">
                📧 Your personalized local Facebook Group list and domination playbook will be sent within 24 hours.
              </p>
            </div>

            {/* What's Next */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">What's Next:</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Check your email for the Facebook bonus package</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Your founder pricing is locked in ($10/month for life)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Start bidding on high-intent jobs</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <Button
              onClick={() => {
                onClose();
                router.push("/dashboard");
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
              size="lg"
            >
              Go To Founder Dashboard
            </Button>
          </div>
        </>
      )}
    </>
  );
}
