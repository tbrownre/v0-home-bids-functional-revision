"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, MessageSquareText, Mail, MapPin, Camera, ScrollText, FileText,
  ExternalLink, CheckCircle2, User, CalendarClock, PartyPopper,
} from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { Button } from "@/components/ui/button";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { createClient } from "@/lib/supabase/client";
import { getApprovedProject, type ApprovedProject } from "@/lib/supabase/project-handoff";
import { formatPrice } from "@/lib/proposal-format";
import { serviceLabel, firstNameOf } from "@/lib/page-lead-label";

/**
 * /contractors/project/<share_token> — the APPROVED project handoff (Tim, Oct 6):
 * full accepted bid, scope, price, photos, the homeowner's real contact info
 * (released because they accepted), the conversation, and the next-step actions.
 */

interface ThreadMsg { sender?: string; kind?: string; body?: string; created_at?: string; meta?: { url?: string } | null }

function prettyPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  const n = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return n.length === 10 ? `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` : e164;
}
const itemText = (it: { description?: string | null; amount?: number | null } | string) =>
  typeof it === "string" ? { d: it, a: null as number | null } : { d: String(it.description ?? ""), a: typeof it.amount === "number" ? it.amount : null };

export default function ApprovedProjectPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const [project, setProject] = useState<ApprovedProject | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ThreadMsg[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (cancelled) return;
      if (!user) { window.location.replace("/auth/sign-in?redirect=" + encodeURIComponent(window.location.pathname)); return; }
      if (user.role !== "contractor" && user.role !== "admin") {
        window.location.replace("/auth/sign-in?redirect=" + encodeURIComponent(window.location.pathname) + "&switch=1");
        return;
      }
      try {
        const res = await getApprovedProject(shareToken);
        if (cancelled) return;
        setProject(res.project);
        setErr(res.error);
        if (res.project?.c_token) {
          try {
            const { data } = await createClient().rpc("get_contractor_thread", { p_token: res.project.c_token });
            const list = (data as { messages?: ThreadMsg[] } | null)?.messages;
            if (!cancelled && Array.isArray(list)) {
              setMessages([...list].sort((a, b) => (a.created_at ? +new Date(a.created_at) : 0) - (b.created_at ? +new Date(b.created_at) : 0)));
            }
          } catch { /* transcript is a bonus, never fatal */ }
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shareToken]);

  const first = firstNameOf(project?.homeowner_name);
  const smsBody = useMemo(() => {
    const svc = serviceLabel(project?.category).toLowerCase();
    return `Hi${first ? " " + first : ""}, this is about your approved ${svc} project${project?.job_ref ? ` (${project.job_ref})` : ""} — let's get it scheduled.`;
  }, [project, first]);

  const Label = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">{children}</p>
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ContractorTopbar />
      <main className="mx-auto w-[min(980px,calc(100%-32px))] py-6 md:py-8">
        <Link href="/contractors/bids-history" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to bids
        </Link>

        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading project…</p>
        ) : !project ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-semibold text-foreground">{err || "Project not found"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Only accepted bids open here. Check Your Bids for the status.</p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="mt-4 rounded-[22px] border border-border bg-card p-6 shadow-[0_10px_30px_rgba(16,17,20,0.06)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                    <PartyPopper className="h-3.5 w-3.5" /> APPROVED
                  </span>
                  <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    {first ? `${first}'s ` : ""}{serviceLabel(project.category)} Project
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.project_title}
                    {project.job_ref ? ` · ${project.job_ref}` : ""}
                    {project.accepted_at ? ` · accepted ${new Date(project.accepted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Label>Approved price</Label>
                  <p className="text-3xl font-extrabold text-foreground">{formatPrice(project.total_price)}</p>
                  {project.price_note && <p className="mt-0.5 max-w-[220px] text-xs text-muted-foreground">{project.price_note}</p>}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.homeowner_phone && (
                  <>
                    <Button asChild className="gap-1.5 rounded-full font-semibold">
                      <a href={`tel:${project.homeowner_phone}`}><Phone className="h-4 w-4" /> Call {first || "homeowner"}</a>
                    </Button>
                    <Button asChild variant="outline" className="gap-1.5 rounded-full font-semibold">
                      <a href={`sms:${project.homeowner_phone}?&body=${encodeURIComponent(smsBody)}`}><MessageSquareText className="h-4 w-4" /> Text to schedule</a>
                    </Button>
                  </>
                )}
                <Button asChild variant="outline" className="gap-1.5 rounded-full font-semibold">
                  <a href={`/p/${project.share_token}`} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /> View accepted bid</a>
                </Button>
                {project.pdf_url && (
                  <Button asChild variant="outline" className="gap-1.5 rounded-full font-semibold">
                    <a href={project.pdf_url} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4" /> PDF</a>
                  </Button>
                )}
                {project.c_token && (
                  <Button asChild variant="outline" className="gap-1.5 rounded-full font-semibold">
                    <a href={`/c/${project.c_token}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /> Open workspace</a>
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              {/* ── Left: the job ── */}
              <div className="space-y-5">
                <section className="rounded-[22px] border border-border bg-card p-6">
                  <div className="flex items-start gap-2.5">
                    <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <Label>Scope of work</Label>
                      {project.scope_items.length ? (
                        <ul className="mt-2 space-y-2">
                          {project.scope_items.map((it, i) => {
                            const { d, a } = itemText(it);
                            return (
                              <li key={i} className="flex items-start justify-between gap-3 text-sm">
                                <span className="flex items-start gap-2 text-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{d}</span>
                                {a != null && <span className="shrink-0 font-semibold text-foreground">{formatPrice(a)}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-foreground">{project.project_summary || project.description || "See the accepted bid."}</p>
                      )}
                      {project.add_ons.length > 0 && (
                        <>
                          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">Add-ons</p>
                          <ul className="mt-1.5 space-y-1.5">
                            {project.add_ons.map((it, i) => {
                              const { d, a } = itemText(it);
                              return <li key={i} className="flex items-start justify-between gap-3 text-sm text-foreground"><span>{d}</span>{a != null && <span className="font-semibold">{formatPrice(a)}</span>}</li>;
                            })}
                          </ul>
                        </>
                      )}
                      {(project.project_summary || project.description) && project.scope_items.length > 0 && (
                        <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{project.project_summary || project.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div><Label>Location</Label><p className="mt-0.5 text-sm text-foreground">{[project.location, project.zip_code].filter(Boolean).join(" ") || "Ask the homeowner"}</p></div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div><Label>Timeline</Label><p className="mt-0.5 text-sm text-foreground">{project.timeline_completion || "Set it when you schedule"}</p></div>
                    </div>
                  </div>
                  {project.images.length > 0 && (
                    <div className="mt-5 flex items-start gap-2.5">
                      <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <Label>Photos ({project.images.length})</Label>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {project.images.map((src, i) => (
                            <a key={src + i} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border bg-card">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={`Project photo ${i + 1}`} loading="lazy" className="h-24 w-24 object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* ── Correspondence ── */}
                <section className="rounded-[22px] border border-border bg-card p-6">
                  <Label>Conversation on this job</Label>
                  {messages.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No messages yet — texting {first || "the homeowner"} starts the thread.</p>
                  ) : (
                    <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
                      {messages.map((m, i) => {
                        const mine = m.sender === "contractor";
                        return (
                          <div key={i} className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                            {m.kind === "photo" && m.meta?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.meta.url} alt="Shared" className="max-h-40 rounded-lg" />
                            ) : (
                              <span className="whitespace-pre-wrap">{m.body}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {project.c_token && (
                    <a href={`/c/${project.c_token}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                      Reply in the workspace <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </section>
              </div>

              {/* ── Right: the homeowner ── */}
              <section className="h-fit rounded-[22px] border border-border bg-card p-6">
                <div className="flex items-start gap-2.5">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <Label>Homeowner</Label>
                    <p className="mt-0.5 text-lg font-bold text-foreground">{project.homeowner_name || "Name not on file"}</p>
                    {project.homeowner_phone ? (
                      <p className="mt-1 font-mono text-sm text-foreground">{prettyPhone(project.homeowner_phone)}</p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">No phone on file — use the workspace chat.</p>
                    )}
                    {project.homeowner_email && (
                      <a href={`mailto:${project.homeowner_email}`} className="mt-1 flex items-center gap-1.5 truncate text-sm text-primary hover:underline">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {project.homeowner_email}
                      </a>
                    )}
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {[project.location, project.zip_code].filter(Boolean).join(" ") || "Address: confirm when scheduling"}
                    </p>
                    <p className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-800">
                      Contact info is unlocked because {first || "the homeowner"} accepted your bid. Next step: call or text to schedule.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
