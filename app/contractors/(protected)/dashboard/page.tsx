"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Play,
  Check,
  FileText,
  Pencil,
  MessageSquareText,
  ExternalLink,
} from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { BuildBidModal } from "@/components/contractor/build-bid-modal";
import { EditGoalModal } from "@/components/contractor/edit-goal-modal";
import { Button } from "@/components/ui/button";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getContractorSmsLink } from "@/lib/sms-config";
import { formatPrice, statusMeta } from "@/lib/proposal-format";
import { getMonthGoal } from "@/lib/contractor-goal";
import {
  useContractorSignals,
  unansweredThreads,
  profileCompletion,
  isProfileFieldFilled,
  PROFILE_FIELD_LABELS,
  type ContractorProfile,
} from "@/lib/use-contractor-signals";
import type { Proposal, ProposalStatus } from "@/lib/supabase/proposals";

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";
const SENT_STATUSES: ProposalStatus[] = ["sent", "viewed", "question_asked", "approval_clicked", "accepted", "changes_requested"];

function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ContractorDashboard() {
  // ── Auth guard (unchanged behavior) ─────────────────────────────────────────
  const [contractorName, setContractorName] = useState("there");
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
        return;
      }
      if (user.firstName) setContractorName(user.firstName);
    })();
    return () => { cancelled = true; };
  }, []);

  const signals = useContractorSignals();

  // ── Greeting (client-only to avoid hydration mismatch) ──────────────────────
  const [greeting, setGreeting] = useState("Welcome");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  // ── Monthly goal ────────────────────────────────────────────────────────────
  const [goal, setGoal] = useState(30);
  useEffect(() => {
    setGoal(getMonthGoal());
    const onChange = () => setGoal(getMonthGoal());
    window.addEventListener("hb:goal-changed", onChange);
    return () => window.removeEventListener("hb:goal-changed", onChange);
  }, []);

  const [showBuild, setShowBuild] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  const bidsCount = signals.monthBidsCount;
  const percent = Math.max(0, Math.min(100, Math.round((bidsCount / goal) * 100)));
  const remaining = Math.max(0, goal - bidsCount);

  const hasBids = signals.proposals.length > 0;

  if (!signals.loaded) {
    return (
      <div className="min-h-screen bg-muted/30">
        <ContractorTopbar />
        <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
          <div className={`${CARD} h-64 animate-pulse`} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ContractorTopbar />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-6">
        {hasBids ? (
          <SeasonedDashboard
            name={contractorName}
            greeting={greeting}
            proposals={signals.proposals}
            profile={signals.profile}
            threads={signals.threads}
            bidsCount={bidsCount}
            goal={goal}
            percent={percent}
            remaining={remaining}
            onBuild={() => setShowBuild(true)}
            onEditGoal={() => setShowGoal(true)}
          />
        ) : (
          <NewUserDashboard
            name={contractorName}
            greeting={greeting}
            profile={signals.profile}
            proposals={signals.proposals}
            bidsCount={bidsCount}
            goal={goal}
            percent={percent}
            onBuild={() => setShowBuild(true)}
            onEditGoal={() => setShowGoal(true)}
          />
        )}
      </main>

      <BuildBidModal open={showBuild} onClose={() => setShowBuild(false)} />
      <EditGoalModal open={showGoal} currentGoal={goal} onClose={() => setShowGoal(false)} onSaved={setGoal} />
    </div>
  );
}

// ── New-user dashboard (0 bids) ───────────────────────────────────────────────

function NewUserDashboard({
  name,
  greeting,
  profile,
  proposals,
  bidsCount,
  goal,
  percent,
  onBuild,
  onEditGoal,
}: {
  name: string;
  greeting: string;
  profile: ContractorProfile | null;
  proposals: Proposal[];
  bidsCount: number;
  goal: number;
  percent: number;
  onBuild: () => void;
  onEditGoal: () => void;
}) {
  const profileDone = isProfileFieldFilled(profile, "business_name");
  const firstBidDone = proposals.length > 0;
  const sentDone = proposals.some((p) => SENT_STATUSES.includes(p.status));

  const steps = [
    { n: 1, title: "Finish your profile", sub: "Add your business info and services", done: profileDone, next: false },
    { n: 2, title: "Build your first bid", sub: "Create and preview a professional bid", done: firstBidDone, next: profileDone && !firstBidDone },
    { n: 3, title: "Send to a homeowner", sub: "Share your bid and win the job", done: sentDone, next: firstBidDone && !sentDone },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground">{greeting}, {name}</h1>
        <p className="mt-2 text-lg text-muted-foreground">Let&apos;s get your first bid out today.</p>
      </div>

      {/* Hero */}
      <section className={`${CARD} relative overflow-hidden p-8 sm:p-10`}>
        <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">Your next step</p>
            <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground">Build your first bid</h2>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-muted-foreground">
              Create a professional bid in minutes and start winning more jobs.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={onBuild} className="h-12 gap-2 rounded-xl px-6 text-base font-semibold">
                <Sparkles className="h-[18px] w-[18px]" />
                Build My First Bid
                <ArrowRight className="h-[18px] w-[18px]" />
              </Button>
              <Button asChild variant="outline" className="h-12 gap-2 rounded-full px-5 text-sm font-semibold">
                <Link href="/how-it-works">
                  <Play className="h-4 w-4" />
                  Watch 60-second demo
                </Link>
              </Button>
            </div>
          </div>

          <BidDocumentArt />
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/5" />
      </section>

      {/* Progress + This month */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className={`${CARD} p-6 sm:p-7`}>
          <h3 className="text-lg font-bold text-foreground">Your progress</h3>
          <div className="mt-4 flex flex-col">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className={`flex items-center gap-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    s.done
                      ? "bg-green-100 text-green-600"
                      : s.next
                        ? "border-2 border-primary text-primary"
                        : "border-2 border-border text-muted-foreground"
                  }`}
                >
                  {s.done ? <Check className="h-4 w-4" /> : s.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{s.n}. {s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.sub}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    s.done
                      ? "bg-green-100 text-green-700"
                      : s.next
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.done ? "Complete" : s.next ? "Next up" : "Not started"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${CARD} p-6 sm:p-7`}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-foreground">This month</h3>
            <button
              type="button"
              onClick={onEditGoal}
              className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit goal
            </button>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight text-primary">{bidsCount}</span>
            <span className="text-2xl font-bold text-foreground">/ {goal}</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">bids created</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            You&apos;re just getting started. Let&apos;s build some bids and grow your business.
          </p>
        </section>
      </div>

      {/* Empty bids */}
      <section className={`${CARD} p-8 text-center`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Your bids</h3>
          <Button asChild variant="outline" className="rounded-full text-sm font-semibold">
            <Link href="/contractors/bids-history">View all bids</Link>
          </Button>
        </div>
        <div className="flex flex-col items-center py-8">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <p className="font-bold text-foreground">You haven&apos;t built any bids yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Build your first bid and it will appear here.</p>
          <Button onClick={onBuild} className="mt-5 h-11 gap-2 rounded-xl px-6 font-semibold">
            <Sparkles className="h-[18px] w-[18px]" />
            Build My First Bid
          </Button>
        </div>
      </section>

      <NeedHelpBar />
    </div>
  );
}

// ── Seasoned dashboard (>=1 bid) ──────────────────────────────────────────────

function SeasonedDashboard({
  name,
  greeting,
  proposals,
  profile,
  threads,
  bidsCount,
  goal,
  percent,
  remaining,
  onBuild,
  onEditGoal,
}: {
  name: string;
  greeting: string;
  proposals: Proposal[];
  profile: ContractorProfile | null;
  threads: import("@/lib/use-contractor-signals").ContractorThread[];
  bidsCount: number;
  goal: number;
  percent: number;
  remaining: number;
  onBuild: () => void;
  onEditGoal: () => void;
}) {
  const recent = useMemo(
    () =>
      [...proposals]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5),
    [proposals],
  );

  const messageItems = unansweredThreads(threads).slice(0, 2);
  const { missing, isComplete } = profileCompletion(profile);
  const attentionCount = messageItems.length + (isComplete ? 0 : 1);

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground">{greeting}, {name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">Keep the momentum going. Your next bid is one click away.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button asChild variant="outline" className="h-12 gap-2 rounded-xl px-5 font-semibold">
            <Link href="/contractors/messages">
              <MessageSquareText className="h-[18px] w-[18px]" />
              Messages
            </Link>
          </Button>
          <Button onClick={onBuild} className="h-12 gap-2 rounded-xl px-5 font-semibold">
            <Sparkles className="h-[18px] w-[18px]" />
            Build Today&apos;s Bid
          </Button>
        </div>
      </div>

      {/* Tracker */}
      <section className={`${CARD} relative grid gap-8 overflow-hidden p-7 md:grid-cols-[1.45fr_0.55fr]`}>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">Monthly bid goal</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-primary">{bidsCount}</span>
                <span className="text-3xl font-bold text-foreground">/ {goal}</span>
                <span className="ml-1 text-sm font-medium text-muted-foreground">bids created</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditGoal}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit goal
            </button>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-2.5 flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{percent}%</strong> of your goal</span>
            <span><strong className="text-foreground">{remaining} bid{remaining === 1 ? "" : "s"}</strong> to go</span>
          </div>
        </div>
        <div className="flex flex-col justify-center border-t border-border pt-5 md:border-l md:border-t-0 md:pl-7 md:pt-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.07em] text-muted-foreground">Today&apos;s focus</p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground">Send one more bid.</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Small daily wins keep your pipeline moving.</p>
          <Button onClick={onBuild} className="mt-4 gap-2 self-start rounded-xl font-semibold">
            Build a Bid
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-primary/5" />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_0.7fr]">
        {/* Your bids */}
        <section className={`${CARD} p-6`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Your bids</h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{bidsCount} this month</span>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full text-sm font-semibold">
              <Link href="/contractors/bids-history">View all</Link>
            </Button>
          </div>

          <div className="flex flex-col">
            {recent.map((p, i) => {
              const meta = statusMeta(p.status);
              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-[1fr_auto] items-center gap-3 py-4 sm:grid-cols-[minmax(0,1.4fr)_120px_120px_100px_36px] ${
                    i > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{p.project_title}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{p.homeowner_name || "Homeowner"}</p>
                  </div>
                  <div className="hidden font-bold text-foreground sm:block">{formatPrice(p.total_price)}</div>
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                  </div>
                  <div className="hidden text-sm text-muted-foreground sm:block">{shortDate(p.created_at)}</div>
                  <a
                    href={`/p/${p.share_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                    aria-label={`View ${p.project_title}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex justify-center">
            <Button asChild variant="ghost" className="gap-1.5 text-sm font-semibold text-primary">
              <Link href="/contractors/bids-history">
                See all bids
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Side stack */}
        <aside className="flex flex-col gap-5">
          <section className={`${CARD} p-6`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Needs attention</h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{attentionCount}</span>
            </div>

            {messageItems.map((t, i) => (
              <div key={t.job_ref} className={`py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <p className="font-semibold text-foreground">
                  {t.display_name ? `${t.display_name} replied to your bid` : "New homeowner message"}
                </p>
                {t.last_message && <p className="mb-2 mt-1 line-clamp-2 text-sm text-muted-foreground">&ldquo;{t.last_message}&rdquo;</p>}
                <Link href="/contractors/messages" className="text-sm font-bold text-primary hover:underline">Reply now →</Link>
              </div>
            ))}

            {!isComplete && (
              <div className={`py-3 ${messageItems.length > 0 ? "border-t border-border" : ""}`}>
                <p className="font-semibold text-foreground">Profile is almost complete</p>
                <p className="mb-2 mt-1 text-sm text-muted-foreground">
                  Add {missing.slice(0, 2).map((k) => PROFILE_FIELD_LABELS[k]).join(" and ")}.
                </p>
                <Link href="/contractors/profile" className="text-sm font-bold text-primary hover:underline">Finish profile →</Link>
              </div>
            )}

            {attentionCount === 0 && (
              <p className="py-3 text-sm text-muted-foreground">Nothing needs your attention right now.</p>
            )}
          </section>

          <section className="rounded-[22px] border-0 bg-gradient-to-br from-primary to-sky-400 p-6 text-primary-foreground shadow-[0_10px_30px_rgba(16,17,20,0.06)]">
            <h2 className="text-xl font-bold tracking-tight">Nice work</h2>
            <p className="mt-1.5 leading-relaxed opacity-90">
              You&apos;ve created {bidsCount} bid{bidsCount === 1 ? "" : "s"} this month. Keep your pace and you&apos;ll hit {goal}.
            </p>
            <Button
              onClick={onBuild}
              variant="secondary"
              className="mt-4 rounded-xl bg-white font-semibold text-primary hover:bg-white/90"
            >
              Build another bid
            </Button>
          </section>
        </aside>
      </div>

      <NeedHelpBar />
    </div>
  );
}

// ── Shared pieces ─────────────────────────────────────────────────────────────

function NeedHelpBar() {
  return (
    <section className={`${CARD} flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <MessageSquareText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground">Need help?</p>
          <p className="text-sm text-muted-foreground">Text our support team. We&apos;re here 7 days a week.</p>
        </div>
      </div>
      <Button asChild variant="outline" className="gap-2 rounded-full font-semibold">
        <a href={getContractorSmsLink("I need help with HomeBids")}>
          <MessageSquareText className="h-4 w-4" />
          Text Support
        </a>
      </Button>
    </section>
  );
}

/** Lightweight faux "Project Bid" document used in the new-user hero. */
function BidDocumentArt() {
  return (
    <div className="relative mx-auto hidden w-full max-w-[260px] md:block" aria-hidden="true">
      <div className="rotate-3 rounded-2xl border border-border bg-card p-5 shadow-[0_20px_40px_rgba(16,17,20,0.10)]">
        <p className="text-sm font-bold italic text-foreground">Project Bid</p>
        <div className="mt-4 space-y-2.5">
          <div className="h-2.5 w-3/4 rounded-full bg-muted" />
          <div className="h-2.5 w-full rounded-full bg-muted" />
          <div className="h-2.5 w-2/3 rounded-full bg-muted" />
        </div>
        <div className="mt-6 space-y-2.5">
          <div className="h-2.5 w-1/2 rounded-full bg-muted" />
          <div className="h-2.5 w-5/6 rounded-full bg-muted" />
        </div>
        <div className="mt-6 flex items-center justify-end">
          <span className="text-2xl font-extrabold text-primary">$</span>
        </div>
      </div>
      <div className="absolute -bottom-3 -right-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
        <Check className="h-7 w-7" />
      </div>
    </div>
  );
}
