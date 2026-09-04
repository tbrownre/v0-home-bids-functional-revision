"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, MessageCircle, ExternalLink } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { createClient } from "@/lib/supabase/client";

interface ContractorThreadRow {
  job_ref: string;
  title: string;
  location: string;
  workspace: string;
  state: string;
  display_name: string;
  last_message: string;
  last_at: string;
}

function relativeTime(value: string | null): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function prettyState(state: string): string {
  if (!state) return "";
  return state
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ContractorMessagesPage() {
  const [threads, setThreads] = useState<ContractorThreadRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth guard — same pattern as the contractor dashboard.
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
      if (user.role !== "contractor" && user.role !== "admin") {
        window.location.replace("/");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
          if (!cancelled) setLoading(false);
          return;
        }
        const supabase = createClient();
        const { data, error } = await supabase.rpc("my_contractor_threads");
        if (cancelled) return;
        if (!error && Array.isArray(data)) {
          setThreads(data as ContractorThreadRow[]);
        }
      } catch {
        /* non-fatal */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header isContractor isSignedIn={false} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contractors/dashboard?tab=overview">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
            Loading conversations…
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No conversations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              They start the moment you send a bid.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {threads.map((thread) => (
              <li
                key={thread.job_ref}
                className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-foreground">{thread.title || "Job"}</p>
                      {thread.state && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          {prettyState(thread.state)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{thread.job_ref}</span>
                      {thread.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{thread.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {thread.last_at && (
                    <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(thread.last_at)}</span>
                  )}
                </div>

                {thread.last_message && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {thread.display_name ? <span className="font-medium text-foreground">{thread.display_name}: </span> : null}
                    {thread.last_message}
                  </p>
                )}

                {thread.workspace && (
                  <div className="mt-4">
                    <Button size="sm" className="gap-1.5 rounded-full font-semibold" asChild>
                      <a href={thread.workspace} target="_blank" rel="noopener noreferrer">
                        Open workspace <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
