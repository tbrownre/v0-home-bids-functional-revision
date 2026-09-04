"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { HomeownerTopbar } from "@/components/homeowner/homeowner-topbar";
import { StartProjectModal } from "@/components/homeowner/start-project-modal";
import { Button } from "@/components/ui/button";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getJobStatus, getJobStatusLabel, isJobArchived, type JobStatusOwner } from "@/lib/job-store";
import { getHomeownerJobs } from "@/lib/supabase/actions";

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";

interface Job {
  id: string;
  ownerToken: string | null;
  title: string;
  description: string;
  location: string;
  status: JobStatusOwner;
  createdAt: Date;
  bidsCount: number;
}

const STATUS_PILL: Record<JobStatusOwner, { label: string; className: string; icon: typeof Clock }> = {
  receiving_bids: { label: "Receiving bids", className: "bg-amber-100 text-amber-700", icon: Clock },
  contractor_selected: { label: "Contractor selected", className: "bg-purple-100 text-purple-700", icon: AlertCircle },
  in_progress: { label: "In progress", className: "bg-blue-100 text-blue-700", icon: Wrench },
  completed: { label: "Completed", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

function StatusPill({ status }: { status: JobStatusOwner }) {
  const meta = STATUS_PILL[status] ?? STATUS_PILL.receiving_bids;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>
      <Icon className="h-3 w-3" />
      {getJobStatusLabel(status) || meta.label}
    </span>
  );
}

function shortDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function HomeownerDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [firstName, setFirstName] = useState("there");
  const [greeting, setGreeting] = useState("Welcome");
  const [error, setError] = useState<string | null>(null);
  const [showStart, setShowStart] = useState(false);

  // Greeting (client-only to avoid hydration mismatch).
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  // Auth guard — keep existing behavior: redirect signed-out visitors once,
  // send non-homeowners to their own area.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (cancelled) return;
      if (!user) {
        window.location.replace("/auth/sign-in");
        return;
      }
      if (user.role === "contractor") {
        window.location.replace("/contractors/dashboard");
        return;
      }
      if (user.firstName) setFirstName(user.firstName);
      setAuthReady(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHomeownerJobs();
      if (result.error === "Not authenticated") {
        window.location.replace("/auth/sign-in");
        return;
      }
      if (result.error) {
        setError(result.error);
        setJobs([]);
        setLoading(false);
        return;
      }
      if (result.jobs) {
        setJobs(
          result.jobs
            .map((j) => ({
              id: j.id,
              ownerToken: (j as { owner_token?: string | null }).owner_token ?? null,
              title: j.title ?? "",
              description: j.description ?? "",
              location: j.location ?? "",
              status:
                ((getJobStatus(j.id) as JobStatusOwner) ||
                  (j.status === "open" ? "receiving_bids" : (j.status as JobStatusOwner))) ??
                "receiving_bids",
              createdAt: new Date(j.created_at),
              bidsCount: j.bids?.[0]?.count ?? 0,
            }))
            .filter((j) => !isJobArchived(j.id)),
        );
      }
    } catch {
      setError("unknown_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authReady) void loadJobs();
  }, [authReady, loadJobs]);

  // Default order: newest first by created_at, before any display.
  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [jobs],
  );

  function openJob(job: Job) {
    if (job.ownerToken) {
      window.location.href = `/my/${job.ownerToken}`;
    } else {
      router.push(`/jobs/${job.id}`);
    }
  }

  if (!authReady) return <div className="min-h-screen bg-muted/30" />;

  const hasJobs = !loading && !error && sortedJobs.length > 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <HomeownerTopbar />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-6">
        {/* Greeting + primary CTA */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground">
              {greeting}, {firstName}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">Track your projects and the bids coming in.</p>
          </div>
          <Button onClick={() => setShowStart(true)} className="h-12 gap-2 rounded-xl px-5 text-base font-semibold">
            <Sparkles className="h-[18px] w-[18px]" />
            Start a new project
          </Button>
        </div>

        {/* Loading skeleton */}
        {loading && <div className={`${CARD} h-64 animate-pulse`} aria-busy="true" aria-label="Loading projects" />}

        {/* Error state — retry */}
        {!loading && error && (
          <div className={`${CARD} p-4`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm font-medium text-foreground">Couldn&apos;t load your projects — retry</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => void loadJobs()} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty state — new-user hero (mirrors the contractor first-run hero) */}
        {!loading && !error && sortedJobs.length === 0 && (
          <section className={`${CARD} relative overflow-hidden p-8 sm:p-10`}>
            <div className="max-w-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">Your next step</p>
              <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground">Start your first project</h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                Text what you need done and HomeBids gathers competing bids from local pros — no forms, no calls.
              </p>
              <Button onClick={() => setShowStart(true)} className="mt-6 h-12 gap-2 rounded-xl px-6 text-base font-semibold">
                <Sparkles className="h-[18px] w-[18px]" />
                Start a new project
                <ArrowRight className="h-[18px] w-[18px]" />
              </Button>
            </div>
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/5" />
          </section>
        )}

        {/* Your projects table */}
        {hasJobs && (
          <section className={`${CARD} overflow-x-auto p-3 sm:px-5 sm:py-2`}>
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[minmax(220px,1.6fr)_100px_150px_150px] gap-3 px-1 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
                <div>Project</div>
                <div>Bids</div>
                <div>Status</div>
                <div>Posted</div>
              </div>
              {sortedJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => openJob(job)}
                  className="grid w-full grid-cols-[minmax(220px,1.6fr)_100px_150px_150px] items-center gap-3 border-t border-border px-1 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{job.title || job.description || "Untitled project"}</p>
                    {job.location && <p className="truncate text-sm text-muted-foreground">{job.location}</p>}
                  </div>
                  <div className="font-bold text-foreground">{job.bidsCount}</div>
                  <div>
                    <StatusPill status={job.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">{shortDate(job.createdAt)}</div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <StartProjectModal open={showStart} onClose={() => setShowStart(false)} />
    </div>
  );
}
