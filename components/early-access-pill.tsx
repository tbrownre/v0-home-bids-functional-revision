"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EarlyAccessModal } from "./early-access-modal";

export function EarlyAccessPill() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <TooltipProvider>
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary/90 px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg backdrop-blur-sm transition-all duration-150 hover:bg-primary hover:shadow-xl active:scale-95 animate-pulse-subtle"
          style={{
            animation: "pulse-subtle 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        >
          <Zap className="h-4 w-4" />
          Early Access
        </button>
      </TooltipProvider>

      <EarlyAccessModal open={showModal} onOpenChange={setShowModal} />

      <style jsx>{`
        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
    </>
  );
}
