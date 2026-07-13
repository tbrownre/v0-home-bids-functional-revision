"use client";

import { CheckCircle2, MessageCircle, Phone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logProposalAction, type ProposalActionEvent } from "@/lib/supabase/proposals";
import { PROPOSAL_SMS } from "@/lib/proposal-format";
import { getSmsHref } from "@/lib/sms-config";

interface ProposalCtaProps {
  shareToken: string;
  contractorPhone: string | null;
  pdfUrl: string | null;
  /** Sticky variant pins the primary actions to the bottom on mobile. */
  variant?: "inline" | "sticky";
}

export function ProposalCta({
  shareToken,
  contractorPhone,
  pdfUrl,
  variant = "inline",
}: ProposalCtaProps) {
  // Fire-and-forget tracking, then perform the navigation. We don't block the
  // user action on the network — tracking is best-effort.
  function track(event: ProposalActionEvent) {
    void logProposalAction(shareToken, event);
  }

  function handleAccept() {
    track("accepted_clicked");
    if (contractorPhone) window.location.href = getSmsHref(contractorPhone, PROPOSAL_SMS.accept);
  }

  function handleQuestion() {
    track("question_clicked");
    if (contractorPhone) window.location.href = getSmsHref(contractorPhone, PROPOSAL_SMS.question);
  }

  function handleCall() {
    track("call_clicked");
    if (contractorPhone) window.location.href = `tel:${contractorPhone}`;
  }

  function handlePdf() {
    track("pdf_downloaded");
    if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  const hasPhone = Boolean(contractorPhone);

  const content = (
    <div className="mx-auto w-full max-w-2xl">
      <Button
        size="lg"
        className="h-14 w-full gap-2 rounded-full text-base font-semibold shadow-sm"
        onClick={handleAccept}
        disabled={!hasPhone}
      >
        <CheckCircle2 className="h-5 w-5" />
        Accept This Proposal
      </Button>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          variant="outline"
          className="h-11 gap-2 rounded-full bg-transparent"
          onClick={handleQuestion}
          disabled={!hasPhone}
        >
          <MessageCircle className="h-4 w-4" />
          Ask / Request Changes
        </Button>
        <Button
          variant="outline"
          className="h-11 gap-2 rounded-full bg-transparent"
          onClick={handleCall}
          disabled={!hasPhone}
        >
          <Phone className="h-4 w-4" />
          Call Contractor
        </Button>
        <Button
          variant="outline"
          className="h-11 gap-2 rounded-full bg-transparent"
          onClick={handlePdf}
          disabled={!pdfUrl}
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
        Accepting sends a text to your contractor to confirm intent. It is not a binding contract.
      </p>
    </div>
  );

  if (variant === "sticky") {
    return (
      <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {content}
      </div>
    );
  }

  return content;
}
