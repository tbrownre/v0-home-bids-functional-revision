"use client";

import { Home, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface EarlyAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EarlyAccessModal({ open, onOpenChange }: EarlyAccessModalProps) {
  const router = useRouter();

  const handleSelect = (role: "homeowner" | "contractor") => {
    onOpenChange(false);
    if (role === "homeowner") {
      router.push("/subscribe?type=homeowner");
    } else {
      router.push("/subscribe?type=contractor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <div className="px-6 pt-8 pb-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-semibold">
              Get Started with HomeBids
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mt-2">
              Are you a homeowner looking for bids, or a contractor looking for work?
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {/* Homeowner */}
            <button
              onClick={() => handleSelect("homeowner")}
              className="relative rounded-xl border-2 border-border p-6 text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-95"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">Homeowner</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Post your project and receive bids from local pros.
              </p>
              <span className="inline-flex text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                Post a Project
              </span>
            </button>

            {/* Contractor */}
            <button
              onClick={() => handleSelect("contractor")}
              className="relative rounded-xl border-2 border-border p-6 text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-95"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Briefcase className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-foreground">Contractor</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Find high-intent jobs and grow your business.
              </p>
              <span className="inline-flex text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                View Jobs
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
