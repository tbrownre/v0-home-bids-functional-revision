import { SMS_PHONE_NUMBER, SMS_PHONE_DISPLAY, CONTRACTOR_SMS_PHONE_NUMBER, CONTRACTOR_SMS_PHONE_DISPLAY } from "@/lib/sms-config";

/**
 * ADLAND (Tim + Abir, Oct 9 — Meta/IG ad landing pages).
 *
 * One landing page per ad creative, living at /go/<slug>. The page IS the creative, alive: the same headline,
 * the same subline, the same iMessage conversation playing itself out, one button that opens the visitor's
 * Messages app with the right HomeBids number and a starter text already typed.
 *
 *   homeowner pages  → Ava         (404) 395-2879   free, no account
 *   contractor pages → Bid Builder (283) 229-1348   $99/mo after a 14-day free trial
 *
 * Message match is the whole point: every word on the page comes from the creative that sent the click, so
 * the visitor sees exactly what they tapped on. Keep headline / sub / chat text in sync with the creative files
 * (reference set: "referece creatives … this is for you claude.zip", Oct 9). The starter text each page sends
 * names the creative, so Tim can see in the Ava / Bid Builder threads which ad brought the lead.
 *
 * Security: this file is the ONLY source of page content. The route renders a slug only if it is listed here
 * (static params, dynamicParams off → anything else is a 404) and never echoes query strings into the page.
 */

export type Audience = "homeowner" | "contractor";

export interface ChatLine {
  /** "me" = the person texting (blue bubble, right); "them" = the business / HomeBids (grey, left) */
  from: "me" | "them";
  text: string;
}

export interface LandingPage {
  slug: string;
  audience: Audience;
  /** Headline exactly as on the creative: line 1 (black) and line 2 (blue italic). */
  headline: [string, string];
  /** Optional words that rotate in place of line 2 (typewriter) — the first one is the creative's own. */
  rotate?: string[];
  sub: string;
  /** Small pill under the button, from the creative ("No app to learn", "Fast lead intake", …). */
  tag: string;
  /** Who the conversation is with in the phone mock. */
  chat: { name: string; byline?: string; avatar: string };
  messages: ChatLine[];
  /** Starter text the button pre-fills (names the creative so leads can be attributed in the thread). */
  smsBody: string;
  /** For ad-manager naming / search terms; also the meta description keywords. */
  keywords: string[];
}

const HOMEOWNER_CHAT = { name: "HomeBids", avatar: "HB" };
const PRO = (name: string, avatar: string) => ({ name, byline: "Powered by HomeBids", avatar });

export const LANDING_PAGES: LandingPage[] = [
  // ─────────────────────────── CONTRACTORS → Bid Builder ───────────────────────────
  {
    slug: "front-desk",
    audience: "contractor",
    headline: ["Your", "24/7 front desk"],
    sub: "Every new lead gets a fast reply by text.",
    tag: "No app to learn",
    chat: PRO("Desert Air Pros", "☀️"),
    messages: [
      { from: "me", text: "AC went out. Can I get a quote?" },
      { from: "them", text: "Absolutely ✅ What city are you in?" },
      { from: "me", text: "Gilbert, AZ." },
      { from: "them", text: "Perfect ✅ We started your estimate." },
    ],
    smsBody: "Hi! I saw your 24/7 front desk ad - let's create a new bid",
    keywords: ["24/7 front desk", "every new lead", "fast reply by text", "contractor"],
  },
  {
    slug: "never-miss-a-lead",
    audience: "contractor",
    headline: ["Never", "miss a lead"],
    sub: "Fast first responses. Better scope collection by text.",
    tag: "Fast lead intake",
    chat: PRO("Summit Roofing", "🏠"),
    messages: [
      { from: "me", text: "Need help with a roof leak." },
      { from: "them", text: "Send 2 photos + your zip." },
      { from: "me", text: "85234. Photos sent." },
      { from: "them", text: "Got it ✅ Scope started." },
    ],
    smsBody: "Hi! I saw your never miss a lead ad - let's create a new bid",
    keywords: ["never miss a lead", "fast first response", "scope collection", "contractor"],
  },
  {
    slug: "text-in-bid-out",
    audience: "contractor",
    headline: ["Text in.", "Bid out."],
    sub: "Let your page handle the first response for you.",
    tag: "Faster estimates",
    chat: PRO("Spotless Cleaning", "🧽"),
    messages: [
      { from: "me", text: "Need a deep clean for a 3 bed home." },
      { from: "them", text: "One-time or recurring?" },
      { from: "me", text: "One-time. This week." },
      { from: "them", text: "Perfect ✅ Quote started." },
    ],
    smsBody: "Hi! I saw your text in, bid out ad - let's create a new bid",
    keywords: ["text in bid out", "first response", "faster estimates", "contractor"],
  },
  {
    slug: "lead-intake",
    audience: "contractor",
    headline: ["Lead intake", "handled"],
    sub: "More replies. Less chasing leads.",
    tag: "Stay on the job",
    chat: PRO("Green Valley Landscaping", "🌿"),
    messages: [
      { from: "me", text: "Can I get a quote for backyard cleanup?" },
      { from: "them", text: "Send your address + 2 yard photos." },
      { from: "me", text: "234 Oak Ave. Sending now." },
      { from: "them", text: "Great ✅ Estimate started." },
    ],
    smsBody: "Hi! I saw your lead intake ad - let's create a new bid",
    keywords: ["lead intake handled", "more replies", "less chasing leads", "contractor"],
  },
  {
    slug: "page-works-247",
    audience: "contractor",
    headline: ["Your page", "works 24/7"],
    sub: "Customers text in. You keep working.",
    tag: "Leads handled 24/7",
    chat: PRO("Riverside Plumbing", "💧"),
    messages: [
      { from: "me", text: "Can I get a water heater quote?" },
      { from: "them", text: "Absolutely ✅ Zip code?" },
      { from: "me", text: "85234." },
      { from: "them", text: "Perfect ✅ We started your estimate." },
    ],
    smsBody: "Hi! I saw your page works 24/7 ad - let's create a new bid",
    keywords: ["your page works 24/7", "customers text in", "leads handled", "contractor"],
  },
  {
    slug: "fire-your-wife",
    audience: "contractor",
    headline: ["Fire your wife.", "Hire us."],
    sub: "If she's answering leads and chasing estimates, give her a break. Let HomeBids handle the busywork.",
    tag: "Give her time back",
    chat: PRO("Riverside Plumbing", "💧"),
    messages: [
      { from: "me", text: "Can I get a water heater quote?" },
      { from: "them", text: "Absolutely ✅ Zip code?" },
      { from: "me", text: "85234." },
      { from: "them", text: "Perfect ✅ We started your estimate." },
    ],
    smsBody: "Hi! I saw your give her time back ad - let's create a new bid",
    keywords: ["fire your wife hire us", "give her time back", "busywork", "contractor"],
  },

  {
    // Tim's Astra contractor brief (Oct 9): "Meet your new" + the 15 rotating roles, his two support lines, his exact
    // prefilled text - pointed at the CONTRACTOR line (the Astra page used Ava's homeowner number by mistake).
    slug: "your-new-assistant",
    audience: "contractor",
    headline: ["Meet your new", "assistant"],
    rotate: [
      "assistant", "CSR", "website", "sales rep", "after-hours rep", "lead intake system", "bid builder", "estimating assistant",
      "customer service rep", "follow-up assistant", "24/7 receptionist", "sales assistant", "office assistant", "lead manager", "business assistant",
    ],
    sub: "More bids. More opportunities. Just text us.",
    tag: "Free to try. No app. No software to learn.",
    chat: { name: "HomeBids", avatar: "HB" },
    messages: [
      { from: "me", text: "Hey HomeBids, help me build a new bid." },
      { from: "them", text: "Absolutely! What's the job?" },
      { from: "me", text: "Replace a kitchen faucet. Labor only." },
      { from: "them", text: "Got it. For a standard swap, a suggested labor range is $150–$250. What would you like to charge?" },
      { from: "me", text: "$195." },
      { from: "them", text: "Perfect! ✅ Your professional estimate is ready. Kitchen Faucet Replacement · Labor $195 · Total $195 · View & Send Estimate →" },
    ],
    smsBody: "Hi HomeBids, I want to try your assistant",
    keywords: ["meet your new assistant", "more bids", "more opportunities", "just text us", "no software to learn", "contractor"],
  },
  // ─────────────────────────── HOMEOWNERS → Ava ───────────────────────────
  {
    slug: "tell-us",
    audience: "homeowner",
    headline: ["Tell us", "what you need"],
    sub: "The fastest way to get your project moving.",
    tag: "No forms. No app.",
    chat: HOMEOWNER_CHAT,
    messages: [
      { from: "me", text: "Need help with a roof leak." },
      { from: "them", text: "Send 2 photos + your zip." },
      { from: "me", text: "85234. Sending now." },
      { from: "them", text: "Perfect ✅ We're getting your estimate started." },
    ],
    smsBody: "Hi HomeBids, I saw your ad - I need help with a home project!",
    keywords: ["tell us what you need", "get your project moving", "no forms no app", "homeowner"],
  },
  {
    slug: "start-by-text",
    audience: "homeowner",
    headline: ["Start", "by text"],
    sub: "Real project help in just a few messages.",
    tag: "Fast project intake",
    chat: HOMEOWNER_CHAT,
    messages: [
      { from: "me", text: "Need a plumber for a leaking water heater." },
      { from: "them", text: "What city are you in?" },
      { from: "me", text: "Gilbert, AZ." },
      { from: "them", text: "Great ✅ Matching you now." },
    ],
    smsBody: "Hi HomeBids, I saw your ad - I need help with a home project!",
    keywords: ["start by text", "real project help", "few messages", "homeowner"],
  },
  {
    slug: "project-moving",
    audience: "homeowner",
    headline: ["Get your", "project moving"],
    sub: "The quickest way to start a real home service job.",
    tag: "Matched faster",
    chat: HOMEOWNER_CHAT,
    messages: [
      { from: "me", text: "Need a house cleaner for a 3 bed home." },
      { from: "them", text: "One-time or recurring?" },
      { from: "me", text: "One-time." },
      { from: "them", text: "Perfect ✅ Quotes are being started." },
    ],
    smsBody: "Hi HomeBids, I saw your ad - I need help with a home project!",
    keywords: ["get your project moving", "home service job", "matched faster", "homeowner"],
  },
  {
    slug: "real-help-fast",
    audience: "homeowner",
    headline: ["Real help.", "Fast."],
    sub: "Skip the forms and start your project by text.",
    tag: "Fast homeowner flow",
    chat: HOMEOWNER_CHAT,
    messages: [
      { from: "me", text: "Need interior painting for 2 bedrooms." },
      { from: "them", text: "How soon do you want to start?" },
      { from: "me", text: "Next week." },
      { from: "them", text: "Great ✅ We're getting your estimate started." },
    ],
    smsBody: "Hi HomeBids, I saw your ad - I need help with a home project!",
    keywords: ["real help fast", "skip the forms", "start your project by text", "homeowner"],
  },
  {
    slug: "no-forms",
    audience: "homeowner",
    headline: ["No forms.", "Just text."],
    sub: "The fastest way to get a real job filled.",
    tag: "Get started in minutes",
    chat: HOMEOWNER_CHAT,
    messages: [
      { from: "me", text: "Need backyard cleanup this week." },
      { from: "them", text: "Send your address + 2 photos." },
      { from: "me", text: "85234. Sending now." },
      { from: "them", text: "Perfect ✅ We're getting this moving." },
    ],
    smsBody: "Hi HomeBids, I saw your ad - I need help with a home project!",
    keywords: ["no forms just text", "get a real job filled", "get started in minutes", "homeowner"],
  },
  {
    slug: "house-cleaner",
    audience: "homeowner",
    headline: ["Meet your new", "house cleaner"],
    rotate: ["house cleaner", "plumber", "landscaper", "painter", "handyman"],
    sub: "The fastest way to hire help at home. Just text us. No account required. 100% free.",
    tag: "No app to download. Just text.",
    chat: HOMEOWNER_CHAT,
    messages: [
      { from: "me", text: "Hi HomeBids! I need help with a house cleaning." },
      { from: "them", text: "Happy to help. What size home and when do you need it cleaned?" },
      { from: "me", text: "3 bed, 2 bath. About 1,800 sq ft. This Friday if possible." },
      { from: "them", text: "Perfect. Standard cleaning for that size home is usually around $180–$220. I'm finding a cleaner for you now." },
      { from: "me", text: "Awesome, thank you." },
      { from: "them", text: "You're all set ✅ Your request is in and you'll hear from a cleaner shortly." },
    ],
    smsBody: "Hi HomeBids, I saw your ad - I need a house cleaner",
    keywords: ["meet your new house cleaner", "hire help at home", "no account required", "100% free", "homeowner"],
  },
];

export const LANDING_SLUGS = LANDING_PAGES.map((p) => p.slug);

export function getLandingPage(slug: string): LandingPage | null {
  return LANDING_PAGES.find((p) => p.slug === slug) ?? null;
}

/** The number + display for a page's audience. */
export function smsTargetFor(audience: Audience) {
  return audience === "contractor"
    ? { phone: CONTRACTOR_SMS_PHONE_NUMBER, display: CONTRACTOR_SMS_PHONE_DISPLAY }
    : { phone: SMS_PHONE_NUMBER, display: SMS_PHONE_DISPLAY };
}

/** sms: href with the starter text — the "?&" form opens the body on both iPhone and Android. */
export function smsHrefFor(page: LandingPage): string {
  const { phone } = smsTargetFor(page.audience);
  return `sms:${phone}?&body=${encodeURIComponent(page.smsBody)}`;
}

/** Audience copy for the sections below the fold — same words on every page of that lane. */
export const AUDIENCE_COPY = {
  homeowner: {
    priceLine: "Free for homeowners. Always.",
    riskLine: "No account. No forms. No obligation — you pick the bid, or none at all.",
    proof: ["Local pros - license & insurance shown", "Real bids by text, usually same day", "You stay in control of who you hire"],
    steps: [
      ["Text what you need", "A photo helps. A sentence is enough."],
      ["We line up local pros", "Your project goes out to pros who do this work in your area."],
      ["Pick your bid", "Bids and questions come to you by text. Approve the one you like."],
    ],
    faq: [
      ["Is it really free?", "Yes. Homeowners never pay HomeBids. Pros pay for the software, not for your project."],
      ["Do I need an app or account?", "No. Everything happens in your Messages app. Your private project page opens from a link we text you."],
      ["Who texts me back?", "HomeBids runs the first steps - collecting what the pro needs to quote. Then real local pros send real bids."],
    ],
    finalLine: "Your project starts with one text.",
  },
  contractor: {
    priceLine: "$99/month after a 14-day free trial. Cancel anytime.",
    riskLine: "Built for contractors. No contract - your leads, your bids, your customers. We just handle the texting.",
    proof: ["Unlimited bids - PDF + online link", "Your own landing page that answers first", "Homeowner approvals come back by text"],
    steps: [
      ["Text the job", "Who, where, what. Photos if you have them."],
      ["Bid Builder writes the bid", "Professional PDF + a link the homeowner can approve from their phone."],
      ["You keep working", "Leads text your page, get a fast reply and a scope started - day or night."],
    ],
    faq: [
      ["What does it cost?", "$99 a month after a 14-day free trial. Unlimited bids. Cancel anytime from your account page."],
      ["Do I have to learn new software?", "No. You text. Bid Builder builds the bid and sends it. Your dashboard is there when you want it."],
      ["Do you take a cut of my jobs?", "Never. No lead fees, no commissions. The subscription is the only charge."],
    ],
    finalLine: "Your next bid starts with one text.",
  },
} as const;
