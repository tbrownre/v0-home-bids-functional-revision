"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Eye,
  CheckCircle2,
  Copy,
  Edit3,
  MessageCircle,
  FileText,
  Calculator,
  Sparkles,
  ArrowLeft,
  Send,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
interface AiBid {
  id: string;
  title: string;
  type: "estimate" | "template" | "response" | "draft";
  summary: string;
  amount?: string;
  status: "draft" | "ready" | "sent";
  createdAt: Date;
}

// Offsets applied after mount to keep server/client hydration in sync.
const DEMO_AI_BID_TEMPLATES: Array<Omit<AiBid, "createdAt"> & { offsetMs: number }> = [
  {
    id: "ai-1",
    title: "HVAC Repair Estimate",
    type: "estimate",
    summary: "3-zone system diagnostic, refrigerant recharge, and capacitor replacement. Labor + parts included.",
    amount: "$485",
    status: "ready",
    offsetMs: 1000 * 60 * 30,
  },
  {
    id: "ai-2",
    title: "Roof Leak Repair Response",
    type: "response",
    summary:
      "Professional reply addressing homeowner concerns about storm damage liability and warranty coverage.",
    status: "sent",
    offsetMs: 1000 * 60 * 60 * 3,
  },
  {
    id: "ai-3",
    title: "Bathroom Remodel Bid Template",
    type: "template",
    summary:
      "Full gut remodel template — demo, tile, plumbing rough-in, fixtures, and paint. Customizable for any scope.",
    amount: "$8,200–$14,000",
    status: "ready",
    offsetMs: 1000 * 60 * 60 * 24,
  },
  {
    id: "ai-4",
    title: "Fence Replacement Draft",
    type: "draft",
    summary:
      "Draft estimate for 180ft cedar privacy fence replacement. Awaiting final material pricing.",
    amount: "$3,400",
    status: "draft",
    offsetMs: 1000 * 60 * 60 * 48,
  },
];

const typeBadge: Record<AiBid["type"], { label: string; class: string }> = {
  estimate: { label: "Estimate",  class: "bg-blue-100 text-blue-700" },
  template: { label: "Template",  class: "bg-purple-100 text-purple-700" },
  response: { label: "Response",  class: "bg-amber-100 text-amber-700" },
  draft:    { label: "Draft",     class: "bg-gray-100 text-gray-600" },
};

const statusBadge: Record<AiBid["status"], { label: string; class: string }> = {
  draft: { label: "Draft",           class: "bg-gray-100 text-gray-600" },
  ready: { label: "Ready to Send",   class: "bg-green-100 text-green-700" },
  sent:  { label: "Sent",            class: "bg-blue-100 text-blue-700" },
};

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AiGeneratedBidsPage() {
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch]       = useState("");
  const [mounted, setMounted]     = useState(false);
  const [bids, setBids]           = useState<AiBid[]>(() =>
    DEMO_AI_BID_TEMPLATES.map(({ offsetMs, ...rest }) => ({
      ...rest,
      createdAt: new Date(0),
    }))
  );

  useEffect(() => {
    const now = Date.now();
    setBids(
      DEMO_AI_BID_TEMPLATES.map(({ offsetMs, ...rest }) => ({
        ...rest,
        createdAt: new Date(now - offsetMs),
      }))
    );
    setMounted(true);
  }, []);

  const handleCopy = (id: string, summary: string) => {
    navigator.clipboard.writeText(summary).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendSms = (bid: AiBid) => {
    const body = encodeURIComponent(
      `${bid.title}\n\n${bid.summary}${bid.amount ? `\n\nTotal: ${bid.amount}` : ""}`
    );
    window.location.href = `sms:?&body=${body}`;
  };

  const formatRelative = (date: Date) => {
    const mins = Math.round((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  const filtered = bids.filter((bid) => {
    const matchesType =
      filterType === "all" ||
      bid.type === filterType ||
      bid.status === filterType;
    const matchesSearch =
      search.trim() === "" ||
      bid.title.toLowerCase().includes(search.toLowerCase()) ||
      bid.summary.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalReady = bids.filter((b) => b.status === "ready").length;
  const totalSent  = bids.filter((b) => b.status === "sent").length;
  const totalDraft = bids.filter((b) => b.status === "draft").length;

  return (
    <div className="min-h-screen bg-background">
      <Header isContractor />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">

          {/* Page Header */}
          <div className="mb-6">
            <div className="mb-3">
              <Link
                href="/contractors/dashboard"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    AI Generated Bids
                  </h1>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Estimates, responses, and templates built by HomeBids AI — ready to copy or send.
                </p>
              </div>
              <Button size="sm" className="shrink-0 gap-1.5">
                <Plus className="h-4 w-4" />
                Generate New
              </Button>
            </div>
          </div>

          {/* KPI row */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: "Ready to Send", value: totalReady, color: "text-green-700", bg: "bg-green-50" },
              { label: "Sent",          value: totalSent,  color: "text-blue-700",  bg: "bg-blue-50"  },
              { label: "Drafts",        value: totalDraft, color: "text-gray-600",  bg: "bg-muted"    },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border border-border ${stat.bg} p-3 text-center`}>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Search + Filter bar */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search bids..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "all",      label: "All" },
                { key: "estimate", label: "Estimates" },
                { key: "response", label: "Responses" },
                { key: "template", label: "Templates" },
                { key: "draft",    label: "Drafts" },
                { key: "sent",     label: "Sent" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterType(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    filterType === f.key
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bids list */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">No bids match your filter</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different type or clear your search.</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => { setFilterType("all"); setSearch(""); }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((bid, index) => {
                const type   = typeBadge[bid.type];
                const status = statusBadge[bid.status];
                const isCopied = copiedId === bid.id;

                return (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{bid.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${type.class}`}>
                            {type.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.class}`}>
                            {status.label}
                          </span>
                        </div>
                        {bid.amount && (
                          <p className="mt-0.5 text-sm font-bold text-primary">{bid.amount}</p>
                        )}
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {bid.summary}
                        </p>
                      </div>
                      {mounted && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelative(bid.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* Action row */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent">
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                        onClick={() => handleCopy(bid.id, bid.summary)}
                      >
                        {isCopied
                          ? <CheckCircle2 className="h-3 w-3 text-green-600" />
                          : <Copy className="h-3 w-3" />}
                        {isCopied ? "Copied" : "Copy"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent">
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                        onClick={() => handleSendSms(bid)}
                      >
                        <MessageCircle className="h-3 w-3" />
                        Send via SMS
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent">
                        <FileText className="h-3 w-3" />
                        Export PDF
                      </Button>
                      {bid.status !== "sent" && (
                        <Button size="sm" className="h-7 gap-1 px-2.5 text-xs">
                          <Send className="h-3 w-3" />
                          Mark as Sent
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Generate CTA at bottom */}
              <div className="pt-2">
                <Button variant="outline" className="w-full gap-2 text-sm">
                  <Calculator className="h-4 w-4" />
                  Generate New Estimate with AI
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <ScrollToTop />
    </div>
  );
}
