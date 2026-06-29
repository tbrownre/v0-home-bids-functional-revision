"use client";

import { useState } from "react";
import { CheckCircle2, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Proposal } from "@/lib/supabase/proposals";
import { formatPrice, statusMeta, viewSummary } from "@/lib/proposal-format";
import { ProposalShareActions } from "@/components/proposal/proposal-share-actions";

export function ContractorProposalCard({ proposal }: { proposal: Proposal }) {
  const [showShare, setShowShare] = useState(false);
  const meta = statusMeta(proposal.status);
  const activity = viewSummary(proposal.view_count, proposal.last_viewed_at);

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{proposal.project_title}</p>
            {proposal.homeowner_name && (
              <p className="truncate text-xs text-muted-foreground">For {proposal.homeowner_name}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${meta.className}`}>
            {meta.label}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-foreground">{formatPrice(proposal.total_price)}</span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            {activity}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 flex-1 gap-1.5 rounded-full text-xs font-semibold"
            onClick={() => setShowShare(true)}
          >
            Share Proposal
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full bg-transparent px-3 text-xs" asChild>
            <a href={`/p/${proposal.share_token}`} target="_blank" rel="noopener noreferrer" aria-label="Preview proposal">
              <ExternalLink className="h-3.5 w-3.5" />
              Preview
            </a>
          </Button>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <ProposalShareActions
            shareToken={proposal.share_token}
            projectTitle={proposal.project_title}
            homeownerPhone={proposal.homeowner_phone}
            pdfUrl={proposal.pdf_url}
            size="compact"
          />
        </div>
      </div>

      {/* Success / ready state */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Your proposal is ready.</DialogTitle>
            <DialogDescription>
              Send this professional proposal link to your customer.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
            <p className="truncate text-xs text-muted-foreground" title={`/p/${proposal.share_token}`}>
              {typeof window !== "undefined" ? window.location.origin : ""}/p/{proposal.share_token}
            </p>
          </div>

          <ProposalShareActions
            shareToken={proposal.share_token}
            projectTitle={proposal.project_title}
            homeownerPhone={proposal.homeowner_phone}
            pdfUrl={proposal.pdf_url}
            size="full"
          />

          <p className="text-center text-[11px] text-muted-foreground">
            The hosted link is the best way to share — your customer can view it on any device.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
