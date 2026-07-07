"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Clock,
  DollarSign,
  Loader2,
  Sparkles,
  XCircle,
  ArrowRight,
  Home,
  FileText,
  CheckCircle2,
  User,
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { getJobOpportunity, createContractorInterest } from "@/lib/supabase/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface JobOpportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  urgency?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  created_at: string;
  homeownerName?: string;
  timeline?: string;
  propertyType?: string;
  imageCount?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return "Budget TBD";
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return "Budget TBD";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContractorOpportunityPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();

  const [job, setJob] = useState<JobOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notInterested, setNotInterested] = useState(false);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    getJobOpportunity(jobId).then((result) => {
      const j = (result as { job?: unknown }).job;
      const err = (result as { error?: string | null }).error ?? null;
      if (err || !j) setError(err ?? "Job not found");
      else setJob(j as JobOpportunity);
      setLoading(false);
    });
  }, [jobId]);

  const handleBuildBid = async () => {
    if (!job) return;
    setBuilding(true);
    // Record interest
    await createContractorInterest(job.id);
    // TODO: if contractor is not authenticated, route through sample/trial flow
    // TODO: if authenticated, attach contractor to job before routing

    // Route into Bid Builder with job preloaded
    const params = new URLSearchParams({ jobId: job.id, source: "opportunity" });
    router.push(`/contractors/dashboard?${params.toString()}`);
  };

  const handleNotInterested = () => {
    setNotInterested(true);
    // TODO: record contractor_interest with status="declined" in Supabase
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <h1 className="text-2xl font-semibold text-foreground">Opportunity Not Found</h1>
        <p className="text-muted-foreground">{error ?? "This job opportunity is no longer available."}</p>
        <Button asChild><Link href="/contractors/dashboard">Go to Dashboard</Link></Button>
      </div>
    );
  }

  if (notInterested) {
    return (
      <div className="min-h-screen bg-background">
        <Header isSignedIn />
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-6 text-xl font-bold text-foreground">No problem</h1>
          <p className="mt-2 text-muted-foreground">
            {"We'll"} remove this opportunity from your queue. More jobs are posted every day.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" variant="outline" className="rounded-full" asChild>
              <Link href="/contractors/jobs">Browse More Jobs</Link>
            </Button>
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/contractors/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isSignedIn />

      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        {/* Intro badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-semibold text-primary">New Job Opportunity</span>
        </div>

        <h1 className="text-2xl font-bold text-balance text-foreground sm:text-3xl">
          {job.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          A homeowner in your area is looking for a contractor. HomeBids can help you build a professional bid in minutes.
        </p>

        {/* Job summary card */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Project Details
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <MapPin className="h-4 w-4" />, label: "Location", value: job.location },
              { icon: <Clock className="h-4 w-4" />, label: "Timeline", value: job.urgency ?? job.timeline ?? "Flexible" },
              { icon: <DollarSign className="h-4 w-4" />, label: "Budget", value: formatBudget(job.budget_min, job.budget_max) },
              { icon: <Home className="h-4 w-4" />, label: "Property", value: job.propertyType ?? "Residential" },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-3">
                <span className="mt-0.5 text-muted-foreground">{icon}</span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Homeowner request */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Homeowner Request
          </h2>
          <p className="leading-relaxed text-muted-foreground">{job.description}</p>
          {job.imageCount && job.imageCount > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {job.imageCount} photo{job.imageCount !== 1 ? "s" : ""} attached
            </p>
          )}
        </div>

        {/* HomeBids value prop */}
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Why use HomeBids to build this bid?
          </h2>
          <ul className="space-y-2">
            {[
              "Professional bid generated in under 2 minutes",
              "Scope of work, pricing, timeline, and next steps — all included",
              "Homeowner receives a clean proposal page (no PDF required)",
              "Approved bids go directly to your dashboard",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3">
          <Button
            size="lg"
            className="gap-2 rounded-full font-semibold"
            onClick={handleBuildBid}
            disabled={building}
          >
            {building ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Loading Bid Builder...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Build This Bid With HomeBids AI <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
            onClick={handleNotInterested}
            disabled={building}
          >
            <XCircle className="h-4 w-4" />
            {"I'm"} Not Interested
          </Button>
        </div>

        {/* Browse jobs link */}
        <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <Link href="/contractors/jobs" className="underline-offset-4 hover:underline">
            Browse all open jobs
          </Link>
        </div>

        {/* Auth note */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {/* TODO: detect auth state and show signup prompt for unauthenticated contractors */}
          No account yet? You can preview a sample bid. A free account is required to save and send it.
        </p>
      </main>
    </div>
  );
}
