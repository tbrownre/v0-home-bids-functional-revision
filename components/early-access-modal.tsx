"use client";

import { useState } from "react";
import { Zap, Home, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EarlyAccessHomeonerFlow } from "./early-access-homeowner-flow";
import { EarlyAccessContractorFlow } from "./early-access-contractor-flow";

interface EarlyAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EarlyAccessModal({ open, onOpenChange }: EarlyAccessModalProps) {
  const [step, setStep] = useState<"role-select" | "homeowner" | "contractor">(
    "role-select"
  );

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setStep("role-select"), 200);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleClose();
    }}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 max-h-[90vh] overflow-y-auto">
        {step === "role-select" ? (
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-8 pb-6 rounded-t-lg">
            <DialogHeader className="relative">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-semibold">
                Get Early Access to HomeBids
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground mt-2">
                Lock in your pricing and position before public launch.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 px-6 pb-8">
              {/* Homeowner Card */}
              <button
                onClick={() => setStep("homeowner")}
                className="relative rounded-xl border-2 border-border p-6 text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-95"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Homeowner</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Post projects. Get multiple bids. Choose the best.
                </p>
                <span className="inline-flex text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  Continue as Homeowner →
                </span>
              </button>

              {/* Contractor Card */}
              <button
                onClick={() => setStep("contractor")}
                className="relative rounded-xl border-2 border-border p-6 text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-95"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <Briefcase className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Contractor</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Get high-intent jobs and grow your business.
                </p>
                <span className="inline-flex text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  Continue as Contractor →
                </span>
              </button>
            </div>
          </div>
        ) : step === "homeowner" ? (
          <EarlyAccessHomeonerFlow onBack={() => setStep("role-select")} onClose={handleClose} />
        ) : (
          <EarlyAccessContractorFlow onBack={() => setStep("role-select")} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
