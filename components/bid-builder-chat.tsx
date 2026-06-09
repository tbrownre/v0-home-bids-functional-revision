"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copyToClipboard } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Send,
  Mic,
  X,
  CheckCircle2,
  FileText,
  Download,
  Copy,
  Share2,
  Link2,
  MessageCircle,
  Lock,
  Unlock,
  Shield,
  Home,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

export type BidLeadType = "my" | "homebids";

export interface BidChatLeadContext {
  id: string;
  projectTitle?: string;
  category?: string;
  ownerName?: string;
  ownerPhone?: string;
  address?: string;
  timeline?: string;
  price?: string;
  scope?: string;
}

interface BidData {
  project: string;
  owner: string;
  phone: string;
  address: string;
  scope: string[];
  optional: string[];
  exclusions: string[];
  timeline: string;
  price: string;
  notes: string;
}

type Phase = "intake" | "gathering" | "review" | "sent" | "approved" | "declined";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  kind?: "text" | "draft" | "system" | "voice";
  text: string;
}

interface Props {
  leadType: BidLeadType;
  lead?: BidChatLeadContext | null;
  contractorName: string;
  companyName: string;
  onClose: () => void;
  // Called for HomeBids leads when the homeowner approves the bid in the demo flow
  onHomeownerApproved?: (leadId: string) => void;
  // Switch the dashboard to the Bid Defender tool (lead recovery)
  onOpenDefender?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let idSeq = 0;
const nextId = () => `m-${Date.now()}-${idSeq++}`;

const VOICE_NOTE_EXAMPLE =
  "Kitchen cabinet repaint, 28 doors, homeowner wants white finish, probably around 5200, include prep and hardware removal, timeline next month.";

const DEFAULT_BID: BidData = {
  project: "",
  owner: "",
  phone: "",
  address: "",
  scope: [],
  optional: [],
  exclusions: [],
  timeline: "",
  price: "",
  notes: "",
};

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Pull a dollar amount from free text → returns formatted "$5,200"
// Prefers $-prefixed or budget/price-context numbers and skips phone-number fragments.
function extractPrice(text: string): string | null {
  // Strip phone-number-like sequences so they aren't mistaken for pricing
  const cleaned = text.replace(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g, " ").replace(/\b\d{3}[-.\s]\d{4}\b/g, " ");

  const toPrice = (raw: string): string | null => {
    const num = parseInt(raw.replace(/[,\s]/g, ""), 10);
    if (isNaN(num) || num < 100) return null;
    return `$${num.toLocaleString()}`;
  };

  // 1) Explicit $ amount
  const dollar = cleaned.match(/\$\s?(\d{1,3}(?:[,\s]\d{3})+|\d{3,7})(?:\.\d{2})?/);
  if (dollar) {
    const p = toPrice(dollar[1]);
    if (p) return p;
  }

  // 2) Amount following a pricing keyword (budget, price, around, about, ~, cost)
  const ctx = cleaned.match(/(?:budget|price|around|about|approx(?:imately)?|cost|total|roughly|~)\D{0,12}(\d{1,3}(?:[,\s]\d{3})+|\d{3,7})/i);
  if (ctx) {
    const p = toPrice(ctx[1]);
    if (p) return p;
  }

  // 3) Fallback: first standalone number that looks like money
  const any = cleaned.match(/\b(\d{1,3}(?:[,\s]\d{3})+|\d{3,7})\b/);
  if (any) return toPrice(any[1]);
  return null;
}

function extractTimeline(text: string): string | null {
  const m = text.match(
    /(next month|this month|\d+\s*[-–to]+\s*\d+\s*(?:days|weeks|business days)|\d+\s*(?:days|weeks|business days)|asap|next week)/i,
  );
  return m ? m[1] : null;
}

// Build a reasonable scope list from rough notes for the demo
function buildScopeFromNotes(notes: string): string[] {
  const n = notes.toLowerCase();
  const scope: string[] = [];
  if (n.includes("cabinet") || n.includes("repaint") || n.includes("paint")) {
    scope.push(
      "Remove cabinet doors and hardware",
      "Clean and prep surfaces",
      "Prime cabinets",
      "Apply professional finish coat",
      "Reinstall hardware",
      "Clean up work area",
    );
  } else if (n.includes("turf") || n.includes("landscap") || n.includes("grass")) {
    scope.push(
      "Remove existing sod and debris",
      "Grade and prep base layer",
      "Install weed barrier",
      "Lay and secure turf",
      "Add edging and infill",
      "Final cleanup",
    );
  } else if (n.includes("vanity") || n.includes("plumb") || n.includes("bath")) {
    scope.push(
      "Remove existing fixture",
      "Prep and protect work area",
      "Install new unit",
      "Reconnect plumbing",
      "Seal and finish",
      "Final cleanup",
    );
  } else {
    scope.push(
      "Prep and protect work area",
      "Complete primary scope of work",
      "Quality check and adjustments",
      "Final cleanup",
    );
  }
  return scope;
}

function suggestOptional(notes: string): string[] {
  const n = notes.toLowerCase();
  if (n.includes("cabinet") || n.includes("paint")) {
    return ["Soft-close hinges", "Premium enamel finish"];
  }
  if (n.includes("turf")) return ["Pet-friendly infill upgrade", "Decorative border stone"];
  return ["Premium materials upgrade"];
}

function suggestExclusions(notes: string): string[] {
  const n = notes.toLowerCase();
  if (n.includes("cabinet") || n.includes("paint")) {
    return ["Cabinet box replacement", "Drywall repair"];
  }
  if (n.includes("turf")) return ["Irrigation system repair", "Tree or root removal"];
  return ["Structural repairs", "Permits (if required)"];
}

// Render the SMS-friendly draft text
function buildDraftText(bid: BidData): string {
  const lines: string[] = [];
  lines.push("Here's your draft bid for review:");
  lines.push("");
  lines.push("Project:");
  lines.push(bid.project || "Project");
  if (bid.address) lines.push(bid.address);
  lines.push("");
  lines.push("Scope:");
  bid.scope.forEach((s) => lines.push(`• ${s}`));
  if (bid.optional.length) {
    lines.push("");
    lines.push("Optional Upgrades:");
    bid.optional.forEach((s) => lines.push(`• ${s}`));
  }
  if (bid.exclusions.length) {
    lines.push("");
    lines.push("Exclusions:");
    bid.exclusions.forEach((s) => lines.push(`• ${s}`));
  }
  lines.push("");
  lines.push("Timeline:");
  lines.push(bid.timeline || "To be confirmed");
  lines.push("");
  lines.push("Price:");
  lines.push(bid.price || "TBD");
  if (bid.notes) {
    lines.push("");
    lines.push("Notes:");
    lines.push(bid.notes);
  }
  lines.push("");
  lines.push("Reply with:");
  lines.push("APPROVE");
  lines.push("or send edits/changes.");
  return lines.join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BidBuilderChat({
  leadType,
  lead,
  contractorName,
  companyName,
  onClose,
  onHomeownerApproved,
  onOpenDefender,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("intake");
  const [bid, setBid] = useState<BidData>(DEFAULT_BID);
  const [aiTyping, setAiTyping] = useState(false);
  const [gatherField, setGatherField] = useState<"owner" | "phone" | "address" | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bidRef = useRef<BidData>(DEFAULT_BID);
  bidRef.current = bid;

  // Seed greeting + any known lead context
  useEffect(() => {
    const seeded: BidData = {
      ...DEFAULT_BID,
      project: lead?.projectTitle ?? "",
      owner: lead?.ownerName ?? "",
      phone: lead?.ownerPhone ?? "",
      address: lead?.address ?? "",
      timeline: lead?.timeline ?? "",
      price: lead?.price ?? "",
    };
    setBid(seeded);
    setMessages([
      {
        id: nextId(),
        role: "ai",
        text:
          "Hi! I'm your HomeBids bid assistant. Send rough project details by text or voice note — include project type, pricing, scope, timeline, customer info, and anything the homeowner mentioned. I'll turn it into a professional bid.",
      },
    ]);
    setPhase("intake");
    setGatherField(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id, leadType]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, aiTyping]);

  function pushAi(text: string, kind: ChatMessage["kind"] = "text") {
    setMessages((m) => [...m, { id: nextId(), role: "ai", text, kind }]);
  }
  function pushUser(text: string, kind: ChatMessage["kind"] = "text") {
    setMessages((m) => [...m, { id: nextId(), role: "user", text, kind }]);
  }

  function aiRespond(fn: () => void, delay = 900) {
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      fn();
    }, delay);
  }

  // Determine what required owner info is still missing
  function missingField(b: BidData): "owner" | "phone" | "address" | null {
    if (!b.owner.trim()) return "owner";
    if (!b.phone.trim()) return "phone";
    if (!b.address.trim()) return "address";
    return null;
  }

  function askForField(field: "owner" | "phone" | "address") {
    setGatherField(field);
    setPhase("gathering");
    const prompts = {
      owner: "Got it. Who should we send this bid to? (property owner's name)",
      phone: "Thanks. What's the best phone number to reach them?",
      address: "Almost there — what's the project address or property location?",
    };
    pushAi(prompts[field]);
  }

  function presentDraft(b: BidData) {
    setPhase("review");
    setGatherField(null);
    pushAi(buildDraftText(b), "draft");
  }

  // First substantial message → organize into a structured bid
  function handleIntake(text: string) {
    aiRespond(() => {
      const price = extractPrice(text);
      const timeline = extractTimeline(text);
      const next: BidData = {
        ...bidRef.current,
        project: bidRef.current.project || titleCase(text.split(",")[0].slice(0, 48).trim()),
        scope: bidRef.current.scope.length ? bidRef.current.scope : buildScopeFromNotes(text),
        optional: bidRef.current.optional.length ? bidRef.current.optional : suggestOptional(text),
        exclusions: bidRef.current.exclusions.length ? bidRef.current.exclusions : suggestExclusions(text),
        price: bidRef.current.price || (price ?? ""),
        timeline: bidRef.current.timeline || (timeline ?? ""),
      };
      setBid(next);
      pushAi(
        "Got it — I've organized that into a clean scope and suggested a few optional upgrades and exclusions. Before I draft the bid, I need a couple of details.",
      );
      const miss = missingField(next);
      if (miss) {
        setTimeout(() => askForField(miss), 700);
      } else {
        setTimeout(() => presentDraft(next), 700);
      }
    }, 1300);
  }

  // Handle answers while gathering owner details
  function handleGathering(text: string) {
    const field = gatherField;
    if (!field) return;
    aiRespond(() => {
      const next = { ...bidRef.current };
      if (field === "owner") next.owner = titleCase(text.trim());
      if (field === "phone") next.phone = text.trim();
      if (field === "address") next.address = text.trim();
      setBid(next);
      const miss = missingField(next);
      if (miss) {
        askForField(miss);
      } else {
        pushAi("Perfect — I have everything I need. Here's your draft.");
        setTimeout(() => presentDraft(next), 700);
      }
    }, 700);
  }

  // Apply natural-language edits during review
  function handleEdit(text: string) {
    const lower = text.trim().toLowerCase();

    if (lower === "approve" || lower === "approved") {
      handleApprove();
      return;
    }

    aiRespond(() => {
      const next: BidData = {
        ...bidRef.current,
        scope: [...bidRef.current.scope],
        optional: [...bidRef.current.optional],
        exclusions: [...bidRef.current.exclusions],
      };
      let changed = false;
      let summary = "";

      // Price change
      const priceMatch = lower.match(/(?:price|cost|total|change.*to|make it|set.*to)\D*(\$?\s?\d[\d,\s]*)/);
      if ((lower.includes("price") || lower.includes("change") || lower.includes("make it")) && priceMatch) {
        const p = extractPrice(priceMatch[1]);
        if (p) {
          next.price = p;
          changed = true;
          summary = `Updated the price to ${p}.`;
        }
      }

      // Timeline change
      if (!changed && (lower.includes("timeline") || lower.includes("weeks") || lower.includes("days"))) {
        const t = extractTimeline(lower);
        if (t) {
          next.timeline = t;
          changed = true;
          summary = `Updated the timeline to ${t}.`;
        }
      }

      // Remove an item
      const removeMatch = text.match(/remove\s+(.+)/i);
      if (!changed && removeMatch) {
        const term = removeMatch[1].toLowerCase().replace(/[.!]$/, "").trim();
        const filterOut = (arr: string[]) => arr.filter((s) => !s.toLowerCase().includes(term.split(" ")[0]));
        const before = next.scope.length + next.optional.length + next.exclusions.length;
        next.scope = filterOut(next.scope);
        next.optional = filterOut(next.optional);
        next.exclusions = filterOut(next.exclusions);
        const after = next.scope.length + next.optional.length + next.exclusions.length;
        if (after < before) {
          changed = true;
          summary = `Removed "${term}" from the bid.`;
        }
      }

      // Add a note
      const noteMatch = text.match(/add (?:a )?note(?:\s+about)?\s+(.+)/i);
      if (!changed && noteMatch) {
        next.notes = next.notes ? `${next.notes} ${noteMatch[1].trim()}` : titleCase(noteMatch[1].trim().charAt(0)) + noteMatch[1].trim().slice(1);
        changed = true;
        summary = "Added that note to the bid.";
      }

      // Add a scope item
      const addMatch = text.match(/add\s+(.+)/i);
      if (!changed && addMatch && !lower.startsWith("add note")) {
        next.scope.push(titleCase(addMatch[1].replace(/[.!]$/, "").trim()));
        changed = true;
        summary = `Added "${addMatch[1].trim()}" to the scope.`;
      }

      setBid(next);
      if (changed) {
        pushAi(`${summary} Here's the revised draft:`);
        setTimeout(() => pushAi(buildDraftText(next), "draft"), 600);
      } else {
        pushAi(
          "I can adjust pricing, scope, timeline, exclusions, or notes. Try things like \"change price to 5600\", \"remove soft-close hinges\", or \"timeline should be 2 weeks\". Reply APPROVE when it looks good.",
        );
      }
    }, 1000);
  }

  function handleApprove() {
    aiRespond(() => {
      if (leadType === "my") {
        setPhase("approved");
        pushAi(
          "Approved. I've generated your professional PDF bid and sent it back to you. You control delivery — forward or text it to your customer whenever you're ready.",
          "system",
        );
      } else {
        setPhase("sent");
        const owner = bidRef.current.owner || "the homeowner";
        pushAi(
          `Approved. I've generated the PDF and sent it to ${owner} for review. I'll relay messages until they approve — their contact stays private for now.`,
          "system",
        );
        pushAi(
          `Sent to ${owner}: "Hi ${owner.split(" ")[0]}, ${contractorName} from ${companyName} sent you a bid for your project${bidRef.current.address ? ` at ${bidRef.current.address}` : ""}. Review your bid here: [Bid Link]"`,
        );
      }
    }, 1300);
  }

  // Demo: simulate homeowner decision (HomeBids leads only)
  function homeownerDecision(decision: "approve" | "changes" | "decline") {
    if (decision === "approve") {
      aiRespond(() => {
        setPhase("approved");
        pushAi(
          `${(bidRef.current.owner || "The homeowner").split(" ")[0]} approved your bid. Direct messaging is now unlocked — you and the homeowner are connected in a group thread.`,
          "system",
        );
        if (lead?.id) onHomeownerApproved?.(lead.id);
      }, 1000);
    } else if (decision === "changes") {
      aiRespond(() => {
        setPhase("review");
        pushAi(
          "The homeowner requested a change: \"Can you tighten the timeline a bit?\" Send a revision or reply with your update and I'll relay it back.",
        );
      }, 1000);
    } else {
      aiRespond(() => {
        setPhase("declined");
        pushAi(
          "The homeowner declined this bid. Don't lose the value of this lead — use Bid Defender to send your HomeBids referral link and still earn from it.",
          "system",
        );
      }, 1000);
    }
  }

  function send(raw?: string, kind: ChatMessage["kind"] = "text") {
    const text = (raw ?? input).trim();
    if (!text) return;
    pushUser(text, kind);
    setInput("");

    if (phase === "intake") {
      if (text.length < 8) {
        aiRespond(
          () =>
            pushAi(
              "Send me the rough details — project type, scope, rough pricing, timeline, and the customer info. A quick voice note works great too.",
            ),
          700,
        );
      } else {
        handleIntake(text);
      }
    } else if (phase === "gathering") {
      handleGathering(text);
    } else if (phase === "review") {
      handleEdit(text);
    } else if (phase === "approved" && leadType === "homebids") {
      // direct messaging unlocked - just acknowledge
      aiRespond(() => pushAi("Message delivered to the homeowner."), 600);
    }
  }

  function sendVoiceNote() {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      pushUser("Voice note (0:08)", "voice");
      // simulate transcription
      setTimeout(() => {
        pushAi("Transcribing your voice note...");
        setTimeout(() => {
          pushAi(`Heard: "${VOICE_NOTE_EXAMPLE}"`);
          handleIntake(VOICE_NOTE_EXAMPLE);
        }, 900);
      }, 500);
    }, 1400);
  }

  function doCopy(key: string, text: string) {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const bidLink = `https://homebids.com/bid/${lead?.id ?? "draft"}-${(bid.owner || "owner").split(" ")[0].toLowerCase()}`;
  const canApproveInline = phase === "review";

  // ── PDF preview ──────────────────────────────────────────────────────────
  const pdfPreview = (
    <div className="rounded-xl border border-border bg-white text-[11px] leading-relaxed text-foreground shadow-sm">
      <div className="border-b border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-foreground">{companyName}</p>
          <p className="text-muted-foreground">Professional Bid</p>
        </div>
        <div className="text-right text-muted-foreground">
          <p>Date: {new Date().toLocaleDateString()}</p>
          <p>Valid 30 days</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-b border-border px-4 py-3">
        <div>
          <p className="font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Property Owner</p>
          <p className="font-medium">{bid.owner || "—"}</p>
          <p className="text-muted-foreground">{bid.phone || ""}</p>
          <p className="text-muted-foreground">{bid.address || ""}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Project</p>
          <p className="font-medium">{bid.project || "Project"}</p>
          <p className="text-muted-foreground">{bid.timeline || ""}</p>
        </div>
      </div>
      <div className="border-b border-border px-4 py-3">
        <p className="mb-2 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Scope of Work</p>
        {bid.scope.map((s, i) => (
          <div key={i} className="mb-1 flex gap-2"><span className="shrink-0 font-medium">{i + 1}.</span><span>{s}</span></div>
        ))}
      </div>
      {bid.optional.length > 0 && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-1.5 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Optional Upgrades</p>
          {bid.optional.map((s, i) => <p key={i} className="text-muted-foreground">• {s}</p>)}
        </div>
      )}
      {bid.exclusions.length > 0 && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-1.5 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Exclusions</p>
          {bid.exclusions.map((s, i) => <p key={i} className="text-muted-foreground">• {s}</p>)}
        </div>
      )}
      <div className="border-b border-border px-4 py-3">
        <p className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Pricing</p>
        <div className="flex justify-between font-bold"><span>Total Bid</span><span>{bid.price || "TBD"}</span></div>
      </div>
      {bid.notes && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Notes</p>
          <p className="text-muted-foreground">{bid.notes}</p>
        </div>
      )}
      <div className="px-4 py-3">
        <p className="mb-2 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Acceptance</p>
        <p className="text-muted-foreground">Owner Signature: _____________________  Date: __________</p>
        <p className="mt-2 text-muted-foreground" style={{ fontSize: "9px" }}>50% deposit on acceptance · 50% on completion · 1-year workmanship guarantee</p>
      </div>
    </div>
  );

  const pdfReady = phase === "approved" || phase === "sent" || phase === "declined";
  const messagingUnlocked = phase === "approved" && leadType === "homebids";

  // Delivery action bar (changes by lead type + phase)
  const deliveryActions = (
    <div className="space-y-2">
      {leadType === "my" && phase === "approved" && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => setShowPdf(true)}>
              <FileText className="h-3.5 w-3.5" /> Preview PDF
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => window.print()}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => doCopy("link", bidLink)}>
              <Link2 className="h-3.5 w-3.5" /> {copied === "link" ? "Copied!" : "Copy Bid Link"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => doCopy("share", buildDraftText(bid))}>
              <Share2 className="h-3.5 w-3.5" /> {copied === "share" ? "Copied!" : "Share PDF"}
            </Button>
          </div>
          <Button
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={() => {
              const phone = bid.phone || "";
              window.location.href = `sms:${phone}?body=${encodeURIComponent(`Hi ${bid.owner.split(" ")[0] || "there"}, here's your bid for ${bid.project}. ${bidLink}`)}`;
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" /> Text Customer
          </Button>
        </>
      )}

      {leadType === "homebids" && phase === "sent" && (
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Awaiting homeowner approval · messaging locked
          </p>
          <p className="mb-2 text-[11px] text-muted-foreground">Simulate the homeowner&apos;s response (demo):</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-8 gap-1.5 bg-green-600 text-xs text-white hover:bg-green-700" onClick={() => homeownerDecision("approve")}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Approve Bid
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => homeownerDecision("changes")}>
              Request Changes
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 border-red-200 bg-transparent text-xs text-red-600 hover:bg-red-50" onClick={() => homeownerDecision("decline")}>
              Decline Bid
            </Button>
          </div>
        </div>
      )}

      {messagingUnlocked && (
        <>
          <div className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 text-[11px] font-medium text-green-700">
            <Unlock className="h-3.5 w-3.5" /> Direct messaging unlocked
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => setShowPdf(true)}>
              <FileText className="h-3.5 w-3.5" /> Preview PDF
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => window.print()}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-green-600 text-xs text-white hover:bg-green-700"
              onClick={() => {
                window.location.href = `sms:${bid.phone || ""}?body=${encodeURIComponent(`Hi ${bid.owner.split(" ")[0] || "there"}, thanks for approving the bid! When works to get started?`)}`;
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Text Homeowner
            </Button>
          </div>
        </>
      )}

      {phase === "declined" && (
        <Button size="sm" className="w-full gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700" onClick={() => (onOpenDefender ?? onClose)()}>
          <Shield className="h-3.5 w-3.5" /> Open Bid Defender
        </Button>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row lg:min-h-[640px]">
      {/* LEFT: chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">HomeBids AI</p>
              <p className="text-[10px] text-muted-foreground">
                {leadType === "my" ? "My Lead · you control delivery" : "HomeBids Lead · relayed until approval"}
                {lead?.projectTitle ? ` · ${lead.projectTitle}` : ""}
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={onClose} aria-label="Close bid builder">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-4 lg:px-6 min-h-[360px] max-h-[60vh] lg:max-h-none">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : m.kind === "draft"
                      ? "rounded-bl-md border border-border bg-card text-foreground"
                      : m.kind === "system"
                        ? "rounded-bl-md border border-primary/20 bg-primary/5 text-foreground"
                        : "rounded-bl-md bg-background text-foreground shadow-sm"
                }`}
              >
                {m.kind === "voice" ? (
                  <span className="flex items-center gap-2"><Mic className="h-4 w-4" />{m.text}</span>
                ) : m.kind === "draft" ? (
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{m.text}</pre>
                ) : (
                  m.text
                )}
              </div>
            </div>
          ))}

          {aiTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-background px-4 py-3 shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
              </div>
            </div>
          )}

          {/* Inline APPROVE shortcut + delivery actions */}
          {canApproveInline && !aiTyping && (
            <div className="flex justify-start">
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => send("APPROVE")}>
                <CheckCircle2 className="h-3.5 w-3.5" /> APPROVE this draft
              </Button>
            </div>
          )}

          {pdfReady && !aiTyping && (
            <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {phase === "declined" ? "Lead recovery" : "Finalized bid"}
              </p>
              {deliveryActions}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background px-4 py-3 lg:px-6">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={sendVoiceNote}
              disabled={recording || aiTyping || phase === "declined"}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                recording ? "border-red-300 bg-red-50 text-red-600" : "border-border bg-background text-muted-foreground hover:text-foreground"
              } disabled:opacity-40`}
              aria-label="Send voice note"
            >
              <Mic className={`h-4 w-4 ${recording ? "animate-pulse" : ""}`} />
            </button>
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={
                recording
                  ? "Recording voice note..."
                  : phase === "review"
                    ? "Reply APPROVE or send edits (e.g. \"change price to 5600\")"
                    : phase === "gathering"
                      ? "Type your answer..."
                      : "Send rough project details or a voice note..."
              }
              disabled={recording || phase === "declined"}
              className="max-h-32 min-h-10 resize-none py-2.5 text-sm"
            />
            <Button size="sm" className="h-10 w-10 shrink-0 p-0" onClick={() => send()} disabled={!input.trim() || aiTyping || recording} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            {leadType === "my"
              ? "HomeBids helps build the bid — you control delivery to your customer."
              : "Communication is relayed by HomeBids AI until the homeowner approves."}
          </p>
        </div>
      </div>

      {/* RIGHT: live preview (desktop) */}
      <div className="hidden shrink-0 flex-col border-l border-border lg:flex lg:w-80 xl:w-96">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {pdfReady ? "Finalized PDF" : "Live Bid Preview"}
          </p>
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${pdfReady ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            {pdfReady ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
            {pdfReady ? "Ready" : "Draft"}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {pdfReady || phase === "review" ? (
            pdfPreview
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Home className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="px-6 text-xs text-muted-foreground">
                Your bid preview will build itself here as you chat with HomeBids AI.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PDF dialog */}
      <Dialog open={showPdf} onOpenChange={setShowPdf}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Bid PDF Preview
            </DialogTitle>
          </DialogHeader>
          {pdfPreview}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" className="gap-1.5 bg-transparent text-xs" onClick={() => window.print()}>
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 bg-transparent text-xs" onClick={() => doCopy("pdf-link", bidLink)}>
              <Link2 className="h-3.5 w-3.5" /> {copied === "pdf-link" ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
