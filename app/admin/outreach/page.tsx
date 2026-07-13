"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Radio,
  Send,
  Users,
  XCircle,
  MessageCircle,
  FileText,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ArrowRight,
  Clock,
  MapPin,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminJobs, getAdminOutreachRuns, getAdminReplies } from "@/lib/supabase/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutreachRun {
  id: string;
  job_id: string;
  job_title: string;
  status: "active" | "completed" | "pending" | "failed";
  contractors_selected: number;
  invites_queued: number;
  invites_sent: number;
  invites_failed: number;
  replies_received: number;
  interested_count: number;
  bids_started: number;
  bids_submitted: number;
  created_at: string;
}

interface AdminJob {
  id: string;
  title: string;
  category: string;
  location: string;
  status: string;
  created_at: string;
  bids?: { count: number }[];
}

interface OutreachReply {
  id: string;
  job_id: string | null;
  lead_id: string | null;
  company_name: string | null;
  from_email: string;
  to_email: string;
  subject: string;
  reply_text: string;
  received_at: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RUN_STATUS: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active:    { label: "Active",    className: "bg-green-50 text-green-700 border-green-200",    icon: <Radio className="h-3 w-3" /> },
  completed: { label: "Complete",  className: "bg-blue-50 text-blue-700 border-blue-200",       icon: <CheckCircle2 className="h-3 w-3" /> },
  pending:   { label: "Pending",   className: "bg-amber-50 text-amber-700 border-amber-200",    icon: <Clock className="h-3 w-3" /> },
  failed:    { label: "Failed",    className: "bg-red-50 text-red-700 border-red-200",          icon: <XCircle className="h-3 w-3" /> },
};

function StatCell({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 rounded-lg px-3 py-2 text-center ${highlight ? "bg-primary/10" : "bg-muted/50"}`}>
      <span className={`text-lg font-bold leading-none ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminOutreachPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<OutreachRun[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [replies, setReplies] = useState<OutreachReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check admin authorization
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { getUserProfile } = await import("@/lib/supabase/actions");
        const { profile } = await getUserProfile();
        
        if (!profile) {
          router.push("/auth/sign-in");
          return;
        }

        if (profile.is_admin !== true) {
          router.push("/");
          return;
        }

        setIsAuthorized(true);
      } catch (e) {
        console.error("[AdminOutreach] Auth check failed:", e);
        router.push("/");
      }
    }

    checkAdmin();
  }, [router]);

  const loadData = async () => {
    const [runsResult, jobsResult, repliesResult] = await Promise.all([
      getAdminOutreachRuns(),
      getAdminJobs(),
      getAdminReplies(),
    ]);
    setRuns((runsResult.runs ?? []) as OutreachRun[]);
    setJobs((jobsResult.jobs ?? []) as AdminJob[]);
    setReplies((repliesResult.replies ?? []) as OutreachReply[]);
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadData().finally(() => setLoading(false));
    // TODO: subscribe to Supabase Realtime for live outreach run updates
  }, [isAuthorized]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Aggregate totals across all runs
  const totals = runs.reduce(
    (acc, r) => ({
      selected: acc.selected + r.contractors_selected,
      sent: acc.sent + r.invites_sent,
      failed: acc.failed + r.invites_failed,
      replies: acc.replies + r.replies_received,
      interested: acc.interested + r.interested_count,
      bids_started: acc.bids_started + r.bids_started,
      bids_submitted: acc.bids_submitted + r.bids_submitted,
    }),
    { selected: 0, sent: 0, failed: 0, replies: 0, interested: 0, bids_started: 0, bids_submitted: 0 }
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isSignedIn />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Outreach Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor contractor outreach runs triggered by homeowner job submissions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* TODO: Add admin auth guard — this page should only be accessible to admin users */}

        {/* Global totals */}
        <div className="mb-8 grid grid-cols-4 gap-3 sm:grid-cols-7">
          <StatCell label="Selected" value={totals.selected} />
          <StatCell label="Invites Sent" value={totals.sent} />
          <StatCell label="Failed" value={totals.failed} />
          <StatCell label="Replies" value={totals.replies} highlight />
          <StatCell label="Interested" value={totals.interested} highlight />
          <StatCell label="Bids Started" value={totals.bids_started} highlight />
          <StatCell label="Bids Submitted" value={totals.bids_submitted} highlight />
        </div>

        {/* Outreach runs table */}
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Outreach Runs
        </h2>

        {runs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Radio className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 font-medium text-foreground">No outreach runs yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {/* TODO: load from outreach_runs table when connected */}
              Outreach runs will appear here after homeowners submit jobs and n8n triggers contractor outreach.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => {
              const statusCfg = RUN_STATUS[run.status] ?? RUN_STATUS.pending;
              return (
                <div key={run.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  {/* Run header */}
                  <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{run.job_title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(run.created_at)} · Job ID: {run.job_id}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.className}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-4 divide-x divide-border sm:grid-cols-7">
                    {[
                      { label: "Selected",    value: run.contractors_selected },
                      { label: "Queued",      value: run.invites_queued },
                      { label: "Sent",        value: run.invites_sent },
                      { label: "Failed",      value: run.invites_failed },
                      { label: "Replies",     value: run.replies_received,   highlight: true },
                      { label: "Interested",  value: run.interested_count,   highlight: true },
                      { label: "Bids In",     value: run.bids_submitted,     highlight: true },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="flex flex-col items-center gap-0.5 px-3 py-3 text-center">
                        <span className={`text-lg font-bold leading-none ${highlight ? "text-primary" : "text-foreground"}`}>
                          {value}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-5 py-3">
                    <Button size="sm" variant="ghost" className="gap-1.5 rounded-full text-xs" asChild>
                      <Link href={`/jobs/${run.job_id}`}>
                        <FileText className="h-3.5 w-3.5" />
                        View Job
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5 rounded-full text-xs" asChild>
                      <Link href={`/jobs/${run.job_id}/bids`}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        View Bids
                      </Link>
                    </Button>
                    {run.invites_failed > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 rounded-full text-xs text-amber-700 hover:text-amber-800"
                        onClick={() => {
                          // TODO: retry failed invites via n8n webhook or Supabase function
                          alert(`TODO: retry ${run.invites_failed} failed invite(s) for job ${run.job_id}`);
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry {run.invites_failed} Failed
                      </Button>
                    )}
                    {run.interested_count > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 rounded-full text-xs text-primary"
                        onClick={() => {
                          // TODO: route interested contractors into Bid Builder
                          alert(`TODO: send ${run.interested_count} interested contractor(s) to Bid Builder for job ${run.job_id}`);
                        }}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Push to Bid Builder
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent jobs table */}
        <h2 className="mb-4 mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Homeowner Jobs
        </h2>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            No jobs found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bids</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{job.category}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {job.location}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        job.status === "open"
                          ? "bg-green-50 text-green-700"
                          : job.status === "in_progress"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {job.status === "open" ? "Open" : job.status === "in_progress" ? "In Progress" : job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {job.bids?.[0]?.count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {timeAgo(job.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent replies */}
        <h2 className="mb-4 mt-10 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Email Replies
        </h2>

        {replies.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
            No replies yet.
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => {
              // Clamp reply_text to 3 lines (~120 chars)
              const truncatedText = reply.reply_text.length > 120 
                ? reply.reply_text.substring(0, 120) + "..." 
                : reply.reply_text;
              
              return (
                <div key={reply.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* From/Company */}
                      <p className="text-sm font-semibold text-foreground truncate">
                        {reply.company_name || reply.from_email}
                      </p>
                      
                      {/* Subject */}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {reply.subject || "(no subject)"}
                      </p>
                      
                      {/* Reply text */}
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                        {truncatedText}
                      </p>
                      
                      {/* Footer: timestamp + inbox */}
                      <div className="flex items-center justify-between gap-2 mt-3">
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(reply.received_at)}
                        </span>
                        <span className="text-xs text-muted-foreground/70 truncate">
                          to: {reply.to_email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
