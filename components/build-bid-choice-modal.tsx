"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { HOMEBIDS_SMS } from "@/lib/sms-config";

interface BuildBidChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Routes the contractor into the existing on-site bid builder flow. */
  onContinueOnSite: () => void;
}

/**
 * Reusable choice modal shown before any contractor bid-building action.
 * Offers a recommended "Continue by Text" path (real SMS/iMessage link to the
 * HomeBids contractor number) and a "Continue on Site" path into the existing
 * bid builder. Used across all contractor "build/finish/continue bid" CTAs.
 */
export function BuildBidChoiceModal({
  open,
  onOpenChange,
  onContinueOnSite,
}: BuildBidChoiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How do you want to build this bid?</DialogTitle>
          <DialogDescription>
            Build it by text with HomeBids AI, or continue on the site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* Recommended: build by text (real SMS anchor) */}
          <a
            href={HOMEBIDS_SMS.contractor.href}
            onClick={() => onOpenChange(false)}
            className="group relative flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <MessageCircle className="h-5 w-5 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Continue by Text</span>
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground">
                  Recommended
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Usually fastest — send job details, photos, or voice notes.
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
          </a>

          {/* Continue on the existing on-site builder */}
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-3 rounded-xl bg-transparent px-4 py-3 text-left"
            onClick={() => {
              onOpenChange(false);
              onContinueOnSite();
            }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">Continue on Site</span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Build your bid here in the bid builder.
              </span>
            </span>
          </Button>

          <p className="px-1 text-center text-[11px] leading-relaxed text-muted-foreground">
            Text is usually fastest. Send job details, photos, or voice notes and
            HomeBids AI will help create the bid.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
