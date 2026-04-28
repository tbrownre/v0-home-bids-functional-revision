"use client";

import { useState, useEffect } from "react";
import { FullScreenPresaleModal } from "./full-screen-presale-modal";
import { Zap, X } from "lucide-react";

export function PresaleGate() {
  // Start with modal open to ensure it shows on first load
  const [showModal, setShowModal] = useState(true);
  const [showPill, setShowPill] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user has already dismissed presale
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("presaleDismissed");
      const pillDismissed = sessionStorage.getItem("pillDismissed");

      if (dismissed) {
        // User dismissed modal before - hide modal, maybe show pill
        setShowModal(false);
        if (!pillDismissed) {
          setShowPill(true);
        }
      } else {
        // First visit - show modal
        setShowModal(true);
      }
    }
  }, []);

  const handleModalClose = () => {
    setShowModal(false);
    setShowPill(true);
    // Mark that user dismissed the full-screen modal
    if (typeof window !== "undefined") {
      sessionStorage.setItem("presaleDismissed", "true");
    }
  };

  const handlePillClose = () => {
    setShowPill(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pillDismissed", "true");
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Full-screen presale modal on first load */}
      <FullScreenPresaleModal
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            handleModalClose();
          }
        }}
      />

      {/* Floating pill if user dismissed modal */}
      {showPill && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg backdrop-blur-sm">
          <Zap className="h-4 w-4 shrink-0" />
          <button
            onClick={() => {
              setShowPill(false);
              setShowModal(true);
              sessionStorage.removeItem("presaleDismissed");
            }}
            className="hover:underline cursor-pointer"
          >
            Back to Presale
          </button>
          <button
            onClick={handlePillClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
