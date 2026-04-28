"use client";

import { useState } from "react";
import { Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FoundingContractorPresalePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const handleNextStep = () => {
    setStep((prev) => (prev < 4 ? (prev + 1) as any : prev));
  };

  // Step 1: Landing / Offer Page
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/50 border border-amber-200 px-3 py-1 mb-4">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-800">Founding Contractor Presale</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Lock In Founder Pricing <span className="text-amber-600">For Life</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Get unlimited bidding at $10/month (regularly $79/month). Includes exclusive Facebook Group growth bonuses.
            </p>
          </div>

          {/* Offer Card */}
          <div className="rounded-2xl border-2 border-amber-300/50 bg-gradient-to-br from-amber-50/80 to-orange-50/60 p-8 md:p-12 shadow-lg mb-8">
            {/* Price Highlight */}
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">Founding Contractor Plan</p>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-5xl font-bold text-amber-700">$10</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-lg text-amber-600 line-through">$79/month</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                  87% Off
                </span>
              </div>
              <p className="text-sm text-amber-800 font-medium">Billed today • Access locked in for life</p>
            </div>

            {/* What You Get */}
            <div className="space-y-4 mb-8 pt-8 border-t border-amber-200/50">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">What's Included</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Unlimited bidding on all home projects</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Featured placement on homeowner jobs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Founding Contractor badge + priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Future Elite plan access included ($79/month value)</span>
                </li>
              </ul>
            </div>

            {/* Bonus Stack */}
            <div className="space-y-4 pt-8 border-t border-amber-200/50">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Bonus: Facebook Group Growth Package</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground"><strong>Personalized Local Facebook Group List</strong> — Exact groups to target your market</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground"><strong>Facebook Domination Playbook</strong> — Complete strategy to build authority and leads</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground"><strong>Done-For-You Group Post Templates</strong> — Ready-to-use content to get started immediately</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">Many contractors are replacing expensive lead gen with this Facebook strategy — now included free with your founding plan.</p>
            </div>

            {/* Urgency */}
            <div className="mt-8 pt-8 border-t border-amber-200/50">
              <div className="rounded-lg bg-red-50/50 border border-red-200 p-4 mb-8">
                <p className="text-sm font-medium text-red-900">
                  Limited founding spots available per market. Once 50 Founding Contractors sign up in your area, presale pricing closes forever.
                </p>
              </div>

              <Button 
                onClick={handleNextStep}
                size="lg"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6 text-lg"
              >
                Claim My Founding Spot
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Takes less than 60 seconds. No payment required yet.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Secure your founder pricing before this market fills up.</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Confirmation Screen
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Confirm Your Founding Contractor Access
            </h1>
            <p className="text-lg text-muted-foreground">
              You&apos;re one step away from locking in lifetime pricing.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="rounded-2xl border border-border bg-white p-8 mb-8 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 shrink-0 mt-1">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Founding Contractor Plan</h3>
                <p className="text-sm text-muted-foreground">$10/month locked pricing for life</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 shrink-0 mt-1">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Facebook Group Bonus Access Included</h3>
                <p className="text-sm text-muted-foreground">Group list, playbook, and templates delivered within 24 hours</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border-2 border-amber-300/50 bg-amber-50/50 p-8 mb-8">
            <h3 className="font-semibold text-foreground mb-4">You Are Locking In:</h3>
            <ul className="space-y-3 text-sm mb-6">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-amber-600" />
                <span className="text-foreground">$10/month lifetime founder pricing</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-amber-600" />
                <span className="text-foreground">Future $79 Elite plan access included</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-amber-600" />
                <span className="text-foreground">Local Facebook group bonus package</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-amber-600" />
                <span className="text-foreground">Founding Contractor badge on your profile</span>
              </li>
            </ul>

            <div className="pt-6 border-t border-amber-200">
              <p className="text-xs text-amber-800 mb-4">
                Next step: Add your details and payment. Processing takes less than 60 seconds.
              </p>
              <Button 
                onClick={handleNextStep}
                size="lg"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6"
              >
                Continue To Secure My Spot
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Checkout (redirect to existing checkout with params)
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Complete Your Order
            </h1>
            <p className="text-lg text-muted-foreground">
              Secure your founding contractor access with payment.
            </p>
          </div>

          {/* Order Summary */}
          <div className="rounded-2xl border border-border bg-white p-8 mb-8">
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-foreground font-medium">Founding Contractor Plan</span>
                <span className="text-2xl font-bold text-amber-600">$10.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Tax & Fees</span>
                <span className="text-foreground">TBD at checkout</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              You will be charged $10 today and then $10/month. This rate is locked in for life as long as you remain active.
            </p>

            <Link href="/subscribe?type=contractor&plan=contractor-founding&early_access=true&founding_contractor=true">
              <Button 
                size="lg"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6 text-lg"
              >
                Pay $10 & Secure Founder Access
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Once payment is processed, you&apos;ll be taken to your founder dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Step 4: Success Screen (would be reached after payment)
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-8 mx-auto">
          <Check className="h-10 w-10 text-green-600" />
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-4">
          You&apos;re In — Founding Contractor Access Secured
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          Congratulations! You&apos;ve locked in lifetime founder pricing.
        </p>

        {/* Confirmation Details */}
        <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-8 mb-8 text-left">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Founding Contractor Badge</h3>
                <p className="text-sm text-muted-foreground">Visible on your profile to all homeowners</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Your Facebook Group Bonus Will Arrive Within 24 Hours</h3>
                <p className="text-sm text-muted-foreground">Check your email for the complete group list, playbook, and templates</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Elite Access Locked In For Life</h3>
                <p className="text-sm text-muted-foreground">$10/month founder rate guaranteed as long as you stay active</p>
              </div>
            </div>
          </div>
        </div>

        <Link href="/contractors/dashboard">
          <Button 
            size="lg"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6 text-lg mb-4"
          >
            Go To Founder Dashboard
          </Button>
        </Link>

        <p className="text-sm text-muted-foreground">
          Start finding high-intent jobs in your area. Your founding spot is reserved.
        </p>
      </div>
    </div>
  );
}
