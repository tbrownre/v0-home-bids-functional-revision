"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { EarlyAccessModal } from "./early-access-modal";

export function EarlyAccessPill() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Fixed button - guaranteed visibility */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 md:bottom-6 md:right-6 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg backdrop-blur-sm transition-all duration-150 hover:bg-primary/90 hover:shadow-xl active:scale-95"
        aria-label="Open early access offer"
      >
        <Zap className="h-4 w-4 shrink-0" />
        <span>Early Access</span>
      </button>

      <EarlyAccessModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
