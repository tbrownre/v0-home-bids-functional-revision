"use client";

import { useState } from "react";
import {
  BarChart2,
  CreditCard,
  Users,
  Home,
  Radio,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import {
  REVENUE,
  OVERVIEW_STATS,
  AFFILIATE_PARTNERS,
  DEMO_CONTRACTORS,
  HOMEOWNER_JOBS,
  OUTREACH_RECORDS,
  BID_RECORDS,
  type ContractorStatus,
  type JobStatus,
  type OutreachStatus,
  type BidStatus,
} from "@/lib/mock-admin-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return "$" + n.toLocaleString("en-US");
}

function fmtK(n: number) {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(0) + "K";
  return "$" + n;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const CONTRACT_STATUS_STYLES: Record<ContractorStatus, string> = {
  Active:    "bg-green-100 text-green-800",
  Trial:     "bg-blue-100 text-blue-800",
  "Past Due": "bg-amber-100 text-amber-800",
  Canceled:  "bg-red-100 text-red-800",
};

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  "Awaiting Bids": "bg-blue-100 text-blue-800",
  "In Review":     "bg-amber-100 text-amber-800",
  Awarded:         "bg-green-100 text-green-800",
  Completed:       "bg-gray-100 text-gray-700",
  Canceled:        "bg-red-100 text-red-800",
};

const OUTREACH_STATUS_STYLES: Record<OutreachStatus, string> = {
  "In Progress":       "bg-blue-100 text-blue-800",
  Completed:           "bg-green-100 text-green-800",
  Stalled:             "bg-red-100 text-red-800",
  "Awaiting Response": "bg-amber-100 text-amber-800",
};

const BID_STATUS_STYLES: Record<BidStatus, string> = {
  "Pending Review":      "bg-amber-100 text-amber-800",
  Accepted:              "bg-green-100 text-green-800",
  Declined:              "bg-red-100 text-red-800",
  "Under Consideration": "bg-blue-100 text-blue-800",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-[#0A84FF]/20 bg-[#0A84FF]/5"
          : "border-black/8 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            accent ? "bg-[#0A84FF]/10 text-[#0A84FF]" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-[#0A84FF]" : "text-gray-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

// ── Table wrapper — scrolls on mobile ─────────────────────────────────────────

function ScrollTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-black/8 bg-white">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-black/6 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-gray-700 ${className}`}>{children}</td>;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "overview" | "revenue" | "affiliates" | "contractors" | "jobs" | "outreach" | "bids";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview",     label: "Overview",       icon: BarChart2 },
  { key: "revenue",      label: "Revenue",         icon: DollarSign },
  { key: "affiliates",   label: "Affiliates",      icon: TrendingUp },
  { key: "contractors",  label: "Contractors",     icon: Users },
  { key: "jobs",         label: "Job Requests",    icon: Home },
  { key: "outreach",     label: "Outreach",        icon: Radio },
  { key: "bids",         label: "Bid Queue",       icon: ClipboardList },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminDemoPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      {/* Page heading */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            All figures are illustrative demo data only.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 w-full overflow-x-auto">
        <div className="flex min-w-max gap-1 rounded-xl border border-black/8 bg-white p-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                tab === key
                  ? "bg-[#0A84FF] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <Section title="Platform Overview">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard label="Subscribed Contractors" value={OVERVIEW_STATS.subscribedContractors.toLocaleString()} icon={Users} accent />
              <StatCard label="Gross MRR"              value={fmt$(OVERVIEW_STATS.grossMRR)}  sub="482 × $99/mo"     icon={DollarSign} accent />
              <StatCard label="ARR"                    value={fmtK(OVERVIEW_STATS.ARR)}       sub="Annualized"       icon={TrendingUp} accent />
              <StatCard label="Net MRR (after payouts)"value={fmt$(OVERVIEW_STATS.netMRR)}   sub="After affiliates" icon={CreditCard} accent />
              <StatCard label="Monthly Affiliate Payouts" value={fmt$(OVERVIEW_STATS.monthlyAffiliatePayouts)} sub="20% on referred subs" icon={TrendingUp} />
              <StatCard label="Homeowner Jobs (month)" value={OVERVIEW_STATS.homeownerJobsThisMonth.toString()} icon={Home} />
              <StatCard label="Jobs in Outreach"       value={OVERVIEW_STATS.jobsInOutreach.toString()} icon={Radio} />
              <StatCard label="Bids Received"          value={OVERVIEW_STATS.bidsReceived.toString()} icon={ClipboardList} />
              <StatCard label="Jobs Awarded"           value={OVERVIEW_STATS.jobsAwarded.toString()} icon={CheckCircle2} />
              <StatCard label="Contractor Pipeline Value" value={fmtK(OVERVIEW_STATS.contractorPipelineValue)} sub="Est. bid value in system" icon={Briefcase} />
            </div>
          </Section>
        </div>
      )}

      {/* ── Revenue ── */}
      {tab === "revenue" && (
        <div className="space-y-6">
          <Section title="Subscription Revenue">
            {/* Plan card */}
            <div className="mb-6 rounded-2xl border border-[#0A84FF]/20 bg-[#0A84FF]/5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0A84FF]">Only Plan</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900">Contractor Plan</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    One flat monthly subscription — no bid fees, no tiers, no setup costs.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#0A84FF]">$99<span className="text-base font-medium text-gray-400">/mo</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Subscribers"  value={REVENUE.subscribedContractors.toLocaleString()} icon={Users}       accent />
              <StatCard label="Gross MRR"    value={fmt$(REVENUE.grossMRR)}                         icon={DollarSign}  accent />
              <StatCard label="ARR"          value={fmtK(REVENUE.ARR)}                              icon={TrendingUp}  accent />
              <StatCard label="Plan Price"   value={fmt$(REVENUE.planPrice) + "/mo"}                icon={CreditCard} />
            </div>

            <div className="mt-6 rounded-2xl border border-black/8 bg-white p-5">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Revenue Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: "Gross MRR",                     value: fmt$(REVENUE.grossMRR),                note: "482 × $99" },
                  { label: "Affiliate-attributed MRR",       value: fmt$(REVENUE.affiliateAttributedMRR),  note: "214 referred contractors × $99" },
                  { label: "Monthly affiliate payouts (20%)",value: `−${fmt$(REVENUE.monthlyAffiliatePayouts)}`, note: "Paid to affiliate partners", negative: true },
                  { label: "Net MRR after affiliate payouts",value: fmt$(REVENUE.netMRR),                 note: "", bold: true },
                  { label: "ARR",                            value: fmtK(REVENUE.ARR),                    note: "Gross MRR × 12", bold: true },
                ].map((row) => (
                  <div key={row.label} className={`flex items-center justify-between gap-4 ${row.bold ? "border-t border-black/8 pt-3" : ""}`}>
                    <div>
                      <p className={`text-sm ${row.bold ? "font-bold text-gray-900" : "text-gray-700"}`}>{row.label}</p>
                      {row.note && <p className="text-xs text-gray-400">{row.note}</p>}
                    </div>
                    <p className={`text-sm font-semibold ${row.negative ? "text-red-600" : row.bold ? "text-[#0A84FF]" : "text-gray-900"}`}>
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── Affiliates ── */}
      {tab === "affiliates" && (
        <div className="space-y-6">
          <Section title="Affiliate Payouts">
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Total Subscribers"         value={REVENUE.subscribedContractors.toLocaleString()} icon={Users} />
              <StatCard label="Affiliate-referred"        value={REVENUE.affiliateReferredContractors.toString()} sub="of 482 total"       icon={TrendingUp} accent />
              <StatCard label="Direct"                    value={REVENUE.directContractors.toString()}             sub="of 482 total"       icon={Users} />
              <StatCard label="Affiliate-attributed MRR"  value={fmt$(REVENUE.affiliateAttributedMRR)}            sub="214 × $99"          icon={DollarSign} />
              <StatCard label="Payout Rate"               value="20%"                                             sub="On referred subs"   icon={CreditCard} />
              <StatCard label="Monthly Payouts"           value={fmt$(REVENUE.monthlyAffiliatePayouts)}           sub="Paid to partners"   icon={DollarSign} accent />
            </div>

            <ScrollTable>
              <thead>
                <tr>
                  <Th>Partner / Community</Th>
                  <Th>Referred Contractors</Th>
                  <Th>Attributed MRR</Th>
                  <Th>Monthly Payout (20%)</Th>
                </tr>
              </thead>
              <tbody>
                {AFFILIATE_PARTNERS.map((p, i) => (
                  <tr key={p.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <Td><span className="font-medium text-gray-900">{p.name}</span></Td>
                    <Td>{p.referredContractors}</Td>
                    <Td>{fmt$(p.referredContractors * 99)}</Td>
                    <Td className="font-semibold text-[#0A84FF]">{fmt$(p.monthlyPayout)}</Td>
                  </tr>
                ))}
                <tr className="border-t border-black/10 bg-gray-50 font-semibold">
                  <Td><span className="font-bold text-gray-900">Total</span></Td>
                  <Td className="font-bold text-gray-900">{REVENUE.affiliateReferredContractors}</Td>
                  <Td className="font-bold text-gray-900">{fmt$(REVENUE.affiliateAttributedMRR)}</Td>
                  <Td className="font-bold text-[#0A84FF]">{fmt$(REVENUE.monthlyAffiliatePayouts)}</Td>
                </tr>
              </tbody>
            </ScrollTable>
          </Section>
        </div>
      )}

      {/* ── Contractors ── */}
      {tab === "contractors" && (
        <div className="space-y-6">
          <Section title="Contractor Management">
            <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>482 total subscribed contractors — all on <strong className="text-gray-800">Contractor Plan ($99/mo)</strong></span>
            </div>
            <ScrollTable>
              <thead>
                <tr>
                  <Th>Business</Th>
                  <Th>Trade</Th>
                  <Th>Location</Th>
                  <Th>Plan</Th>
                  <Th>Status</Th>
                  <Th>Contact</Th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CONTRACTORS.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <Td><span className="font-medium text-gray-900">{c.businessName}</span></Td>
                    <Td>{c.trade}</Td>
                    <Td>{c.city}, {c.state}</Td>
                    <Td><span className="text-[#0A84FF] font-medium">{c.plan}</span></Td>
                    <Td><Badge label={c.status} className={CONTRACT_STATUS_STYLES[c.status]} /></Td>
                    <Td className="text-gray-500">{c.contact}</Td>
                  </tr>
                ))}
              </tbody>
            </ScrollTable>
            <p className="mt-3 text-center text-xs text-gray-400">
              Showing 12 of 482 subscribed contractors for demo purposes.
            </p>
          </Section>
        </div>
      )}

      {/* ── Job Requests ── */}
      {tab === "jobs" && (
        <div className="space-y-6">
          <Section title="Homeowner Job Requests">
            <ScrollTable>
              <thead>
                <tr>
                  <Th>Homeowner</Th>
                  <Th>Project</Th>
                  <Th>Location</Th>
                  <Th>Timeline</Th>
                  <Th>Budget</Th>
                  <Th>Status</Th>
                  <Th>Contacted</Th>
                  <Th>Bids</Th>
                  <Th>Awarded To</Th>
                </tr>
              </thead>
              <tbody>
                {HOMEOWNER_JOBS.map((j, i) => (
                  <tr key={j.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <Td><span className="font-medium text-gray-900">{j.homeownerName}</span></Td>
                    <Td>{j.projectType}</Td>
                    <Td>{j.city}, {j.zip}</Td>
                    <Td className="whitespace-nowrap">{j.timeline}</Td>
                    <Td className="whitespace-nowrap">{j.budgetRange}</Td>
                    <Td><Badge label={j.status} className={JOB_STATUS_STYLES[j.status]} /></Td>
                    <Td className="text-center">{j.contractorsContacted}</Td>
                    <Td className="text-center">{j.bidsReceived}</Td>
                    <Td className="text-gray-500 text-xs">{j.awardedContractor ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </ScrollTable>
          </Section>
        </div>
      )}

      {/* ── Outreach ── */}
      {tab === "outreach" && (
        <div className="space-y-6">
          <Section title="Contractor Outreach Tracker">
            <ScrollTable>
              <thead>
                <tr>
                  <Th>Job</Th>
                  <Th>Trade</Th>
                  <Th>Discovered</Th>
                  <Th>Contacted</Th>
                  <Th>Emails Sent</Th>
                  <Th>Replies</Th>
                  <Th>Bids</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {OUTREACH_RECORDS.map((o, i) => (
                  <tr key={o.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <Td><span className="font-medium text-gray-900">{o.jobTitle}</span></Td>
                    <Td>{o.trade}</Td>
                    <Td className="text-center">{o.contractorsDiscovered}</Td>
                    <Td className="text-center">{o.contractorsContacted}</Td>
                    <Td className="text-center">{o.emailsSent}</Td>
                    <Td className="text-center">{o.repliesReceived}</Td>
                    <Td className="text-center">{o.bidsSubmitted}</Td>
                    <Td><Badge label={o.status} className={OUTREACH_STATUS_STYLES[o.status]} /></Td>
                  </tr>
                ))}
              </tbody>
            </ScrollTable>
          </Section>
        </div>
      )}

      {/* ── Bid Queue ── */}
      {tab === "bids" && (
        <div className="space-y-6">
          <Section title="Bid Review Queue">
            <ScrollTable>
              <thead>
                <tr>
                  <Th>Contractor</Th>
                  <Th>Job</Th>
                  <Th>Bid Amount</Th>
                  <Th>Timeline</Th>
                  <Th>Status</Th>
                  <Th>AI Summary</Th>
                  <Th>Homeowner Action</Th>
                </tr>
              </thead>
              <tbody>
                {BID_RECORDS.map((b, i) => (
                  <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <Td><span className="font-medium text-gray-900">{b.contractor}</span></Td>
                    <Td className="text-xs">{b.job}</Td>
                    <Td className="font-semibold text-gray-900">{fmt$(b.bidAmount)}</Td>
                    <Td className="whitespace-nowrap">{b.estimatedTimeline}</Td>
                    <Td><Badge label={b.status} className={BID_STATUS_STYLES[b.status]} /></Td>
                    <Td>
                      {b.hasAiSummary ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0A84FF]">
                          <Sparkles className="h-3 w-3" /> Available
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </Td>
                    <Td className="text-xs text-gray-500">{b.homeownerAction}</Td>
                  </tr>
                ))}
              </tbody>
            </ScrollTable>
          </Section>
        </div>
      )}
    </main>
  );
}
