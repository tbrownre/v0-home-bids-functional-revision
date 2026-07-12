"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, FileText, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useSignInModal } from "@/components/sign-in-modal-provider";
import {
  getJobStatus,
  getJobStatusLabel,
  subscribe,
  isJobArchived,
  type JobStatusOwner,
} from "@/lib/job-store";
import { type MockUser } from "@/lib/mock-auth";
import { getHomeownerJobs } from "@/lib/supabase/actions";

interface OwnerJob {
  id: string;
  description: string;
  status: JobStatusOwner;
  createdAt: Date;
  bidsCount: number;
}

const STATUS_ORDER: Record<string, number> = {
  receiving_bids: 0,
  contractor_selected: 1,
  in_progress: 2,
  completed: 3,
};

export default function JobsPage() {
  const { openSignIn } = useSignInModal();
  const [user, setUser] = useState<MockUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [jobs, setJobs] = useState<OwnerJob[]>([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);

  // No user pre-loaded — real auth via Supabase middleware
  useEffect(() => {
    setUser(null);
    setAuthReady(true);
  }, []);

  // Load jobs from Supabase (auth is required for Supabase access).
  useEffect(() => {
    if (!authReady) return;
    let active = true;

    const loader = getHomeownerJobs();
    loader
      .then(({ jobs: rawJobs, error }) => {
        if (!active) return;
        if (!error && Array.isArray(rawJobs)) {
          setJobs(
            rawJobs.map((j: any) => ({
              id: j.id,
              description: j.description,
              status: (j.status === "open" ? "receiving_bids" : j.status) as JobStatusOwner,
              createdAt: new Date(j.created_at),
              bidsCount: j.bids?.[0]?.count ?? 0,
            })),
          );
        }
        setJobsLoaded(true);
      })
      .catch(() => {
        // Never let a failed load crash the page — show the empty state instead.
        if (active) setJobsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [authReady, user]);

  // Reflect status changes made on other pages (job-store is the shared source).
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setJobs((prev) =>
        prev
          .map((job) => {
            const stored = getJobStatus(job.id);
            return stored && stored !== job.status ? { ...job, status: stored } : job;
          })
          .filter((job) => !isJobArchived(job.id)),
      );
    });
    return unsubscribe;
  }, []);

  // Signed-out → prompt to sign in.
  if (authReady && !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header isSignedIn={false} isContractor={false} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted-foreground">Please sign in to view your jobs.</p>
          <Button onClick={openSignIn}>Sign In</Button>
        </main>
      </div>
    );
  }

  // Signed in as a non-homeowner (contractor/admin) → not their page.
  if (authReady && user && user.role !== "homeowner") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header isSignedIn isContractor={user.role === "contractor"} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-muted-foreground">This page is for homeowners only.</p>
          <Button asChild>
            <Link href="/contractors/dashboard">Go to Contractor Dashboard</Link>
          </Button>
        </main>
      </div>
    );
  }

  const sortedJobs = [...jobs]
    .map((j) => ({ ...j, status: (getJobStatus(j.id) as JobStatusOwner) || j.status }))
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isSignedIn isContractor={false} />
      <main className="flex flex-1 flex-col items-center px-3 pb-12 pt-8 sm:px-4">
        <div className="w-full max-w-3xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Your Jobs</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
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

          {/* Loading skeletons — only while the first load is in flight */}
          {!jobsLoaded ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading your jobs">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-6">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
                  <div className="mt-5 h-8 w-28 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-medium text-foreground">No jobs yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Post your first job to start receiving bids from local contractors
              </p>
              <Button asChild className="mt-6 gap-2">
                <Link href="/new-job">
                  <Plus className="h-4 w-4" />
                  Post Your First Job
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md ${
                    job.status === "completed" ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{job.description}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Posted{" "}
                          {Math.floor(
                            (Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24),
                          )}{" "}
                          days ago
                        </span>
                        {job.bidsCount > 0 && (
                          <span className="text-sm font-medium text-primary">
                            {job.bidsCount} bid{job.bidsCount !== 1 ? "s" : ""} received
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          job.status === "completed"
                            ? "bg-[#0A84FF]/10 text-[#0A84FF] ring-1 ring-[#0A84FF]/30"
                            : job.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : job.status === "contractor_selected"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-[#0A84FF]/10 text-[#0A84FF]"
                        }`}
                      >
                        {job.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                        {getJobStatusLabel(job.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Button variant="outline" className="bg-transparent" size="sm" asChild>
                      <Link href={`/jobs/${job.id}`}>View Details</Link>
                    </Button>
                    {job.bidsCount > 0 && (
                      <Button variant="outline" className="bg-transparent" size="sm" asChild>
                        <Link href={`/jobs/${job.id}/bids`}>View Bids</Link>
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
