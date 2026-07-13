"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTRACTOR_SMS_PHONE_NUMBER, getSmsHref } from "@/lib/sms-config";

interface ProposalShareActionsProps {
  shareToken: string;
  projectTitle: string;
  homeownerPhone?: string | null;
  pdfUrl?: string | null;
  /** "full" shows labeled buttons in a grid; "compact" shows smaller pill buttons. */
  size?: "full" | "compact";
}

/** Build the absolute public proposal URL on the client. */
function proposalUrl(shareToken: string) {
  if (typeof window === "undefined") return `/p/${shareToken}`;
  return `${window.location.origin}/p/${shareToken}`;
}

export function ProposalShareActions({
  shareToken,
  projectTitle,
  homeownerPhone,
  pdfUrl,
  size = "full",
}: ProposalShareActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(proposalUrl(shareToken));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  function handleText() {
    // Text the customer their proposal link. If we have their number, target it;
    // otherwise open a blank SMS the contractor can address themselves.
    const body = `Here's your proposal for "${projectTitle}": ${proposalUrl(shareToken)}`;
    const to = homeownerPhone ?? "";
    window.location.href = getSmsHref(to, body);
  }

  function handlePdf() {
    if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  function handleEdit() {
    // The Bid Builder lives in an external SMS workflow. "Edit" opens a text to
    // the HomeBids builder line referencing this proposal.
    window.location.href = getSmsHref(
      CONTRACTOR_SMS_PHONE_NUMBER,
      `I'd like to edit my proposal: ${projectTitle}`,
    );
  }

  if (size === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full bg-transparent px-3 text-xs" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy Link"}
        </Button>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full bg-transparent px-3 text-xs" onClick={handleText}>
          <MessageCircle className="h-3.5 w-3.5" />
          Message Customer
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-full bg-transparent px-3 text-xs disabled:opacity-50"
          onClick={handlePdf}
          disabled={!pdfUrl}
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </Button>
        <Button size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full px-3 text-xs" onClick={handleEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button className="h-11 gap-2 rounded-full font-semibold" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Link Copied" : "Copy Proposal Link"}
      </Button>
      <Button variant="outline" className="h-11 gap-2 rounded-full bg-transparent" onClick={handleText}>
        <MessageCircle className="h-4 w-4" />
        Text Proposal Link
      </Button>
      <Button
        variant="outline"
        className="h-11 gap-2 rounded-full bg-transparent disabled:opacity-50"
        onClick={handlePdf}
        disabled={!pdfUrl}
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
      <Button variant="outline" className="h-11 gap-2 rounded-full bg-transparent" onClick={handleEdit}>
        <Pencil className="h-4 w-4" />
        Edit Proposal
      </Button>
    </div>
  );
}
