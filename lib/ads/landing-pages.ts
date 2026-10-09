import { SMS_PHONE_NUMBER, SMS_PHONE_DISPLAY, CONTRACTOR_SMS_PHONE_NUMBER, CONTRACTOR_SMS_PHONE_DISPLAY } from "@/lib/sms-config";

/**
 * ADLAND (Tim + Abir, Oct 9 — Meta/IG ad landing pages).
 *
 * One landing page per ad creative, living at /go/<slug>. The page IS the creative, alive: the same headline,
 * the same subline, the same iMessage conversation playing itself out, and the whole page is one tap that opens
 * the visitor's Messages app with the right HomeBids number and a starter text already typed.
 * Oct 10 (Tim): the page design is the replica of the reference experience page (components/ads/ad-landing.tsx);
 * typewriter pages carry one conversation per rotating word (`scenes`).
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
  /** Contractor demos: a compact estimate preview card under the bubble (Tim's brief §7). */
  card?: { title: string; lines: string[]; cta?: string };
}

export interface LandingPage {
  slug: string;
  audience: Audience;
  /** Headline exactly as on the creative: line 1 (black) and line 2 (blue italic). */
  headline: [string, string];
  /** Optional words that rotate in place of line 2 (typewriter) — the first one is the creative's own. */
  rotate?: string[];
  sub: string;
  /** Optional second, smaller line under the subline ("No account required. 100% free."). */
  sub2?: string;
  /** Caption under the button, from the creative ("No app to learn", "Fast lead intake", …). */
  tag: string;
  /** Who the conversation is with in the phone mock. */
  chat: { name: string; byline?: string; avatar: string };
  messages: ChatLine[];
  /** Typewriter pages: one conversation per rotating word (falls back to `messages` for words not listed). */
  scenes?: Record<string, ChatLine[]>;
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
    // Tim's contractor brief (Oct 9): "Meet your new" + the 15 rotating roles, his two support lines, his exact
    // prefilled text - pointed at the CONTRACTOR line (the Astra page used Ava's homeowner number by mistake).
    // Demos 1-3 are his verbatim scripts; the remaining 12 follow his role → demonstration mapping.
    slug: "your-new-assistant",
    audience: "contractor",
    headline: ["Meet your new", "assistant"],
    rotate: [
      "assistant", "CSR", "website", "sales rep", "after-hours rep", "lead intake system", "bid builder", "estimating assistant",
      "customer service rep", "follow-up assistant", "24/7 receptionist", "sales assistant", "office assistant", "lead manager", "business assistant",
    ],
    sub: "More bids. More opportunities. Just text us.",
    sub2: "Free to try. No app. No software to learn.",
    tag: "No app to download. Just text.",
    chat: { name: "HomeBids", avatar: "HB" },
    messages: [
      { from: "me", text: "Hey HomeBids, help me build a new bid." },
      { from: "them", text: "Absolutely! What's the job?" },
      { from: "me", text: "Replace a kitchen faucet. Labor only." },
      { from: "them", text: "Got it. Is the new faucet already on-site?" },
      { from: "me", text: "Yes. Standard swap." },
      { from: "them", text: "For a standard replacement, a suggested labor range is $150–$250. What would you like to charge?" },
      { from: "me", text: "$195." },
      { from: "them", text: "Perfect! ✅ Your professional estimate is ready.", card: { title: "Kitchen Faucet Replacement", lines: ["Labor: $195", "Total: $195"] } },
    ],
    scenes: {
      CSR: [
        { from: "them", text: "🔔 New cleaning lead!" },
        { from: "me", text: "Send me the details." },
        { from: "them", text: "Sarah needs a house cleaning. 3 bed, 2 bath, approximately 1,800 sq ft. Friday preferred. ZIP 85296." },
        { from: "me", text: "Let's quote $220." },
        { from: "them", text: "Got it! ✅ Your professional cleaning estimate is ready.", card: { title: "Residential House Cleaning", lines: ["3 Bed / 2 Bath", "Total: $220"] } },
      ],
      website: [
        { from: "them", text: "🔔 New lead from your HomeBids page!" },
        { from: "me", text: "What's the job?" },
        { from: "them", text: "James needs a ceiling fan replaced. Existing wiring is in place. Gilbert, AZ. Homeowner is ready for an estimate." },
        { from: "me", text: "Build a quote for $175." },
        { from: "them", text: "Done! ✅ Your professional estimate is ready to review and send.", card: { title: "Ceiling Fan Replacement", lines: ["Labor: $175", "Total: $175"] } },
      ],
      "sales rep": [
        { from: "them", text: "🔔 New plumbing lead! Maria in Gilbert - water heater not heating. ZIP 85296." },
        { from: "me", text: "Send the details." },
        { from: "them", text: "10-year-old 40-gal gas unit, no hot water since last night. She wants a replacement quote." },
        { from: "me", text: "Quote $1,450 installed." },
        { from: "them", text: "Done! ✅ Your professional estimate is ready.", card: { title: "Water Heater Replacement", lines: ["40-gal gas, installed", "Total: $1,450"] } },
      ],
      "after-hours rep": [
        { from: "them", text: "🔔 New inquiry at 9:42 PM - Dave in Chandler: AC blowing warm air. ZIP 85225." },
        { from: "me", text: "Tell him I can be there at 8 AM." },
        { from: "them", text: "Sent ✅ Dave confirmed 8 AM. His address and photos are on your leads page." },
        { from: "me", text: "Build a diagnostic quote, $89." },
        { from: "them", text: "Got it! ✅ Your estimate is ready.", card: { title: "AC Diagnostic Visit", lines: ["System check + report", "Total: $89"] } },
      ],
      "lead intake system": [
        { from: "them", text: "🔔 New plumbing lead from your HomeBids page!" },
        { from: "me", text: "What's the job?" },
        { from: "them", text: "Suspected slab leak - wet spot in the hallway. 2-story, 2,400 sq ft, Mesa 85204. Homeowner is free weekday mornings." },
        { from: "me", text: "Quote a leak detection visit, $185." },
        { from: "them", text: "Got it! ✅ Your estimate is ready.", card: { title: "Leak Detection Visit", lines: ["Diagnostic + written report", "Total: $185"] } },
      ],
      "bid builder": [
        { from: "me", text: "Build a bid: interior paint, 2 bedrooms, walls only." },
        { from: "them", text: "Got it. About how big are the rooms?" },
        { from: "me", text: "Both about 12 by 12. $650 total." },
        { from: "them", text: "Perfect! ✅ Your professional estimate is ready.", card: { title: "Interior Painting - 2 Bedrooms", lines: ["Walls only, 2 coats", "Total: $650"] } },
      ],
      "estimating assistant": [
        { from: "me", text: "Estimate for a backyard cleanup: weeds, shrub trim, haul away." },
        { from: "them", text: "Got it. About how big is the yard?" },
        { from: "me", text: "Small - maybe 1,500 sq ft. $320." },
        { from: "them", text: "Done! ✅ Your estimate is ready.", card: { title: "Backyard Cleanup", lines: ["Weeds, shrub trim, haul-away", "Total: $320"] } },
      ],
      "customer service rep": [
        { from: "them", text: "🔔 New homeowner request - Priya in Gilbert: garage door won't open." },
        { from: "me", text: "Ask if the spring is broken." },
        { from: "them", text: "Asked ✅ She heard a loud bang yesterday - likely the spring. Photos attached." },
        { from: "me", text: "Quote $275 for a spring replacement." },
        { from: "them", text: "Got it! ✅ Your estimate is ready.", card: { title: "Garage Door Spring Replacement", lines: ["Torsion spring, parts + labor", "Total: $275"] } },
      ],
      "follow-up assistant": [
        { from: "them", text: "Reminder: Sarah hasn't opened your cleaning estimate ($220) from Tuesday." },
        { from: "me", text: "Send her a friendly follow-up." },
        { from: "them", text: "Sent ✅ \"Hi Sarah, just checking in - happy to answer any questions on the estimate.\"" },
        { from: "them", text: "Sarah replied: \"Thanks! Can you do Friday?\"" },
        { from: "me", text: "Yes, 9 AM works." },
        { from: "them", text: "Passed along ✅ She confirmed Friday at 9 AM." },
      ],
      "24/7 receptionist": [
        { from: "them", text: "🔔 New lead at 11:15 PM - Tom in Queen Creek: kitchen faucet dripping. ZIP 85142." },
        { from: "me", text: "Offer him my first opening tomorrow." },
        { from: "them", text: "Sent ✅ Tom took 10 AM. Details are on your leads page." },
        { from: "me", text: "Quote $165 for the repair." },
        { from: "them", text: "Got it! ✅ Your estimate is ready.", card: { title: "Faucet Repair", lines: ["Cartridge + labor", "Total: $165"] } },
      ],
      "sales assistant": [
        { from: "them", text: "🔔 New lead! Ana in Mesa needs a ceiling fan installed - wiring already in place." },
        { from: "me", text: "Quote $175." },
        { from: "them", text: "Done! ✅ Your estimate is ready to send.", card: { title: "Ceiling Fan Installation", lines: ["Existing wiring", "Total: $175"] } },
      ],
      "office assistant": [
        { from: "me", text: "New bid: yard cleanup for the Hendersons - weeds and two palm trims." },
        { from: "them", text: "Got it. What would you like to charge?" },
        { from: "me", text: "$390." },
        { from: "them", text: "Perfect! ✅ Your estimate is ready.", card: { title: "Yard Cleanup + Palm Trim", lines: ["Weeds, 2 palms, haul-away", "Total: $390"] } },
      ],
      "lead manager": [
        { from: "them", text: "🔔 New cleaning lead! Jen in Gilbert - 4 bed, 3 bath, deep clean before move-in. ZIP 85297." },
        { from: "me", text: "Quote $380." },
        { from: "them", text: "Got it! ✅ Your estimate is ready.", card: { title: "Move-In Deep Clean", lines: ["4 Bed / 3 Bath", "Total: $380"] } },
      ],
      "business assistant": [
        { from: "me", text: "Hey HomeBids, build a bid for a drywall patch - two holes in the hallway." },
        { from: "them", text: "Got it. Texture match and paint too?" },
        { from: "me", text: "Yes. $240." },
        { from: "them", text: "Done! ✅ Your professional estimate is ready to review and send.", card: { title: "Drywall Repair - Hallway", lines: ["2 patches, texture + paint", "Total: $240"] } },
      ],
    },
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
    // The replica (Tim Oct 9): the reference homeowner page's 15 trades and conversations, verbatim, with our number.
    slug: "house-cleaner",
    audience: "homeowner",
    headline: ["Meet your new", "house cleaner"],
    rotate: [
      "house cleaner", "plumber", "electrician", "handyman", "landscaper", "painter", "HVAC technician", "roofer",
      "carpet cleaner", "pool cleaner", "flooring installer", "window cleaner", "pest control pro", "pressure washer", "home remodeler",
    ],
    sub: "The fastest way to hire help at home. Just text us.",
    sub2: "No account required. 100% free.",
    tag: "No app to download. Just text.",
    chat: HOMEOWNER_CHAT,
    messages: [
      { from: "me", text: "Hi HomeBids! I need help with a house cleaning." },
      { from: "them", text: "Happy to help! 😊 How big is your home, and when do you need it cleaned?" },
      { from: "me", text: "3 bed, 2 bath. About 1,800 sq ft. This Friday." },
      { from: "them", text: "Perfect! What ZIP code are you in?" },
      { from: "me", text: "85296" },
      { from: "them", text: "Got it! ✅ I'm getting your request ready for local cleaners. You'll hear from us soon!" },
    ],
    scenes: {
      plumber: [
        { from: "me", text: "Hey HomeBids! I need a plumber." },
        { from: "them", text: "Of course! What's going on?" },
        { from: "me", text: "My kitchen sink is leaking." },
        { from: "them", text: "Can you send a photo and your ZIP code?" },
        { from: "me", text: "85234. Here's a photo. 📷" },
        { from: "them", text: "Perfect! ✅ I'm getting your request ready for local plumbers." },
      ],
      electrician: [
        { from: "me", text: "I need an electrician to install a ceiling fan." },
        { from: "them", text: "Happy to help! Is the wiring already there?" },
        { from: "me", text: "Yes. Just replacing an old fan." },
        { from: "them", text: "Great! What's your ZIP code?" },
        { from: "me", text: "85295" },
        { from: "them", text: "You're all set! ✅ I'm getting your request ready for local electricians." },
      ],
      handyman: [
        { from: "me", text: "Hi! I need help mounting a TV." },
        { from: "them", text: "Absolutely! What size TV, and what kind of wall?" },
        { from: "me", text: "65 inches, on drywall. I have the mount." },
        { from: "them", text: "Got it! What ZIP code, and when works for you?" },
        { from: "me", text: "85296. Any afternoon next week." },
        { from: "them", text: "Perfect! ✅ I'm preparing your request for local handymen." },
      ],
      landscaper: [
        { from: "me", text: "My backyard needs a cleanup." },
        { from: "them", text: "Happy to help! What needs attention?" },
        { from: "me", text: "Weeds, overgrown shrubs, and a small lawn." },
        { from: "them", text: "What ZIP code, and how soon do you need help?" },
        { from: "me", text: "85234. Sometime this week." },
        { from: "them", text: "Got it! ✅ I'm preparing your cleanup request for local landscapers." },
      ],
      painter: [
        { from: "me", text: "I'd like to paint two bedrooms." },
        { from: "them", text: "Of course! Just the walls, or ceilings and trim too?" },
        { from: "me", text: "Just the walls. Both rooms are about 12 by 12." },
        { from: "them", text: "Thanks! What ZIP code and timing?" },
        { from: "me", text: "85295. In the next two weeks." },
        { from: "them", text: "Perfect! ✅ I'm getting your request ready for local painters." },
      ],
      "HVAC technician": [
        { from: "me", text: "My AC isn't cooling like it used to." },
        { from: "them", text: "Is it still running? Any unusual sounds?" },
        { from: "me", text: "It's running, but the air is warm. No odd noises." },
        { from: "them", text: "Got it. What's your ZIP code and availability?" },
        { from: "me", text: "85296. I'm home tomorrow." },
        { from: "them", text: "Thanks! ✅ I'm preparing your service request for local HVAC pros." },
      ],
      roofer: [
        { from: "me", text: "I noticed a few broken roof tiles." },
        { from: "them", text: "I can help. Any leaks inside, or visible damage only?" },
        { from: "me", text: "Visible damage only. It's a single-story home." },
        { from: "them", text: "Please share your ZIP code and preferred timing." },
        { from: "me", text: "85234. An inspection next week would be great." },
        { from: "them", text: "Got it! ✅ I'm preparing your inspection request for local roofers." },
      ],
      "carpet cleaner": [
        { from: "me", text: "Can you help me find a carpet cleaner?" },
        { from: "them", text: "Sure! How many rooms, and any stains?" },
        { from: "me", text: "Three bedrooms. A few pet stains in one." },
        { from: "them", text: "What's your ZIP code, and when do you need it?" },
        { from: "me", text: "85295. Before next weekend." },
        { from: "them", text: "Perfect! ✅ I'm getting your request ready for local carpet cleaners." },
      ],
      "pool cleaner": [
        { from: "me", text: "My pool needs a good cleaning." },
        { from: "them", text: "Happy to help! A one-time clean or regular service?" },
        { from: "me", text: "One-time for now. Lots of leaves, water is clear." },
        { from: "them", text: "About how big is the pool, and your ZIP code?" },
        { from: "me", text: "About 12,000 gallons. 85296. This week." },
        { from: "them", text: "Got it! ✅ I'm preparing your request for local pool cleaners." },
      ],
      "flooring installer": [
        { from: "me", text: "I want new flooring in my living room." },
        { from: "them", text: "What material and approximate room size?" },
        { from: "me", text: "Vinyl plank, about 350 sq ft. Replacing carpet." },
        { from: "them", text: "Do you have the flooring? And what's your ZIP?" },
        { from: "me", text: "Yes, it's here. 85234. Flexible on dates." },
        { from: "them", text: "Perfect! ✅ I'm preparing your request for local flooring installers." },
      ],
      "window cleaner": [
        { from: "me", text: "I need my home's windows cleaned." },
        { from: "them", text: "Of course! About how many, and how many stories?" },
        { from: "me", text: "20 windows, two stories. Inside and outside." },
        { from: "them", text: "What ZIP code, and when would you like help?" },
        { from: "me", text: "85295. Next week if possible." },
        { from: "them", text: "Got it! ✅ I'm getting your request ready for local window cleaners." },
      ],
      "pest control pro": [
        { from: "me", text: "We have ants coming into the kitchen." },
        { from: "them", text: "I can help. When did you first notice them?" },
        { from: "me", text: "A few days ago. Mostly around the back door." },
        { from: "them", text: "What ZIP code? Any pets the pro should know about?" },
        { from: "me", text: "85296. One dog. We'd like help this week." },
        { from: "them", text: "Thanks! ✅ I'm preparing your request for local pest control pros." },
      ],
      "pressure washer": [
        { from: "me", text: "I'd like my driveway pressure washed." },
        { from: "them", text: "Happy to help! What surface and approximate size?" },
        { from: "me", text: "Concrete. A two-car driveway with oil stains." },
        { from: "them", text: "What's your ZIP code and preferred timing?" },
        { from: "me", text: "85234. Sometime next week." },
        { from: "them", text: "Perfect! ✅ I'm preparing your request for local pressure washing pros." },
      ],
      "home remodeler": [
        { from: "me", text: "We're thinking about remodeling our bathroom." },
        { from: "them", text: "Exciting! A full remodel or a few updates?" },
        { from: "me", text: "New shower, tile, and vanity. About 60 sq ft." },
        { from: "them", text: "What's your ZIP code and ideal start date?" },
        { from: "me", text: "85295. In a few months. We're gathering estimates." },
        { from: "them", text: "Got it! ✅ I'm preparing your project details for local remodelers." },
      ],
    },
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
