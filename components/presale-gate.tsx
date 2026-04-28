"use client";

import { useState, useEffect } from "react";
import { FullScreenPresaleModal } from "./full-screen-presale-modal";
import { Zap, X } from "lucide-react";

export function PresaleGate() {
  const [showModal, setShowModal] = useState(false);
  const [showPill, setShowPill] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user has already dismissed presale
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("presaleDismissed");
      const hasSeen = sessionStorage.getItem("presaleSeen");

      if (!dismissed && !hasSeen) {
        // Show full-screen modal on first load
        setShowModal(true);
        sessionStorage.setItem("presaleSeen", "true");
      } else if (dismissed && !sessionStorage.getItem("pillDismissed")) {
        // Show floating pill if user dismissed modal before
        setShowPill(true);
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

  if (!mounted) return null;

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
