"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Users,
  Wrench,
  ChevronRight,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useSignInModal } from "@/components/sign-in-modal-provider";
import { getJobStatus, getJobStatusLabel, isJobArchived, type JobStatusOwner } from "@/lib/job-store";
import { getHomeownerJobs } from "@/lib/supabase/actions";

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: JobStatusOwner;
  createdAt: Date;
  bidsCount: number;
  budget_min: number | null;
  budget_max: number | null;
}

const STATUS_ORDER: Record<JobStatusOwner, number> = {
  receiving_bids: 0,
  contractor_selected: 1,
  in_progress: 2,
  completed: 3,
};

function StatusBadge({ status }: { status: JobStatusOwner }) {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        {getJobStatusLabel(status)}
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        <Wrench className="h-3 w-3" />
        {getJobStatusLabel(status)}
      </span>
    );
  if (status === "contractor_selected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
        <AlertCircle className="h-3 w-3" />
        {getJobStatusLabel(status)}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3 w-3" />
      {getJobStatusLabel(status)}
    </span>
  );
}

export default function HomeownerDashboardPage() {
  const router = useRouter();
  const { openSignIn } = useSignInModal();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHomeownerJobs();
      
      // Handle authentication failure
      if (result.error === "Not authenticated") {
        setError("not_authenticated");
        setJobs([]);
        setLoading(false);
        return;
      }
      
      // Handle other errors
      if (result.error) {
        setError(result.error);
        setJobs([]);
        setLoading(false);
        return;
      }
      
      // Success — load jobs
      if (result.jobs) {
        setJobs(
          result.jobs
            .map((j) => ({
              id: j.id,
              title: j.title ?? "",
              description: j.description ?? "",
              category: j.category ?? "",
              location: j.location ?? "",
              status:
                ((getJobStatus(j.id) as JobStatusOwner) ||
                  (j.status === "open" ? "receiving_bids" : (j.status as JobStatusOwner))) ??
                "receiving_bids",
              createdAt: new Date(j.created_at),
              bidsCount: j.bids?.[0]?.count ?? 0,
              budget_min: j.budget_min ?? null,
              budget_max: j.budget_max ?? null,
            }))
            .filter((j) => !isJobArchived(j.id))
            .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)),
        );
      }
    } catch {
      setError("unknown_error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auth guard — redirect non-homeowners; set user name
  useEffect(() => {
    setAuthReady(true);
  }, [router]);

  useEffect(() => {
    if (authReady) void loadJobs();
  }, [authReady, loadJobs]);

  if (!authReady) return <div className="min-h-screen bg-background" />;

  // Not authenticated — prompt to sign in
  if (error === "not_authenticated") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header isSignedIn={false} isContractor={false} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted-foreground">Please sign in to view your jobs.</p>
          <Button onClick={() => openSignIn()}>Sign In</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isSignedIn />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header row */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {userName ? `${userName}'s Jobs` : "Your Jobs"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your projects and manage bids
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/new-job">
              <Plus className="h-4 w-4" />
              New Job
            </Link>
          </Button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading jobs">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-6">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {/* Error state — retry button */}
        {!loading && error && error !== "not_authenticated" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Couldn't load your jobs — retry</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void loadJobs()} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty state — only show when authenticated with zero jobs */}
        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-foreground">No jobs yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Post your first job to start receiving bids from local contractors.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link href="/new-job">
                <Plus className="h-4 w-4" />
                Post Your First Job
              </Link>
            </Button>
          </div>
        )}

        {/* Jobs list */}
        {!loading && !error && jobs.length > 0 && (
          <AnimatePresence>
            <div className="space-y-4">
              {jobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md ${job.status === "completed" ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground line-clamp-2">
                        {job.title || job.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          Posted{" "}
                          {Math.max(0, Math.floor((Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24)))} days ago
                        </span>
                        {job.bidsCount > 0 && (
                          <span className="flex items-center gap-1 text-sm font-medium text-primary">
                            <Users className="h-3.5 w-3.5" />
                            {job.bidsCount} bid{job.bidsCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {job.budget_min && (
                          <span className="text-sm text-muted-foreground">
                            ${job.budget_min.toLocaleString()}
                            {job.budget_max ? `–$${job.budget_max.toLocaleString()}` : "+"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={job.status} />
                      <Link
                        href={`/jobs/${job.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label={`View details for ${job.title}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Bid CTA for active jobs */}
                  {job.status === "receiving_bids" && job.bidsCount > 0 && (
                    <div className="mt-4 border-t border-border pt-4">
                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                        <Link href={`/jobs/${job.id}/bids`}>
                          <Users className="h-3.5 w-3.5" />
                          Review {job.bidsCount} Bid{job.bidsCount !== 1 ? "s" : ""}
                        </Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
