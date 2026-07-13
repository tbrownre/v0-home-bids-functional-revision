"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copyToClipboard } from "@/lib/utils";
import { getSmsHref } from "@/lib/sms-config";
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
  Share2,
  Link2,
  MessageCircle,
  Lock,
  Unlock,
  Home,
  AlertCircle,
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
  // Customer info
  project: string;
  owner: string;
  phone: string;
  address: string;
  // Scope
  scope: string[];
  optional: string[];
  exclusions: string[];
  warrantyNote: string;
  permitsIncluded: boolean | null; // null = not asked yet
  cleanupIncluded: boolean;
  // Pricing
  price: string;
  priceType: "fixed" | "estimated" | "inspection_dependent" | "";
  priceIncludes: string;
  // Timeline
  timeline: string;
  timelineDependsOn: string;
  // Inspection
  inspectionRequired: boolean | null;
  inspectionIsFree: boolean | null;
  inspectionFeeAmount: string;
  inspectionFeeDeductedIfAccepted: boolean | null;
  inspectionNote: string;
  // Deposit
  depositRequired: boolean | null;
  depositAmount: string;
  depositRefundable: boolean | null;
  depositNote: string;
  // Financing
  financingAvailable: boolean | null;
  financingNote: string;
  // Contractor message
  contractorMessage: string;
  // Internal
  notes: string;
}

type CompletenessStatus =
  | "complete"
  | "needs_price"
  | "needs_timeline"
  | "needs_scope"
  | "needs_inspection_deposit"
  | "needs_contact"
  | "incomplete";

type GatherField =
  | "owner"
  | "phone"
  | "address"
  | "warranty"
  | "permits"
  | "inspection"
  | "inspection_fee"
  | "inspection_deduct"
  | "deposit"
  | "deposit_amount"
  | "deposit_refundable"
  | "financing"
  | "contractor_message"
  | null;

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
  onHomeownerApproved?: (leadId: string) => void;
  proposalId?: string | null;
  initialData?: Partial<BidData> | null;
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
  warrantyNote: "",
  permitsIncluded: null,
  cleanupIncluded: true,
  price: "",
  priceType: "",
  priceIncludes: "",
  timeline: "",
  timelineDependsOn: "",
  inspectionRequired: null,
  inspectionIsFree: null,
  inspectionFeeAmount: "",
  inspectionFeeDeductedIfAccepted: null,
  inspectionNote: "",
  depositRequired: null,
  depositAmount: "",
  depositRefundable: null,
  depositNote: "",
  financingAvailable: null,
  financingNote: "",
  contractorMessage: "",
  notes: "",
};

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractPrice(text: string): string | null {
  const cleaned = text
    .replace(/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g, " ")
    .replace(/\b\d{3}[-.\s]\d{4}\b/g, " ");

  const toPrice = (raw: string): string | null => {
    const num = parseInt(raw.replace(/[,\s]/g, ""), 10);
    if (isNaN(num) || num < 100) return null;
    return `$${num.toLocaleString()}`;
  };

  const dollar = cleaned.match(/\$\s?(\d{1,3}(?:[,\s]\d{3})+|\d{3,7})(?:\.\d{2})?/);
  if (dollar) {
    const p = toPrice(dollar[1]);
    if (p) return p;
  }

  const ctx = cleaned.match(
    /(?:budget|price|around|about|approx(?:imately)?|cost|total|roughly|~)\D{0,12}(\d{1,3}(?:[,\s]\d{3})+|\d{3,7})/i,
  );
  if (ctx) {
    const p = toPrice(ctx[1]);
    if (p) return p;
  }

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

function buildScopeFromNotes(notes: string): string[] {
  const n = notes.toLowerCase();
  if (n.includes("cabinet") || n.includes("repaint") || n.includes("paint")) {
    return [
      "Remove cabinet doors and hardware",
      "Clean and prep surfaces",
      "Prime cabinets",
      "Apply professional finish coat",
      "Reinstall hardware",
      "Clean up work area",
    ];
  } else if (n.includes("turf") || n.includes("landscap") || n.includes("grass")) {
    return [
      "Remove existing sod and debris",
      "Grade and prep base layer",
      "Install weed barrier",
      "Lay and secure turf",
      "Add edging and infill",
      "Final cleanup",
    ];
  } else if (n.includes("vanity") || n.includes("plumb") || n.includes("bath")) {
    return [
      "Remove existing fixture",
      "Prep and protect work area",
      "Install new unit",
      "Reconnect plumbing",
      "Seal and finish",
      "Final cleanup",
    ];
  } else if (n.includes("roof")) {
    return [
      "Remove existing roofing material and haul-off",
      "Inspect and replace damaged decking",
      "Install synthetic underlayment",
      "Install new shingles",
      "Flash all penetrations and valleys",
      "Final cleanup and inspection",
    ];
  } else {
    return [
      "Prep and protect work area",
      "Complete primary scope of work",
      "Quality check and adjustments",
      "Final cleanup",
    ];
  }
}

function suggestOptional(notes: string): string[] {
  const n = notes.toLowerCase();
  if (n.includes("cabinet") || n.includes("paint")) return ["Soft-close hinges", "Premium enamel finish"];
  if (n.includes("turf")) return ["Pet-friendly infill upgrade", "Decorative border stone"];
  if (n.includes("roof")) return ["Class 4 impact-resistant shingles upgrade", "Ridge vent installation"];
  return ["Premium materials upgrade"];
}

function suggestExclusions(notes: string): string[] {
  const n = notes.toLowerCase();
  if (n.includes("cabinet") || n.includes("paint")) return ["Cabinet box replacement", "Drywall repair"];
  if (n.includes("turf")) return ["Irrigation system repair", "Tree or root removal"];
  if (n.includes("roof")) return ["Fascia/soffit replacement unless damaged", "Gutter replacement"];
  return ["Structural repairs", "Permits (if required)"];
}

/** Generate a professional contractor message from the bid data */
function generateContractorMessage(bid: BidData, companyName: string): string {
  const parts: string[] = [];
  const projectLabel = bid.project || "your project";

  parts.push(`Hi! ${companyName} would love to help with ${projectLabel}.`);

  if (bid.scope.length > 0) {
    parts.push(`Our bid covers ${bid.scope.slice(0, 3).join(", ").toLowerCase()}${bid.scope.length > 3 ? ", and more" : ""}.`);
  }

  if (bid.warrantyNote) {
    parts.push(`We back our work with ${bid.warrantyNote.toLowerCase()}.`);
  }

  if (bid.permitsIncluded === true) {
    parts.push("Permits are included in our price.");
  }

  if (bid.inspectionRequired === false || bid.inspectionIsFree === true) {
    parts.push("We offer a free on-site inspection — no obligation.");
  }

  if (bid.depositRequired === false) {
    parts.push("No upfront deposit required.");
  } else if (bid.depositAmount) {
    parts.push(`We require a ${bid.depositAmount} deposit to schedule.`);
  }

  if (bid.financingAvailable === true) {
    parts.push(bid.financingNote ? bid.financingNote : "Financing options are available.");
  }

  parts.push("We look forward to earning your business!");
  return parts.join(" ");
}

/** Check what required info is still missing */
function checkCompleteness(b: BidData): CompletenessStatus {
  if (!b.price) return "needs_price";
  if (!b.timeline) return "needs_timeline";
  if (b.scope.length === 0) return "needs_scope";
  if (b.inspectionRequired === null || b.depositRequired === null) return "needs_inspection_deposit";
  if (!b.owner || !b.phone) return "needs_contact";
  return "complete";
}

function buildDraftText(bid: BidData): string {
  const lines: string[] = [];
  lines.push("Here's your draft bid for review:");
  lines.push("");
  lines.push(`Project: ${bid.project || "Project"}`);
  if (bid.address) lines.push(`Address: ${bid.address}`);
  lines.push("");
  lines.push("Scope of Work:");
  bid.scope.forEach((s) => lines.push(`  • ${s}`));
  if (bid.optional.length) {
    lines.push("");
    lines.push("Optional Upgrades:");
    bid.optional.forEach((s) => lines.push(`  • ${s}`));
  }
  if (bid.exclusions.length) {
    lines.push("");
    lines.push("Not Included:");
    bid.exclusions.forEach((s) => lines.push(`  • ${s}`));
  }
  if (bid.warrantyNote) {
    lines.push("");
    lines.push(`Warranty: ${bid.warrantyNote}`);
  }
  if (bid.permitsIncluded !== null) {
    lines.push(`Permits: ${bid.permitsIncluded ? "Included" : "Not included"}`);
  }
  lines.push("");
  lines.push(`Timeline: ${bid.timeline || "To be confirmed"}`);
  if (bid.timelineDependsOn) lines.push(`  (depends on: ${bid.timelineDependsOn})`);
  lines.push("");
  lines.push(`Price: ${bid.price || "TBD"}${bid.priceType === "estimated" ? " (estimated)" : bid.priceType === "inspection_dependent" ? " (pending inspection)" : ""}`);
  if (bid.priceIncludes) lines.push(`  Includes: ${bid.priceIncludes}`);
  lines.push("");
  if (bid.inspectionRequired === false) {
    lines.push("Inspection: No inspection required");
  } else if (bid.inspectionIsFree === true) {
    lines.push("Inspection: Free in-person inspection included");
    if (bid.inspectionFeeDeductedIfAccepted) lines.push("  Fee deducted from final bid if accepted");
  } else if (bid.inspectionFeeAmount) {
    lines.push(`Inspection Fee: ${bid.inspectionFeeAmount}`);
    if (bid.inspectionFeeDeductedIfAccepted) lines.push("  Deducted from final bid if accepted");
  }
  if (bid.inspectionNote) lines.push(`  ${bid.inspectionNote}`);
  lines.push("");
  if (bid.depositRequired === false) {
    lines.push("Deposit: No deposit required");
  } else if (bid.depositAmount) {
    lines.push(`Deposit: ${bid.depositAmount}${bid.depositRefundable === false ? " (non-refundable)" : bid.depositRefundable === true ? " (refundable)" : ""}`);
    if (bid.depositNote) lines.push(`  ${bid.depositNote}`);
  }
  if (bid.financingAvailable === true) {
    lines.push(`Financing: Available${bid.financingNote ? ` — ${bid.financingNote}` : ""}`);
  }
  if (bid.contractorMessage) {
    lines.push("");
    lines.push("Contractor Message:");
    lines.push(bid.contractorMessage);
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
  proposalId,
  initialData,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("intake");
  const [bid, setBid] = useState<BidData>(DEFAULT_BID);
  const [aiTyping, setAiTyping] = useState(false);
  const [gatherField, setGatherField] = useState<GatherField>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [completenessError, setCompletenessError] = useState<string | null>(null);
  const [draftProposalId, setDraftProposalId] = useState<string | null>(proposalId || null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bidRef = useRef<BidData>(DEFAULT_BID);
  bidRef.current = bid;

  useEffect(() => {
    const seeded: BidData = {
      ...DEFAULT_BID,
      ...(initialData || {}),
      project: initialData?.project ?? lead?.projectTitle ?? "",
      owner: initialData?.owner ?? lead?.ownerName ?? "",
      phone: initialData?.phone ?? lead?.ownerPhone ?? "",
      address: initialData?.address ?? lead?.address ?? "",
      timeline: initialData?.timeline ?? lead?.timeline ?? "",
      price: initialData?.price ?? lead?.price ?? "",
    };
    setBid(seeded);

    // Determine phase and greeting based on whether we're resuming a draft
    const isResumingDraft = !!initialData && !!proposalId;
    const greeting = isResumingDraft
      ? `Welcome back — resuming your draft: ${seeded.project || "your project"} for ${seeded.owner || "the homeowner"}, currently ${seeded.price || "pending pricing"}. Tell me what to change, or type APPROVE to finalize and send.`
      : "Hi! I'm your HomeBids bid assistant. Send rough project details — project type, scope, pricing, timeline, and the customer info. I'll organize everything into a complete professional bid, then ask a few quick follow-up questions about inspection, deposit, and warranty so the homeowner gets a full picture.";

    setMessages([
      {
        id: nextId(),
        role: "ai",
        text: greeting,
      },
    ]);

    // When resuming a draft, start in review phase so APPROVE works immediately
    // Otherwise, start in intake phase for new bids
    setPhase(isResumingDraft ? "review" : "intake");
    setGatherField(null);
    setCompletenessError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id, leadType, initialData, proposalId]);

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

  // ─�� Gather field prompts ───────────────────────────────────────────────────

  function askForField(field: GatherField, b?: BidData) {
    const current = b ?? bidRef.current;
    setGatherField(field);
    setPhase("gathering");
    const prompts: Record<NonNullable<GatherField>, string> = {
      owner: "Got it. Who should we send this bid to? (property owner's name)",
      phone: "Thanks. What's the best phone number to reach them?",
      address: "Almost there — what's the project address or property location?",
      warranty:
        "Does your work come with any warranty? For example: \"1-year labor warranty\", \"5-year workmanship guarantee\", or \"no warranty\". This builds trust with homeowners.",
      permits:
        "Are permits required for this job, and are they included in your price? (e.g. \"permits included\", \"permit not required\", \"homeowner obtains permit\")",
      inspection:
        "Does this job require an in-person inspection before work begins? Reply with: \"free inspection\", \"inspection fee\", or \"no inspection needed\".",
      inspection_fee:
        "What's the inspection fee amount? And is it deducted from the final bid price if the homeowner accepts? (e.g. \"$75, deducted from bid\" or \"$100, not deducted\")",
      inspection_deduct:
        "Is the inspection fee deducted from the final bid if the homeowner accepts? (yes / no)",
      deposit:
        "Do you require a deposit before starting work? Reply: \"no deposit\", or give the amount and whether it's refundable (e.g. \"$1,500 non-refundable\", \"30% refundable deposit\").",
      deposit_amount:
        "How much is the deposit, and is it refundable if the homeowner changes their mind?",
      deposit_refundable:
        "Is the deposit refundable? (yes / no)",
      financing:
        "Do you offer financing options for homeowners? (yes / no — if yes, any details?)",
      contractor_message:
        "Write a short message to the homeowner explaining why they should choose you. Mention materials, timeline, warranty, or what makes your bid stand out. Or reply \"generate\" and I'll write one from the bid details.",
    };
    pushAi(prompts[field!]);
  }

  // Determine the next gather field in the post-intake flow
  function nextGatherField(b: BidData): GatherField {
    if (!b.owner.trim()) return "owner";
    if (!b.phone.trim()) return "phone";
    if (!b.address.trim()) return "address";
    if (b.inspectionRequired === null) return "inspection";
    if (b.inspectionRequired === true && b.inspectionIsFree === null) return "inspection_fee";
    if (b.depositRequired === null) return "deposit";
    if (b.financingAvailable === null) return "financing";
    if (!b.warrantyNote.trim()) return "warranty";
    if (!b.contractorMessage.trim()) return "contractor_message";
    return null;
  }

  function presentDraft(b: BidData) {
    setPhase("review");
    setGatherField(null);
    pushAi(buildDraftText(b), "draft");
  }

  // ── Intake handler ────────────────────────────────────────────────────────

  function handleIntake(text: string) {
    aiRespond(() => {
      const price = extractPrice(text);
      const timeline = extractTimeline(text);
      const lower = text.toLowerCase();

      // Auto-detect inspection signals
      let inspectionRequired: boolean | null = null;
      let inspectionIsFree: boolean | null = null;
      if (lower.includes("free inspection") || lower.includes("no charge inspection")) {
        inspectionRequired = true;
        inspectionIsFree = true;
      } else if (lower.includes("no inspection") || lower.includes("inspection not required")) {
        inspectionRequired = false;
      }

      // Auto-detect deposit signals
      let depositRequired: boolean | null = null;
      let depositAmount = "";
      if (lower.includes("no deposit") || lower.includes("deposit not required")) {
        depositRequired = false;
      } else {
        const depositMatch = text.match(/\$(\d[\d,]*)\s*deposit/i);
        if (depositMatch) {
          depositRequired = true;
          depositAmount = `$${depositMatch[1]}`;
        }
      }

      // Auto-detect warranty
      let warrantyNote = "";
      const warrantyMatch = text.match(/(\d+[\s-]year[s]?\s+(?:labor|workmanship|material|parts)?\s*warranty)/i);
      if (warrantyMatch) warrantyNote = warrantyMatch[1];

      // Auto-detect permits
      let permitsIncluded: boolean | null = null;
      if (lower.includes("permit included") || lower.includes("permits included") || lower.includes("pull permits")) {
        permitsIncluded = true;
      } else if (lower.includes("no permit") || lower.includes("permit not required")) {
        permitsIncluded = false;
      }

      // Auto-detect financing
      let financingAvailable: boolean | null = null;
      if (lower.includes("financing available") || lower.includes("offer financing")) {
        financingAvailable = true;
      } else if (lower.includes("no financing")) {
        financingAvailable = false;
      }

      const next: BidData = {
        ...bidRef.current,
        project: bidRef.current.project || titleCase(text.split(",")[0].slice(0, 48).trim()),
        scope: bidRef.current.scope.length ? bidRef.current.scope : buildScopeFromNotes(text),
        optional: bidRef.current.optional.length ? bidRef.current.optional : suggestOptional(text),
        exclusions: bidRef.current.exclusions.length ? bidRef.current.exclusions : suggestExclusions(text),
        price: bidRef.current.price || (price ?? ""),
        timeline: bidRef.current.timeline || (timeline ?? ""),
        inspectionRequired: inspectionRequired,
        inspectionIsFree: inspectionIsFree,
        depositRequired: depositRequired,
        depositAmount: depositAmount,
        warrantyNote: warrantyNote,
        permitsIncluded: permitsIncluded,
        financingAvailable: financingAvailable,
      };
      setBid(next);
      pushAi(
        "Got it — I've organized that into a clean scope. Before I draft the bid, I need a few quick details to make it complete for the homeowner.",
      );
      const nextField = nextGatherField(next);
      if (nextField) {
        setTimeout(() => askForField(nextField, next), 700);
      } else {
        setTimeout(() => presentDraft(next), 700);
      }
    }, 1300);
  }

  // ── Gathering handler ─────────────────────────────────────────────────────

  function handleGathering(text: string) {
    const field = gatherField;
    if (!field) return;
    const lower = text.trim().toLowerCase();

    aiRespond(() => {
      const next = { ...bidRef.current };

      switch (field) {
        case "owner":
          next.owner = titleCase(text.trim());
          break;
        case "phone":
          next.phone = text.trim();
          break;
        case "address":
          next.address = text.trim();
          break;
        case "warranty":
          if (lower === "no" || lower === "none" || lower === "no warranty") {
            next.warrantyNote = "No warranty";
          } else {
            next.warrantyNote = text.trim();
          }
          break;
        case "permits":
          if (lower.includes("included") || lower.includes("yes") || lower.includes("pull")) {
            next.permitsIncluded = true;
          } else if (lower.includes("not required") || lower.includes("no permit") || lower.includes("homeowner")) {
            next.permitsIncluded = false;
          } else {
            next.permitsIncluded = false;
          }
          break;
        case "inspection":
          if (lower.includes("free") || lower === "yes") {
            next.inspectionRequired = true;
            next.inspectionIsFree = true;
          } else if (lower.includes("fee") || lower.includes("paid") || lower.includes("charge")) {
            next.inspectionRequired = true;
            next.inspectionIsFree = false;
          } else {
            next.inspectionRequired = false;
            next.inspectionIsFree = null;
          }
          break;
        case "inspection_fee": {
          const feeAmt = extractPrice(text);
          if (feeAmt) next.inspectionFeeAmount = feeAmt;
          if (lower.includes("deduct") || lower.includes("applied") || lower.includes("credited") || lower.includes("yes")) {
            next.inspectionFeeDeductedIfAccepted = true;
          } else {
            next.inspectionFeeDeductedIfAccepted = false;
          }
          break;
        }
        case "inspection_deduct":
          next.inspectionFeeDeductedIfAccepted = lower.startsWith("y");
          break;
        case "deposit":
          if (lower.includes("no deposit") || lower === "no" || lower === "none") {
            next.depositRequired = false;
          } else {
            next.depositRequired = true;
            const amt = extractPrice(text);
            if (amt) next.depositAmount = amt;
            // Check for percentage
            const pctMatch = text.match(/(\d+)\s*%/);
            if (pctMatch) next.depositAmount = `${pctMatch[1]}%`;
            if (lower.includes("non-refund") || lower.includes("nonrefund") || lower.includes("no refund")) {
              next.depositRefundable = false;
            } else if (lower.includes("refund")) {
              next.depositRefundable = true;
            }
          }
          break;
        case "deposit_amount": {
          const amt = extractPrice(text);
          if (amt) next.depositAmount = amt;
          const pct = text.match(/(\d+)\s*%/);
          if (pct) next.depositAmount = `${pct[1]}%`;
          break;
        }
        case "deposit_refundable":
          next.depositRefundable = lower.startsWith("y");
          break;
        case "financing":
          if (lower.startsWith("y") || lower.includes("yes") || lower.includes("offer") || lower.includes("available")) {
            next.financingAvailable = true;
            // capture note if they gave details
            if (text.trim().length > 5 && !lower.match(/^(yes|y|yeah)$/)) {
              next.financingNote = text.trim();
            }
          } else {
            next.financingAvailable = false;
          }
          break;
        case "contractor_message":
          if (lower === "generate" || lower === "gen" || lower === "auto") {
            next.contractorMessage = generateContractorMessage(next, companyName);
            pushAi(`Generated: "${next.contractorMessage}"`);
          } else {
            next.contractorMessage = text.trim();
          }
          break;
      }

      setBid(next);
      const nextField = nextGatherField(next);
      if (nextField) {
        askForField(nextField, next);
      } else {
        pushAi("I have everything I need. Here's your complete draft:");
        setTimeout(() => presentDraft(next), 700);
      }
    }, 700);
  }

  // ── Edit handler ──────────────────────────────────────────────────────────

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
      const priceMatch = lower.match(
        /(?:price|cost|total|change.*to|make it|set.*to)\D*(\$?\s?\d[\d,\s]*)/,
      );
      if (
        (lower.includes("price") || lower.includes("change") || lower.includes("make it")) &&
        priceMatch
      ) {
        const p = extractPrice(priceMatch[1]);
        if (p) {
          next.price = p;
          changed = true;
          summary = `Updated the price to ${p}.`;
        }
      }

      // Timeline change
      if (
        !changed &&
        (lower.includes("timeline") || lower.includes("weeks") || lower.includes("days"))
      ) {
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
        const filterOut = (arr: string[]) =>
          arr.filter((s) => !s.toLowerCase().includes(term.split(" ")[0]));
        const before =
          next.scope.length + next.optional.length + next.exclusions.length;
        next.scope = filterOut(next.scope);
        next.optional = filterOut(next.optional);
        next.exclusions = filterOut(next.exclusions);
        const after =
          next.scope.length + next.optional.length + next.exclusions.length;
        if (after < before) {
          changed = true;
          summary = `Removed "${term}" from the bid.`;
        }
      }

      // Add scope item
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
          "I can adjust pricing, scope, timeline, warranty, deposit, or inspection details. Try \"change price to 5600\", \"remove soft-close hinges\", or \"timeline should be 2 weeks\". Reply APPROVE when it looks good.",
        );
      }
    }, 1000);
  }

  // ── Approve handler ───────────────────────────────────────────────────────

  async function handleApprove() {
    // Completeness check before finalizing
    const status = checkCompleteness(bidRef.current);
    if (status !== "complete") {
      const missing: Record<CompletenessStatus, string> = {
        needs_price: "This bid is missing a price. What should the total be?",
        needs_timeline: "We still need a timeline. How long will this job take?",
        needs_scope: "The scope of work is empty. What work is included in this bid?",
        needs_inspection_deposit:
          "We still need to cover inspection and deposit details before submitting. Let me ask quickly.",
        needs_contact: "We need the homeowner's name and phone before sending.",
        complete: "",
        incomplete: "A few required fields are still missing.",
      };
      setCompletenessError(missing[status]);
      pushAi(missing[status]);
      const nextField = nextGatherField(bidRef.current);
      if (nextField) {
        setTimeout(() => askForField(nextField), 600);
      }
      return;
    }

    setCompletenessError(null);

    // Create or update the proposal
    if (!isSaving) {
      setIsSaving(true);
      try {
        const b = bidRef.current;
        const priceNum = b.price ? parseInt(b.price.replace(/\D/g, ""), 10) : undefined;
        const proposalData = {
          homeownerName: b.owner,
          projectTitle: b.project,
          projectSummary: b.notes,
          scopeItems: b.scope.map((title) => ({ title })),
          totalPrice: priceNum,
          priceNote: b.priceType ? `${b.priceType.charAt(0).toUpperCase() + b.priceType.slice(1)} — final price confirmed on site.` : undefined,
          addOns: b.optional.map((title) => ({ title })),
          timelineCompletion: b.timeline,
          status: "sent",
        };

        if (draftProposalId) {
          // Update existing draft
          const { updateProposalFromBuilder } = await import("@/lib/supabase/actions");
          const response = await updateProposalFromBuilder(draftProposalId, proposalData);
          if (response.error) {
            pushAi(`Error updating proposal: ${response.error}`, "system");
            setIsSaving(false);
            return;
          }
        } else {
          // Create new proposal
          const { createProposalFromBuilder } = await import("@/lib/supabase/actions");
          const response = await createProposalFromBuilder(proposalData);
          if (response.error) {
            pushAi(`Error creating proposal: ${response.error}`, "system");
            setIsSaving(false);
            return;
          }
          setDraftProposalId(response.proposalId);
          setShareToken(response.shareToken);
        }
      } catch (e) {
        pushAi(`Failed to save proposal: ${(e as Error).message}`, "system");
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    aiRespond(() => {
      if (leadType === "my") {
        setPhase("approved");
        pushAi(
          "Approved. Your bid is ready — delivered as a dedicated shareable link assigned to your contractor profile. A PDF version is also included. You control delivery — share the link by text, email, Facebook, or anywhere else.",
          "system",
        );
      } else {
        setPhase("sent");
        const owner = bidRef.current.owner || "the homeowner";
        pushAi(
          `Approved. Your bid link has been sent to ${owner} for review. I'll relay messages until they approve — their contact stays private for now. A PDF version is also available in the preview.`,
          "system",
        );
        const fromLine =
          contractorName && contractorName.toLowerCase() !== "there"
            ? `${contractorName} from ${companyName}`
            : companyName;
        pushAi(
          `Sent to ${owner}: "Hi ${owner.split(" ")[0]}, ${fromLine} sent you a bid for your project${bidRef.current.address ? ` at ${bidRef.current.address}` : ""}. Review your bid here: [Bid Link]"`,
        );
      }
    }, 1300);
  }

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
          "The homeowner declined this bid. You can start a new bid anytime by texting job details.",
          "system",
        );
      }, 1000);
    }
  }

  function send(raw?: string, kind: ChatMessage["kind"] = "text") {
    const text = (raw ?? input).trim();
    if (!text) return;
    setCompletenessError(null);
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
      aiRespond(() => pushAi("Message delivered to the homeowner."), 600);
    }
  }

  function sendVoiceNote() {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      pushUser("Voice note (0:08)", "voice");
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

  // Build the real proposal link using share token, fallback to site URL for drafts
  const getDraftLink = () => {
    if (shareToken) {
      const isDev = process.env.NODE_ENV !== "production";
      const devOverride = isDev ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL : undefined;
      const base = devOverride || process.env.NEXT_PUBLIC_SITE_URL || "https://homebids.ai";
      return `${base}/p/${shareToken}`;
    }
    return `https://homebids.ai/draft/${lead?.id ?? "draft"}-${(bid.owner || "owner").split(" ")[0].toLowerCase()}`;
  };
  const bidLink = getDraftLink();
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
          <p className="mb-1.5 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Not Included</p>
          {bid.exclusions.map((s, i) => <p key={i} className="text-muted-foreground">• {s}</p>)}
        </div>
      )}
      {(bid.warrantyNote || bid.permitsIncluded !== null) && (
        <div className="border-b border-border px-4 py-3 space-y-1">
          {bid.warrantyNote && (
            <div className="flex justify-between">
              <span className="font-medium">Warranty</span>
              <span className="text-muted-foreground">{bid.warrantyNote}</span>
            </div>
          )}
          {bid.permitsIncluded !== null && (
            <div className="flex justify-between">
              <span className="font-medium">Permits</span>
              <span className="text-muted-foreground">{bid.permitsIncluded ? "Included" : "Not included"}</span>
            </div>
          )}
        </div>
      )}
      <div className="border-b border-border px-4 py-3">
        <p className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Pricing</p>
        <div className="flex justify-between font-bold"><span>Total Bid</span><span>{bid.price || "TBD"}</span></div>
        {bid.priceIncludes && <p className="mt-0.5 text-muted-foreground">Includes: {bid.priceIncludes}</p>}
      </div>
      {(bid.inspectionRequired !== null || bid.depositRequired !== null || bid.financingAvailable !== null) && (
        <div className="border-b border-border px-4 py-3 space-y-1">
          <p className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Inspection & Payment</p>
          {bid.inspectionRequired === false && <p className="text-muted-foreground">Inspection: Not required</p>}
          {bid.inspectionRequired === true && bid.inspectionIsFree === true && (
            <p className="text-muted-foreground">Inspection: Free in-person{bid.inspectionFeeDeductedIfAccepted ? " (deducted if accepted)" : ""}</p>
          )}
          {bid.inspectionRequired === true && bid.inspectionIsFree === false && bid.inspectionFeeAmount && (
            <p className="text-muted-foreground">Inspection Fee: {bid.inspectionFeeAmount}{bid.inspectionFeeDeductedIfAccepted ? " (deducted if accepted)" : ""}</p>
          )}
          {bid.depositRequired === false && <p className="text-muted-foreground">Deposit: Not required</p>}
          {bid.depositRequired === true && bid.depositAmount && (
            <p className="text-muted-foreground">Deposit: {bid.depositAmount}{bid.depositRefundable === false ? " (non-refundable)" : bid.depositRefundable === true ? " (refundable)" : ""}</p>
          )}
          {bid.financingAvailable === true && <p className="text-muted-foreground">Financing: Available{bid.financingNote ? ` — ${bid.financingNote}` : ""}</p>}
        </div>
      )}
      {bid.contractorMessage && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Contractor Message</p>
          <p className="text-muted-foreground">{bid.contractorMessage}</p>
        </div>
      )}
      <div className="px-4 py-3">
        <p className="mb-2 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: "9px" }}>Acceptance</p>
        <p className="text-muted-foreground">Owner Signature: _____________________  Date: __________</p>
        <p className="mt-2 text-muted-foreground" style={{ fontSize: "9px" }}>
          {bid.depositAmount ? `${bid.depositAmount} deposit on acceptance · balance due on completion · ` : ""}
          {bid.warrantyNote || "1-year workmanship guarantee"}
        </p>
      </div>
    </div>
  );

  const pdfReady = phase === "approved" || phase === "sent" || phase === "declined";
  const messagingUnlocked = phase === "approved" && leadType === "homebids";

  const deliveryActions = (
    <div className="space-y-2">
      {leadType === "my" && phase === "approved" && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => doCopy("link", bidLink)}>
              <Link2 className="h-3.5 w-3.5" /> {copied === "link" ? "Copied!" : "Copy Bid Link"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => doCopy("share", buildDraftText(bid))}>
              <Share2 className="h-3.5 w-3.5" /> {copied === "share" ? "Copied!" : "Share Bid Link"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => setShowPdf(true)}>
              <FileText className="h-3.5 w-3.5" /> View PDF
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => window.print()}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>
          <Button
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={() => {
              const phone = bid.phone || "";
              window.location.href = getSmsHref(phone, `Hi ${bid.owner.split(" ")[0] || "there"}, here's your bid for ${bid.project}. ${bidLink}`);
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" /> Message Customer
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
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => doCopy("link", bidLink)}>
              <Link2 className="h-3.5 w-3.5" /> {copied === "link" ? "Copied!" : "Copy Bid Link"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => setShowPdf(true)}>
              <FileText className="h-3.5 w-3.5" /> View PDF
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent text-xs" onClick={() => window.print()}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-green-600 text-xs text-white hover:bg-green-700"
              onClick={() => {
                window.location.href = getSmsHref(bid.phone || "", `Hi ${bid.owner.split(" ")[0] || "there"}, thanks for approving the bid! When works to get started?`);
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Text Homeowner
            </Button>
          </div>
        </>
      )}

      {phase === "declined" && (
        <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={onClose}>
          Start a New Bid
        </Button>
      )}
    </div>
  );

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

          {completenessError && !aiTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {completenessError}
              </div>
            </div>
          )}

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
            <Button
              size="sm"
              className="h-10 w-10 shrink-0 p-0"
              onClick={() => send()}
              disabled={!input.trim() || aiTyping || recording}
              aria-label="Send message"
            >
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
            {pdfReady ? "Bid Ready to Share" : "Live Bid Preview"}
          </p>
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${pdfReady ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            {pdfReady ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
            {pdfReady ? "Ready" : "Draft"}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {pdfReady || phase === "review" || phase === "gathering" ? (
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
              <FileText className="h-4 w-4 text-primary" /> Bid Preview
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
