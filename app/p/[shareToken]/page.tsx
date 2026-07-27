import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import {
  CheckCircle2,
  CalendarClock,
  CalendarCheck,
  ShieldCheck,
  Plus,
  FileText,
} from "lucide-react";
import {
  getProposalByShareToken,
  logProposalView,
  type Proposal,
} from "@/lib/supabase/proposals";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice, formatDate } from "@/lib/proposal-format";
import { ProposalCta } from "@/components/proposal/proposal-cta";

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params;
  const { proposal } = await getProposalByShareToken(shareToken);
  if (!proposal) return { title: "Proposal — HomeBids" };
  const company = proposal.contractor_company_name ?? "Your Contractor";
  return {
    title: `${proposal.project_title} · ${company}`,
    description: proposal.project_summary ?? `A proposal from ${company}.`,
    robots: { index: false, follow: false },
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

export default async function HostedProposalPage({ params }: PageProps) {
  const { shareToken } = await params;
  const { proposal } = await getProposalByShareToken(shareToken);

  if (!proposal) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Proposal not found</h1>
        <p className="max-w-sm text-muted-foreground">
          This proposal link may have expired or is no longer available. Please contact your
          contractor for an updated link.
        </p>
      </main>
    );
  }

  // Fetch contractor profile data for trust badges (bypass RLS with admin client)
  let contractorProfile: { license_number?: string | null; insurance_details?: string | null } | null = null;
  if (proposal.contractor_id) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('contractor_profiles')
        .select('license_number, insurance_details')
        .eq('id', proposal.contractor_id)
        .maybeSingle();
      contractorProfile = data || null;
    } catch (e) {
      // Best-effort — proposal still renders if profile fetch fails
      console.error('[proposal-page] Contractor profile fetch failed:', e);
    }
  }

  // Lightweight, best-effort view tracking. Captured server-side so it works
  // even with JS disabled. Never blocks or breaks the render.
  const h = await headers();
  await logProposalView(shareToken, {
    userAgent: h.get("user-agent"),
    referrer: h.get("referer"),
  });

  return <ProposalDocument proposal={proposal} shareToken={shareToken} contractorProfile={contractorProfile} />;
}

function ProposalDocument({
  proposal,
  shareToken,
  contractorProfile,
}: {
  proposal: Proposal;
  shareToken: string;
  contractorProfile?: { license_number?: string | null; insurance_details?: string | null } | null;
}) {
  const preparedDate = formatDate(proposal.created_at);
  const hasAddOns = proposal.add_ons.length > 0;
  const hasPhotos = proposal.photos.length > 0;
  const hasTimeline = Boolean(proposal.timeline_start || proposal.timeline_completion);

  // Determine which trust badges to show
  const hasLicense = Boolean(contractorProfile?.license_number);
  const hasInsurance = Boolean(contractorProfile?.insurance_details);
  const hasTrustBadges = hasLicense || hasInsurance;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 sm:px-6 sm:pt-10">
        {/* ── Header — contractor is the hero ── */}
        <header className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-4">
            {proposal.contractor_logo_url ? (
              <Image
                src={proposal.contractor_logo_url || "/placeholder.svg"}
                alt={`${proposal.contractor_company_name ?? "Contractor"} logo`}
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                {(proposal.contractor_company_name ?? "HB").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-foreground">
                {proposal.contractor_company_name ?? "Your Contractor"}
              </p>
              {/* Conditional trust badges — only show if contractor has the data */}
              {hasTrustBadges && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {hasLicense && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <ShieldCheck className="h-3 w-3" />
                      Licensed{contractorProfile?.license_number && ` #${contractorProfile.license_number.slice(-4)}`}
                    </span>
                  )}
                  {hasInsurance && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <ShieldCheck className="h-3 w-3" />
                      Insured
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Proposal
            </span>
            <h1 className="mt-1.5 text-pretty text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {proposal.project_title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {proposal.homeowner_name && (
                <span>
                  Prepared for{" "}
                  <span className="font-medium text-foreground">{proposal.homeowner_name}</span>
                </span>
              )}
              {preparedDate && <span>Prepared {preparedDate}</span>}
            </div>
          </div>
        </header>

        {/* ── Project Summary ── */}
        {proposal.project_summary && (
          <section className="mt-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <SectionTitle>Project Summary</SectionTitle>
            <p className="text-pretty leading-relaxed text-foreground/90">
              {proposal.project_summary}
            </p>
          </section>
        )}

        {/* ── Scope of Work — strongest visual section ── */}
        {proposal.scope_items.length > 0 && (
          <section className="mt-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <SectionTitle>Scope of Work</SectionTitle>
            <ul className="divide-y divide-border">
              {proposal.scope_items.map((item, i) => (
                <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Pricing card ── */}
        <section className="mt-4 rounded-3xl border-2 border-primary/20 bg-primary/5 p-6 sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">Total Estimate</p>
          <p className="mt-1 text-4xl font-bold text-foreground sm:text-5xl">
            {formatPrice(proposal.total_price)}
          </p>
          {proposal.price_note && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {proposal.price_note}
            </p>
          )}
        </section>

        {/* ── Optional Add-Ons ── */}
        {hasAddOns && (
          <section className="mt-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <SectionTitle>Optional Add-Ons</SectionTitle>
            <ul className="divide-y divide-border">
              {proposal.add_ons.map((addon, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2 text-foreground">
                    <Plus className="h-4 w-4 text-primary" />
                    {addon.title}
                  </span>
                  {addon.price != null && (
                    <span className="shrink-0 font-semibold text-foreground">
                      +{formatPrice(addon.price)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Timeline ── */}
        {hasTimeline && (
          <section className="mt-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <SectionTitle>Timeline</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {proposal.timeline_start && (
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Estimated Start
                    </p>
                    <p className="mt-0.5 font-medium text-foreground">{proposal.timeline_start}</p>
                  </div>
                </div>
              )}
              {proposal.timeline_completion && (
                <div className="flex items-start gap-3">
                  <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Estimated Completion
                    </p>
                    <p className="mt-0.5 font-medium text-foreground">
                      {proposal.timeline_completion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Notes / Exclusions ── */}
        {proposal.notes && (
          <section className="mt-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <SectionTitle>Notes &amp; Exclusions</SectionTitle>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {proposal.notes}
            </p>
          </section>
        )}

        {/* ── Photos ── */}
        {hasPhotos && (
          <section className="mt-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <SectionTitle>Photos</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {proposal.photos.map((photo, i) => (
                <figure key={i} className="overflow-hidden rounded-xl border border-border">
                  <Image
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.caption ?? `Project photo ${i + 1}`}
                    width={300}
                    height={300}
                    className="aspect-square w-full object-cover"
                  />
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ── Inline CTA (full set) ── */}
        <section className="mt-6">
          <ProposalCta
            shareToken={shareToken}
            contractorPhone={proposal.contractor_phone}
            homeownerName={proposal.homeowner_name}
            projectTitle={proposal.project_title}
            pdfUrl={proposal.pdf_url}
            variant="inline"
          />
        </section>

        {/* ── Subtle HomeBids branding ── */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">Proposal generated with HomeBids.ai</p>
        </footer>
      </div>
    </div>
  );
}
