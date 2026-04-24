"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface EarlyAccessHomeonerFlowProps {
  onBack: () => void;
  onClose: () => void;
}

export function EarlyAccessHomeonerFlow({ onBack, onClose }: EarlyAccessHomeonerFlowProps) {
  return (
    <>
      <div className="relative bg-gradient-to-br from-blue-50/50 via-background to-transparent px-6 pt-8 pb-6">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-semibold">
            Early Access for Homeowners
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Lock in your pricing before public launch.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="px-6 py-8 space-y-6">
        {/* Pricing Card */}
        <div className="rounded-xl border-2 border-green-200/50 bg-green-50/30 p-6">
          <h3 className="font-semibold text-foreground mb-2">Early Access Pricing</h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-green-700">$9.99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground mb-4">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">+</span>
              <span>3-day free trial</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">+</span>
              <span>Post unlimited home projects</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">+</span>
              <span>Receive bids from verified contractors</span>
            </li>
          </ul>
          <p className="text-xs text-green-700 font-medium bg-green-100/50 rounded-lg px-3 py-2 mb-4">
            🔒 Lock in this rate before public pricing updates
          </p>
          <Link href="/homeowners/signup?type=early_access">
            <Button className="w-full">
              Start Free Trial
            </Button>
          </Link>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Benefits</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Less competition on jobs
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Shape how HomeBids evolves
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Limited early users per market
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>Cancel anytime • No commitment during trial</p>
        </div>
      </div>
    </>
  );
}
