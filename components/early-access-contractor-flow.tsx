"use client";

import { ChevronLeft, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EarlyAccessContractorFlowProps {
  onBack: () => void;
  onClose: () => void;
}

const PLANS = [
  {
    id: "contractor-starter",
    name: "Starter",
    price: "$9.99",
    perBid: "$10 per bid",
    description: "Perfect for getting started",
  },
  {
    id: "contractor-pro",
    name: "Pro",
    price: "$29",
    perBid: "$7 per bid",
    description: "Most popular choice",
  },
  {
    id: "contractor-elite",
    name: "Elite",
    price: "$79",
    perBid: "$0 per bid",
    description: "Unlimited bidding included",
  },
];

export function EarlyAccessContractorFlow({ onBack, onClose }: EarlyAccessContractorFlowProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    checkAuth();
  }, []);

  const handleChoosePlan = async (planId: string) => {
    setLoadingPlan(planId);
    
    // Store early access params in session for checkout/signup
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('earlyAccessParams', JSON.stringify({
        role: 'contractor',
        plan: planId,
        earlyAccess: true,
      }));
    }
    
    if (!user) {
      // Not authenticated - redirect to signup with early access params
      router.push(`/signup?role=contractor&plan=${planId}&early_access=true`);
    } else {
      // Already authenticated - redirect to checkout
      router.push(`/checkout?plan=${planId}&early_access=true&role=contractor`);
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
            Early Access for Contractors
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Lock in your pricing and claim Founding Contractor status.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="px-6 py-8 space-y-6">
        {/* Founding Contractor Section */}
        <div className="rounded-xl border-2 border-amber-200/50 bg-amber-50/30 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-foreground">Founding Contractor Status</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Join early and become a Founding Contractor in your area.
          </p>
          <ul className="space-y-2 text-sm mb-4">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              <span>Featured placement on homeowner jobs</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              <span>Higher visibility on bids</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              <span>More opportunities before competition increases</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              <span>Founding badge on your profile</span>
            </li>
          </ul>
          <p className="text-xs text-amber-700 font-medium bg-amber-100/50 rounded-lg px-3 py-2">
            Limited founding spots per market
          </p>
        </div>

        {/* Pricing Section */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-4">
            Early Access Pricing — Lock this in now
          </p>
          <div className="space-y-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground">{plan.name}</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleChoosePlan(plan.id)}
                    disabled={loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    {loadingPlan === plan.id ? "Loading..." : "Choose Plan"}
                  </Button>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-lg font-bold text-primary">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.perBid}</span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mt-3">
            🔒 Your rate is locked as long as you stay active
          </p>
        </div>

        {/* Urgency */}
        <div className="pt-4 border-t space-y-3">
          <p className="text-sm text-amber-700 font-medium">
            Once your market fills, Founding status will no longer be available.
          </p>
          <p className="text-xs text-muted-foreground">
            Takes less than 60 seconds to get started
          </p>
        </div>
      </div>
    </>
  );
}
