"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { acceptProposal, logProposalAction, type ProposalActionEvent } from "@/lib/supabase/proposals";

interface ProposalCtaProps {
  shareToken: string;
  projectTitle: string;
  pdfUrl: string | null;
  company: string;
  /** Null for bids the contractor shared themselves (no marketplace job). */
  jobId?: string | null;
  homeownerName?: string | null;
  homeownerPhone?: string | null;
  initiallyAccepted?: boolean;
  /** Sticky variant pins the primary actions to the bottom on mobile. */
  variant?: "inline" | "sticky";
}

export function ProposalCta({
  shareToken,
  projectTitle,
  pdfUrl,
  company,
  jobId = null,
  homeownerName = null,
  homeownerPhone = null,
  initiallyAccepted = false,
  variant = "inline",
}: ProposalCtaProps) {
  const [accepted, setAccepted] = useState(initiallyAccepted);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(false);
  const [ownerLink, setOwnerLink] = useState<string | null>(null);
  // Inline question fallback — used when there is no owner inbox link.
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState("");
  const [askSending, setAskSending] = useState(false);
  const [askSent, setAskSent] = useState(false);
  const [askError, setAskError] = useState(false);

  // Own-customer contact capture — only for job_id-null bids that don't yet
  // have a homeowner phone on file.
  const needsContact = jobId === null && !homeownerPhone;
  const [contactSaved, setContactSaved] = useState(false);
  const [contactName, setContactName] = useState(homeownerName ?? "");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [contactBadPhone, setContactBadPhone] = useState(false);

  async function saveContact(): Promise<boolean> {
    const name = contactName.trim();
    const phone = contactPhone.trim();
    setContactSaving(true);
    setContactBadPhone(false);
    const { data, error } = await createClient().rpc("submit_proposal_contact", {
      p_share_token: shareToken,
      p_name: name || null,
      p_phone: phone,
    });
    setContactSaving(false);
    const result = data as { ok?: boolean; error?: string } | null;
    if (!error && result?.ok) {
      setContactSaved(true);
      return true;
    }
    if (result?.error === "bad_phone") setContactBadPhone(true);
    return false;
  }

  useEffect(() => {
    let active = true;
    createClient()
      .rpc("get_owner_link", { p_share_token: shareToken })
      .then(({ data, error }) => {
        if (active && !error && typeof data === "string" && data) setOwnerLink(data);
      });
    return () => {
      active = false;
    };
  }, [shareToken]);

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

  function handleQuestion() {
    track("question_clicked");
  }

  async function submitQuestion() {
    const question = askText.trim();
    if (!question || askSending) return;
    setAskSending(true);
    setAskError(false);

    // For own-customer bids, capture the homeowner's contact before the
    // question so the contractor can reply. Abort if the phone is invalid.
    if (needsContact && !contactSaved) {
      const saved = await saveContact();
      if (!saved) {
        setAskSending(false);
        return;
      }
    }

    const { data, error } = await createClient().rpc("ask_from_proposal", {
      p_share_token: shareToken,
      p_question: question,
    });
    setAskSending(false);
    if (!error && (data as { ok?: boolean } | null)?.ok) {
      track("question_clicked");
      setAskSent(true);
      setAskText("");
    } else {
      setAskError(true);
    }
  }

  function handlePdf() {
    track("pdf_downloaded");
    if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  const content = (
    <div className="mx-auto w-full max-w-2xl">
      {accepted ? (
        needsContact && !contactSaved ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="text-center text-lg font-semibold text-foreground">
              You approved {company}&apos;s bid 🎉 — where should they reach you?
            </h3>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              />
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="Phone number"
                className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              />
              {contactBadPhone && (
                <p className="text-sm text-destructive">Please enter a valid phone number.</p>
              )}
              <Button
                size="lg"
                className="h-12 w-full rounded-full font-semibold"
                onClick={saveContact}
                disabled={contactSaving || !contactPhone.trim()}
              >
                {contactSaving ? "Sending…" : "Share my contact"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
            <h3 className="text-lg font-semibold text-foreground">You&apos;re all set! 🎉</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {jobId === null
                ? `We've sent your contact to ${company} - they'll reach out shortly.`
                : `We've notified ${company} - they'll text you shortly to schedule.`}
            </p>
            <Button size="lg" className="mt-4 h-12 w-full rounded-full" disabled>
              Approved ✓
            </Button>
          </div>
        )
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
        {ownerLink ? (
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-full bg-transparent"
            asChild
          >
            <a href={`${ownerLink}#messages`} onClick={handleQuestion}>
              <MessageCircle className="h-4 w-4" />
              Ask a Question
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-full bg-transparent"
            onClick={() => setAskOpen((open) => !open)}
            aria-expanded={askOpen}
          >
            <MessageCircle className="h-4 w-4" />
            Ask a Question
          </Button>
        )}
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

      {!ownerLink && askOpen && (
        <div className="mt-3 rounded-2xl border border-border bg-muted/40 p-4">
          {askSent ? (
            <p className="text-center text-sm font-semibold text-foreground">
              Sent to {company}
            </p>
          ) : (
            <>
              <label htmlFor="proposal-question" className="text-sm font-medium text-foreground">
                Ask {company} a question
              </label>
              {needsContact && !contactSaved && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                  />
                  {contactBadPhone && (
                    <p className="text-sm text-destructive">Please enter a valid phone number.</p>
                  )}
                </div>
              )}
              <textarea
                id="proposal-question"
                rows={3}
                value={askText}
                onChange={(event) => setAskText(event.target.value)}
                placeholder={`Question about "${projectTitle}"…`}
                className="mt-2 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              />
              {askError && (
                <p className="mt-1 text-sm text-destructive">Couldn&apos;t send - try again.</p>
              )}
              <Button
                onClick={submitQuestion}
                disabled={askSending || !askText.trim() || (needsContact && !contactSaved && !contactPhone.trim())}
                className="mt-2 h-11 w-full rounded-full font-semibold"
              >
                {askSending ? "Sending…" : "Send question"}
              </Button>
            </>
          )}
        </div>
      )}

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
