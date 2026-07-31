"use client";

import { Home, Wrench } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { HOMEBIDS_SMS, isSmsCapableDevice } from "@/lib/sms-config";
import { useContractorLogoHref } from "@/lib/use-contractor-logo-href";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

/**
 * Role Picker Modal — the single source of truth for "Try for Free" routing.
 * Opens when user clicks "Try for Free" from anywhere on the site.
 * Routes to homeowner SMS or contractor signup based on selection.
 */
export function RolePickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const logoHref = useContractorLogoHref();

  const handleHomeowner = () => {
    onClose();
    localStorage.setItem("homebids_audience", "homeowner");
    // On SMS-capable devices (phones, Mac with Messages) open the native SMS
    // thread. On other devices, route to the homeowner experience page.
    if (isSmsCapableDevice()) {
      window.location.href = HOMEBIDS_SMS.homeowner.href;
    } else {
      window.location.href = "/new-job";
    }
  };

  const handlePro = () => {
    onClose();
    localStorage.setItem("homebids_audience", "contractor");
    window.location.href = "/contractors/signup";
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
          <DialogContent
            className="sm:max-w-md overflow-hidden rounded-3xl p-0 border-0"
            style={{
              background: "linear-gradient(160deg, #ffffff 0%, #f0f4ff 100%)",
              boxShadow: "0 32px 80px rgba(10,132,255,0.18), 0 8px 24px rgba(0,0,0,0.10)",
            }}
          >
            <div className="flex flex-col items-center px-8 pt-8 pb-8">

              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <HomeBidsLogo 
                  size="32px" 
                  href={logoHref} 
                />
              </div>

              {/* Question */}
              <p className="mb-7 text-center text-[22px] font-extrabold leading-tight tracking-tight text-foreground">
                Are you a homeowner or a home service professional?
              </p>

              {/* Choice cards */}
              <div className="flex w-full flex-col gap-3">

                {/* Homeowner card */}
                <button
                  type="button"
                  onClick={handleHomeowner}
                  className="group relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-2xl border border-[#0A84FF]/20 bg-white px-5 py-5 text-center shadow-sm transition-all duration-200 hover:border-[#0A84FF]/60 hover:shadow-[0_4px_20px_rgba(10,132,255,0.18)] active:scale-[0.98]"
                >
                  {/* Icon */}
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #0A84FF, #34aaff)" }}
                  >
                    <Home className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-[15px] font-bold text-foreground">{"I'm a Homeowner"}</p>
                    <p className="text-xs text-muted-foreground">Get bids from verified pros via text</p>
                  </div>

                  {/* Hover shimmer */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "linear-gradient(100deg, transparent 40%, rgba(10,132,255,0.04) 100%)" }}
                  />
                </button>

                {/* Contractor card */}
                <button
                  type="button"
                  onClick={handlePro}
                  className="group relative flex w-full flex-col items-center gap-3 overflow-hidden rounded-2xl border border-foreground/10 bg-white px-5 py-5 text-center shadow-sm transition-all duration-200 hover:border-foreground/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] active:scale-[0.98]"
                >
                  {/* Icon */}
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110"
                    style={{ background: "linear-gradient(135deg, #1c1c1e, #3a3a3c)" }}
                  >
                    <Wrench className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-[15px] font-bold text-foreground">{"I'm a Home Service Pro"}</p>
                    <p className="text-xs text-muted-foreground">Build winning bids with AI</p>
                  </div>

                  {/* Hover shimmer */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "linear-gradient(100deg, transparent 40%, rgba(0,0,0,0.025) 100%)" }}
                  />
                </button>
              </div>

              {/* Trust line */}
              <p className="mt-5 text-center text-[11px] text-muted-foreground/60">
                No app download required &middot; Free to start &middot; Cancel anytime
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
