"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MessageCircle,
  MapPin,
  Clock,
  DollarSign,
  User,
  FileText,
  Loader2,
  ChevronRight,
  Shield,
  AlertTriangle,
  Wrench,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import { USE_MOCK_DATA } from "@/lib/mock-auth";
import { getBidById, updateBidStatus, saveHomeownerQuestion, type BidStatus } from "@/lib/supabase/actions";
import { getBidById as getDemoBidById, updateBidStatus as demoUpdateBidStatus, saveHomeownerQuestion as demoSaveQuestion } from "@/lib/demo/services";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BidRecord {
  id: string;
  job_id: string;
  contractor_id: string;
  amount: number;
  message: string;
  timeline?: string | null;
  status: string;
  created_at: string;
  scope_of_work?: string | null;
  line_items?: LineItem[] | null;
  assumptions?: string | null;
  exclusions?: string | null;
  payment_terms?: string | null;
  next_steps?: string | null;
  jobs?: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    urgency?: string | null;
    budget_min?: number | null;
    budget_max?: number | null;
  } | null;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
}

interface LineItem {
  description: string;
  amount: number;
}

type ViewState = "reviewing" | "approved" | "declined" | "question_sent";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft:          { label: "Draft",            className: "bg-muted text-muted-foreground" },
  ready_to_send:  { label: "Ready to Send",    className: "bg-blue-50 text-blue-700" },
  sent:           { label: "Awaiting Review",  className: "bg-amber-50 text-amber-700" },
  question_asked: { label: "Question Asked",   className: "bg-purple-50 text-purple-700" },
  approved:       { label: "Approved",         className: "bg-green-50 text-green-700" },
  declined:       { label: "Declined",         className: "bg-red-50 text-red-700" },
  completed:      { label: "Completed",        className: "bg-green-50 text-green-700" },
  // legacy statuses from submitBid flow
  pending:        { label: "Awaiting Review",  className: "bg-amber-50 text-amber-700" },
  accepted:       { label: "Approved",         className: "bg-green-50 text-green-700" },
  rejected:       { label: "Declined",         className: "bg-red-50 text-red-700" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProposalPage() {
  const { bidId } = useParams<{ bidId: string }>();
  const [bid, setBid] = useState<BidRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>("reviewing");
  const [question, setQuestion] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  const isDemo = USE_MOCK_DATA || (bidId?.startsWith("cbid-") ?? false) || (bidId?.startsWith("demo-") ?? false);

  useEffect(() => {
    if (!bidId) return;
    const fetcher = isDemo ? getDemoBidById(bidId) : getBidById(bidId);
    fetcher.then(({ bid: b, error: err }) => {
      if (err || !b) setError(err ?? "Bid not found");
      else setBid(b as BidRecord);
      setLoading(false);
    });
  }, [bidId, isDemo]);

  const handleApprove = async () => {
    if (!bid) return;
    // TODO: verify caller is the homeowner linked to this bid's job
    const fn = isDemo ? demoUpdateBidStatus : updateBidStatus;
    await fn(bid.id, "approved" as BidStatus);
    setViewState("approved");
    // TODO: notify contractor via SMS/email webhook
  };

  const handleDecline = async () => {
    if (!bid) return;
    const fn = isDemo ? demoUpdateBidStatus : updateBidStatus;
    await fn(bid.id, "declined" as BidStatus);
    setViewState("declined");
    // TODO: send optional declineReason to contractor
  };

  const handleQuestion = async () => {
    if (!bid || !question.trim()) return;
    setQuestionLoading(true);
    const fn = isDemo ? demoSaveQuestion : saveHomeownerQuestion;
    await fn(bid.id, question.trim());
    const updateFn = isDemo ? demoUpdateBidStatus : updateBidStatus;
    await updateFn(bid.id, "question_asked" as BidStatus);
    setQuestionLoading(false);
    setViewState("question_sent");
    // TODO: notify contractor via SMS/email webhook
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !bid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <h1 className="text-2xl font-semibold">Proposal Not Found</h1>
        <p className="text-muted-foreground">{error ?? "This proposal does not exist or has expired."}</p>
        <Button asChild><Link href="/">Back to Dashboard</Link></Button>
      </div>
    );
  }

  const job = bid.jobs;
  const contractor = bid.profiles;
  const statusInfo = STATUS_LABEL[bid.status] ?? STATUS_LABEL.sent;

  // ── Approved state ──
  if (viewState === "approved") {
    return (
      <div className="min-h-screen bg-background">
        <Header isSignedIn />
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Bid Approved!</h1>
          <p className="mt-3 text-muted-foreground">
            {contractor?.full_name ?? "The contractor"} has been notified. {"They'll"} be in touch shortly to schedule the work.
          </p>
          <Button size="lg" className="mt-8 rounded-full" asChild>
            <Link href={`/jobs/${bid.job_id}`}>Back to Job</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Declined state ──
  if (viewState === "declined") {
    return (
      <div className="min-h-screen bg-background">
        <Header isSignedIn />
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Bid Declined</h1>
          <p className="mt-3 text-muted-foreground">
            {"We've"} let the contractor know. Your job is still open for other bids.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <Link href={`/jobs/${bid.job_id}/bids`}>View Other Bids</Link>
            </Button>
            <Button size="lg" className="rounded-full" asChild>
              <Link href={`/jobs/${bid.job_id}`}>Back to Job</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question sent state ──
  if (viewState === "question_sent") {
    return (
      <div className="min-h-screen bg-background">
        <Header isSignedIn />
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <MessageCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Question Sent</h1>
          <p className="mt-3 text-muted-foreground">
            {contractor?.full_name ?? "The contractor"} will be notified and should respond soon.
          </p>
          <Button size="lg" className="mt-8 rounded-full" onClick={() => setViewState("reviewing")}>
            Back to Proposal
          </Button>
        </div>
      </div>
    );
  }

  // ── Main proposal view ──
  return (
    <div className="min-h-screen bg-background">
      <Header backHref={`/jobs/${bid.job_id}/bids`} backLabel="Back to Bids" isSignedIn />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Proposal</span>
            <h1 className="mt-1.5 text-2xl font-bold text-balance text-foreground">
              {job?.title ?? "Project Proposal"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {job?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
              )}
              {job?.urgency && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {job.urgency}
                </span>
              )}
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Contractor card */}
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{contractor?.full_name ?? "HomeBids Contractor"}</p>
            <p className="text-sm text-muted-foreground">Licensed & Insured</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Verified
          </div>
        </div>

        {/* Pricing summary */}
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bid Amount</p>
              <p className="mt-1 text-4xl font-bold text-foreground">{formatCurrency(bid.amount)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-primary/30" />
          </div>
          {bid.payment_terms && (
            <p className="mt-3 text-sm text-muted-foreground">{bid.payment_terms}</p>
          )}
        </div>

        {/* Line items */}
        {bid.line_items && bid.line_items.length > 0 && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Pricing Breakdown
            </h2>
            <div className="divide-y divide-border">
              {bid.line_items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <span className="text-sm text-foreground">{item.description}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-sm font-bold text-foreground">{formatCurrency(bid.amount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scope of work / message */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Wrench className="h-4 w-4" />
            Scope of Work
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            {bid.scope_of_work ?? bid.message}
          </p>
        </div>

        {/* Timeline */}
        {bid.timeline && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarCheck className="h-4 w-4" />
              Timeline
            </h2>
            <p className="text-foreground">{bid.timeline}</p>
          </div>
        )}

        {/* Assumptions */}
        {bid.assumptions && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4" />
              Assumptions
            </h2>
            <p className="leading-relaxed text-muted-foreground">{bid.assumptions}</p>
          </div>
        )}

        {/* Exclusions */}
        {bid.exclusions && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Exclusions
            </h2>
            <p className="leading-relaxed text-muted-foreground">{bid.exclusions}</p>
          </div>
        )}

        {/* Next steps */}
        {bid.next_steps && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
              Next Steps
            </h2>
            <p className="leading-relaxed text-muted-foreground">{bid.next_steps}</p>
          </div>
        )}

        {/* Ask a question form */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            Ask the Contractor a Question
          </h2>
          <Textarea
            placeholder="e.g. Does this include the permit fee? How long will the project take?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <Button
            className="mt-3 rounded-full"
            onClick={handleQuestion}
            disabled={!question.trim() || questionLoading}
          >
            {questionLoading ? "Sending..." : "Send Question"}
          </Button>
        </div>

        {/* Main CTAs */}
        <div className="sticky bottom-4 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="flex-1 gap-2 rounded-full bg-green-600 text-white hover:bg-green-700"
            onClick={handleApprove}
          >
            <CheckCircle2 className="h-5 w-5" />
            Approve Bid
          </Button>
          {!showDeclineForm ? (
            <Button
              size="lg"
              variant="outline"
              className="flex-1 gap-2 rounded-full"
              onClick={() => setShowDeclineForm(true)}
            >
              <XCircle className="h-5 w-5" />
              Decline
            </Button>
          ) : (
            <div className="flex-1 rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-sm font-medium text-foreground">Why are you declining? (optional)</p>
              <Textarea
                placeholder="Price too high, timeline doesn't work, etc."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={2}
                className="mb-3 resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full bg-red-600 text-white hover:bg-red-700" onClick={handleDecline}>
                  Confirm Decline
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setShowDeclineForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          HomeBids connects homeowners and contractors. Payment and project agreements are made directly between parties.
        </p>
      </main>
    </div>
  );
}
