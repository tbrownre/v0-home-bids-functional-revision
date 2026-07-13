"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  FileText,
  Loader2,
  Bell,
  ChevronRight,
  Radio,
  Hammer,
  Search,
  Send,
  Eye,
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { getJobStatus } from "@/lib/supabase/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface JobStatusData {
  job: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    status: string;
    urgency?: string;
    budget_min?: number | null;
    budget_max?: number | null;
    created_at: string;
  };
  contractorsContacted: number;
  contractorsInterested: number;
  bidsReceived: number;
  outreachStatus: "pending" | "active" | "completed" | "failed";
}

// ── Pipeline step config ──────────────────────────────────────────────────────

type StepKey =
  | "submitted"
  | "finding"
  | "inviting"
  | "reviewing"
  | "bids_coming"
  | "homeowner_reviewing";

function getPipelineSteps(data: JobStatusData): {
  key: StepKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: "done" | "active" | "pending";
}[] {
  const { outreachStatus, contractorsContacted, contractorsInterested, bidsReceived } = data;

  const done = (key: StepKey) =>
    key === "submitted"
      ? true
      : key === "finding"
        ? outreachStatus !== "pending"
        : key === "inviting"
          ? contractorsContacted > 0
          : key === "reviewing"
            ? contractorsInterested > 0
            : key === "bids_coming"
              ? bidsReceived > 0
              : bidsReceived > 0;

  const steps: StepKey[] = [
    "submitted",
    "finding",
    "inviting",
    "reviewing",
    "bids_coming",
    "homeowner_reviewing",
  ];

  // Find the furthest done step to set "active"
  let lastDoneIdx = -1;
  steps.forEach((k, i) => { if (done(k)) lastDoneIdx = i; });
  const activeIdx = lastDoneIdx + 1 < steps.length ? lastDoneIdx + 1 : lastDoneIdx;

  const config: Record<StepKey, { label: string; description: string; icon: React.ReactNode }> = {
    submitted: {
      label: "Job Submitted",
      description: "Your project details have been received.",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    finding: {
      label: "Finding Matching Contractors",
      description: "HomeBids is identifying qualified local contractors for your project.",
      icon: <Search className="h-5 w-5" />,
    },
    inviting: {
      label: "Inviting Local Contractors",
      description:
        contractorsContacted > 0
          ? `${contractorsContacted} contractor${contractorsContacted !== 1 ? "s" : ""} have been contacted.`
          : "Invitations are being sent to local contractors.",
      icon: <Send className="h-5 w-5" />,
    },
    reviewing: {
      label: "Contractors Reviewing Your Project",
      description:
        contractorsInterested > 0
          ? `${contractorsInterested} contractor${contractorsInterested !== 1 ? "s are" : " is"} interested.`
          : "Contractors are reviewing your project details.",
      icon: <Eye className="h-5 w-5" />,
    },
    bids_coming: {
      label: "Bids Coming In",
      description:
        bidsReceived > 0
          ? `${bidsReceived} bid${bidsReceived !== 1 ? "s" : ""} received so far.`
          : "Contractors are preparing their bids.",
      icon: <FileText className="h-5 w-5" />,
    },
    homeowner_reviewing: {
      label: "Ready for Your Review",
      description: "You can now review and compare bids from contractors.",
      icon: <Hammer className="h-5 w-5" />,
    },
  };

  return steps.map((key, i) => ({
    key,
    ...config[key],
    status: i < activeIdx ? "done" : i === activeIdx ? "active" : "pending",
  }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JobStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<JobStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getJobStatus(id).then(({ jobStatus, error: err }) => {
      if (err || !jobStatus) setError(err ?? "Job not found");
      else setData(jobStatus);
      setLoading(false);
    });
  }, [id]);

  // TODO: subscribe to Supabase Realtime channel for live status updates
  // supabase.channel(`job-status-${id}`).on('postgres_changes', ...).subscribe()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <h1 className="text-2xl font-semibold text-foreground">Job Not Found</h1>
        <p className="text-muted-foreground">{error ?? "This job does not exist."}</p>
        <Button asChild><Link href="/">Back to Dashboard</Link></Button>
      </div>
    );
  }

  const { job, contractorsContacted, contractorsInterested, bidsReceived } = data;
  const steps = getPipelineSteps(data);
  const hasBids = bidsReceived > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header backHref="/?showJobs=true" backLabel="Back to Jobs" isSignedIn />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Project Status
          </span>
          <h1 className="mt-2 text-2xl font-bold text-balance text-foreground sm:text-3xl">
            {job.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
            {job.urgency && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {job.urgency}
              </span>
            )}
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {job.category}
            </span>
          </div>
        </div>

        {/* Live indicator */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <p className="text-sm font-medium text-foreground">
            HomeBids is actively contacting local contractors on your behalf
          </p>
          <Bell className="ml-auto h-4 w-4 text-muted-foreground" />
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { label: "Contractors\nContacted", value: contractorsContacted, icon: <Radio className="h-4 w-4" /> },
            { label: "Interested", value: contractorsInterested, icon: <Users className="h-4 w-4" /> },
            { label: "Bids\nReceived", value: bidsReceived, icon: <FileText className="h-4 w-4" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                {icon}
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="mt-0.5 text-xs whitespace-pre-line text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Progress
          </h2>
          <ol className="space-y-1">
            {steps.map((step, i) => (
              <li key={step.key} className="flex gap-4">
                {/* Connector line + icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      step.status === "done"
                        ? "border-primary bg-primary text-primary-foreground"
                        : step.status === "active"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.status === "done" ? <CheckCircle2 className="h-4.5 w-4.5" /> : step.icon}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`my-1 w-0.5 flex-1 min-h-[20px] ${step.status === "done" ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
                {/* Text */}
                <div className="pb-5 min-w-0">
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      step.status === "pending" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                  {step.status === "active" && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      In progress
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Project description */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Your Project
          </h2>
          <p className="leading-relaxed text-muted-foreground">{job.description}</p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {hasBids ? (
            <Button size="lg" className="flex-1 gap-2 rounded-full" asChild>
              <Link href={`/jobs/${id}/bids`}>
                <FileText className="h-4 w-4" />
                Review Bids ({bidsReceived})
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div className="flex-1 rounded-xl bg-muted/50 px-5 py-4 text-center">
              <p className="text-sm font-medium text-foreground">Waiting for bids to come in</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {"We'll notify you as soon as contractors submit their bids."}
              </p>
            </div>
          )}
          <Button size="lg" variant="outline" className="rounded-full" asChild>
            <Link href={`/jobs/${id}`}>View Full Job Details</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
