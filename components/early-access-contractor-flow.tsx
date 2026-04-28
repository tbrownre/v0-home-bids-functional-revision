"use client";

import { ChevronLeft, Star, Loader2, Check, TrendingUp, Users, BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";

interface EarlyAccessContractorFlowProps {
  onBack: () => void;
  onClose: () => void;
}

export function EarlyAccessContractorFlow({ onBack, onClose }: EarlyAccessContractorFlowProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    checkAuth();
  }, []);

  const handleClaimOffer = async () => {
    if (!agreedToTerms) return;
    setIsLoading(true);
    
    // Store early access params in session for checkout/signup
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('earlyAccessParams', JSON.stringify({
        role: 'contractor',
        plan: 'contractor-elite',
        earlyAccess: true,
        foundingContractor: true,
      }));
    }
    
    if (!user) {
      // Not authenticated - redirect to subscribe page
      router.push(`/subscribe?type=contractor&plan=contractor-elite&early_access=true&founding_contractor=true`);
    } else {
      // Already authenticated - redirect to subscribe/checkout
      router.push(`/subscribe?type=contractor&plan=contractor-elite&early_access=true&founding_contractor=true`);
    }
  };

  return (
    <>
      <div className="relative bg-gradient-to-br from-orange-50/50 via-background to-transparent px-6 pt-8 pb-6">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-semibold">
            Founding Contractor Presale
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Lock in lifetime pricing before we go public.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="px-6 py-8 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
        {/* Main Offer Card */}
        <div className="rounded-xl border-2 border-amber-300/60 bg-gradient-to-br from-amber-50/80 to-orange-50/60 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-600" />
              <h3 className="font-bold text-lg text-foreground">Founding Contractor Status</h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900">
              LIMITED SPOTS
            </span>
          </div>

          {/* Pricing Highlight */}
          <div className="mb-6 pt-4 border-t border-amber-200/40">
            <p className="text-sm text-muted-foreground mb-2">Presale Pricing (Locked for Life)</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-amber-700">$10</span>
              <span className="text-muted-foreground">/month</span>
              <span className="text-sm text-amber-600 line-through">$79/month</span>
            </div>
            <p className="text-xs text-amber-700 font-medium mt-2">87% lifetime savings vs. regular pricing</p>
          </div>

          {/* What You Get */}
          <div className="space-y-2 mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Includes</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-600" />
                <span>Featured placement on homeowner jobs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-600" />
                <span>Founding Contractor badge on profile</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-600" />
                <span>Unlimited bidding (normally $79/mo)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-600" />
                <span>3-day free trial</span>
              </li>
            </ul>
          </div>

          {/* Bonuses Section */}
          <div className="rounded-lg bg-white/50 border border-amber-100 p-4 mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              + Founding Contractor Bonus Stack
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <BookOpen className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Facebook Group Growth Playbook</p>
                  <p className="text-xs text-muted-foreground">Complete guide to building your local reputation</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Private Founding Contractor Community</p>
                  <p className="text-xs text-muted-foreground">Network with elite contractors from your market</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Market Dominance Strategy Calls</p>
                  <p className="text-xs text-muted-foreground">Monthly group coaching on bid strategy & growth</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Lock className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Price Lock Guarantee</p>
                  <p className="text-xs text-muted-foreground">$10/month as long as you stay active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Urgency Message */}
          <div className="rounded-lg bg-orange-100/50 border border-orange-200 p-3 mb-6">
            <p className="text-sm text-orange-900 font-medium">
              Once your market reaches 50 Founding Contractors, presale closes forever.
            </p>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3 mb-6 p-3 rounded-lg bg-muted/30">
            <Checkbox 
              id="presale-terms"
              checked={agreedToTerms}
              onCheckedChange={setAgreedToTerms}
              className="mt-1"
            />
            <label htmlFor="presale-terms" className="text-xs text-muted-foreground cursor-pointer">
              I understand this is a presale offer. I agree to claim Founding Contractor status and lock in $10/month pricing.
            </label>
          </div>

          {/* CTA Button */}
          <Button 
            onClick={handleClaimOffer}
            disabled={isLoading || !agreedToTerms}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            size="lg"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLoading ? "Claiming your spot…" : "Claim Founding Contractor Status"}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Only 60 seconds to complete. Cancel anytime during trial.
          </p>
        </div>

        {/* Why Now Section */}
        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm font-semibold text-foreground">Why claim now?</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-amber-600 font-bold">1.</span>
              <span>Limited founding spots — first come, first served per market</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-600 font-bold">2.</span>
              <span>Price locked for life as long as you stay active</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-600 font-bold">3.</span>
              <span>Founding badge gives you instant credibility with homeowners</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
