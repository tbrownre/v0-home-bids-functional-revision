"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight, Check, Copy, FileText } from "lucide-react";
import { HOMEBIDS_SMS } from "@/lib/sms-config";
import {
  createResumeSession,
  getBuildBidRoute,
  type NeedsActionContext,
  type ResumeSession,
} from "@/lib/bid-resume";

interface BuildBidChoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Routes the contractor into the existing on-site bid builder flow. */
  onContinueOnSite: () => void;
  /**
   * When provided, the modal switches into "resume an existing draft" mode:
   * the title/subtitle reference the specific bid, and Continue by Text creates
   * a resume session instead of starting a brand-new bid. When omitted, the
   * modal keeps its original generic "build a new bid" behavior.
   */
  context?: NeedsActionContext | null;
}

/**
 * Reusable choice modal shown before any contractor bid-building action.
 *
 * Two modes:
 * - Generic (no `context`): "Continue by Text" is a real SMS link that starts a
 *   new bid, and "Continue on Site" opens the in-app bid builder.
 * - Resume (`context` provided): the modal is tied to a specific saved draft.
 *   "Continue by Text" creates a resume session (HB-XXXX code + mock SMS body)
 *   and shows a confirmation state; "Continue on Site" resumes that exact draft.
 */
export function BuildBidChoiceModal({
  open,
  onOpenChange,
  onContinueOnSite,
  context,
}: BuildBidChoiceModalProps) {
  const isResume = !!context;
  const bidName = context?.title ?? "";

  const [session, setSession] = useState<ResumeSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [openingOnSite, setOpeningOnSite] = useState(false);

  // Reset transient state whenever the modal opens/closes so each launch starts
  // from the choice view.
  useEffect(() => {
    if (!open) {
      setSession(null);
      setCopied(false);
      setOpeningOnSite(false);
    }
  }, [open]);

  function handleContinueByText() {
    if (!context) return;
    // Idempotent per draft — never creates a duplicate draft/session.
    const s = createResumeSession(context);
    setSession(s);
  }

  function handleCopySms() {
    if (!session) return;
    navigator.clipboard?.writeText(session.smsBody).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }

  function handleOnSite() {
    // Backend-ready: once a real build-bid page exists, navigate to
    // getBuildBidRoute(context.draftBidId). For now we resume the in-app builder
    // via onContinueOnSite() with a brief "opening saved draft" confirmation.
    if (isResume && context) {
      console.log("[v0] Continue on Site — target route:", getBuildBidRoute(context.draftBidId));
      setOpeningOnSite(true);
      setTimeout(() => {
        onOpenChange(false);
        onContinueOnSite();
      }, 650);
      return;
    }
    onOpenChange(false);
    onContinueOnSite();
  }

  // ── Resume confirmation state ──────────────────────────────────────────────
  if (isResume && session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-4 w-4 text-primary" />
              </span>
              Text resume ready
            </DialogTitle>
            <DialogDescription>
              Text resume is ready for <span className="font-medium text-foreground">{bidName}</span>. When SMS is
              connected, this will send the contractor a message to continue this saved draft.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Resume code
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {session.resumeCode}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{session.smsBody}</p>
            </div>

            <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={handleCopySms}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy message"}
            </Button>

            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Choice state (generic + resume share this layout) ──────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isResume ? `Finish ${bidName}` : "How do you want to build this bid?"}</DialogTitle>
          <DialogDescription>
            {isResume
              ? "This draft already has project details saved. Continue by text with HomeBids AI or finish it on the site."
              : "Build it by text with HomeBids AI, or continue on the site."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* Recommended: continue by text */}
          {isResume ? (
            <button
              type="button"
              onClick={handleContinueByText}
              className="group relative flex w-full items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
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
                  Resume this saved draft — send pricing, photos, or voice notes.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
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
          )}

          {/* Continue on the existing on-site builder */}
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-3 rounded-xl bg-transparent px-4 py-3 text-left"
            onClick={handleOnSite}
            disabled={openingOnSite}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {isResume ? (
                <FileText className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">
                {openingOnSite ? `Opening saved draft: ${bidName}` : "Continue on Site"}
              </span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {isResume ? "Finish this saved draft in the bid builder." : "Build your bid here in the bid builder."}
              </span>
            </span>
          </Button>

          <p className="px-1 text-center text-[11px] leading-relaxed text-muted-foreground">
            {isResume
              ? "This resumes your saved draft — it won't create a new bid."
              : "Text is usually fastest. Send job details, photos, or voice notes and HomeBids AI will help create the bid."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
