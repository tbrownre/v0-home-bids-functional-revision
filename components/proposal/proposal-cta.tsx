"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptProposal, logProposalAction, type ProposalActionEvent } from "@/lib/supabase/proposals";

interface ProposalCtaProps {
  shareToken: string;
  projectTitle: string;
  pdfUrl: string | null;
  company: string;
  initiallyAccepted?: boolean;
  /** Sticky variant pins the primary actions to the bottom on mobile. */
  variant?: "inline" | "sticky";
}

export function ProposalCta({
  shareToken,
  projectTitle,
  pdfUrl,
  company,
  initiallyAccepted = false,
  variant = "inline",
}: ProposalCtaProps) {
  const [accepted, setAccepted] = useState(initiallyAccepted);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(false);

  function track(event: ProposalActionEvent, proposalData?: any) {
    void logProposalAction(shareToken, event, proposalData);
  }

  function celebrate() {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);
    const context = canvas.getContext("2d");
    if (!context) return;
    const width = canvas.width = window.innerWidth * window.devicePixelRatio;
    const height = canvas.height = window.innerHeight * window.devicePixelRatio;
    const particles = Array.from({ length: 90 }, (_, index) => ({
      x: width / 2,
      y: height * 0.38,
      vx: (Math.random() - 0.5) * 18,
      vy: -Math.random() * 16 - 5,
      gravity: 0.45,
      size: 5 + (index % 4),
      color: ["#0A84FF", "#34C759", "#FFCC00", "#FF3B30"][index % 4],
      life: 70 + index % 30,
    }));
    const frame = () => {
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.life -= 1;
        context.fillStyle = particle.color;
        context.fillRect(particle.x, particle.y, particle.size, particle.size);
      });
      if (particles.some((particle) => particle.life > 0)) requestAnimationFrame(frame);
      else canvas.remove();
    };
    requestAnimationFrame(frame);
  }

  async function handleAccept() {
    setIsAccepting(true);
    setAcceptError(false);
    const result = await acceptProposal(shareToken);
    setIsAccepting(false);
    if (!result.ok) {
      setAcceptError(true);
      return;
    }
    setAccepted(true);
    celebrate();
  }

  const questionHref = `sms:+14043952879?body=${encodeURIComponent(
    `Hi! Question about my "${projectTitle}" bid (Bid: ${shareToken}): `,
  )}`;

  function handleQuestion() {
    track("question_clicked");
  }

  function handlePdf() {
    track("pdf_downloaded");
    if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  const content = (
    <div className="mx-auto w-full max-w-2xl">
      {accepted ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
          <h3 className="text-lg font-semibold text-foreground">You&apos;re all set! 🎉</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ve notified {company} - they&apos;ll text you shortly to schedule.
          </p>
          <Button size="lg" className="mt-4 h-12 w-full rounded-full" disabled>
            Approved ✓
          </Button>
        </div>
      ) : (
        <>
          <Button
            size="lg"
            className="h-14 w-full gap-2 rounded-full text-base font-semibold shadow-sm"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            <CheckCircle2 className="h-5 w-5" />
            {isAccepting ? "Approving…" : "Accept This Proposal"}
          </Button>
          {acceptError && (
            <div className="mt-2 flex items-center justify-center gap-2 text-sm text-destructive">
              <span>Couldn&apos;t approve - try again</span>
              <button type="button" className="font-medium underline" onClick={handleAccept}>Retry</button>
            </div>
          )}
        </>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          className="h-11 gap-2 rounded-full bg-transparent"
          asChild
        >
          <a href={questionHref} onClick={handleQuestion}>
            <MessageCircle className="h-4 w-4" />
            Ask a Question
          </a>
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
