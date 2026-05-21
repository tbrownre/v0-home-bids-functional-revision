"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { getMockUser, USE_MOCK_DATA } from "@/lib/mock-auth";
import { MessageCircle, Zap, Clock, CheckCircle2, Check, Copy } from "lucide-react";

const HOMEBIDS_PHONE = "555-867-5309";
const SMS_BODY = "Hi, I'd like to start a project with HomeBids.";
const SMS_HREF = `sms:${HOMEBIDS_PHONE.replace(/\D/g, "")}?body=${encodeURIComponent(SMS_BODY)}`;

const TRUST_BULLETS = [
  { icon: Zap,          text: "Fastest way to get bids" },
  { icon: Clock,        text: "Takes less than 30 seconds" },
  { icon: CheckCircle2, text: "Our AI does all the work for you" },
];

const VALUE_GRID = [
  { title: "100+ contractors notified",  body: "We do the outreach so you never have to cold-call anyone." },
  { title: "Multiple competitive bids",  body: "Compare real quotes side-by-side and choose with confidence." },
  { title: "No chasing or follow-ups",   body: "Our AI manages the entire process start to finish." },
];

// ── conversation script ────────────────────────────────────────────────────────
type Role = "user" | "ai";
interface ChatMsg { role: Role; text: string; }

const SCENARIOS: ChatMsg[][] = [
  // 1. HVAC replacement
  [
    { role: "user", text: "Hey, my AC stopped blowing cold air completely." },
    { role: "ai",   text: "Got you — is the outdoor unit running at all?" },
    { role: "user", text: "Fan spins but nothing's cooling." },
    { role: "ai",   text: "Sounds like refrigerant or compressor. How old is it?" },
    { role: "user", text: "About 14 years." },
    { role: "ai",   text: "I'll match you with 3 local HVAC pros for free estimates." },
    { role: "ai",   text: "Bids on the way — usually within a few hours!" },
  ],
  // 2. Roof leak repair
  [
    { role: "user", text: "We have a ceiling leak after the last storm." },
    { role: "ai",   text: "Is water dripping or just a stain right now?" },
    { role: "user", text: "Stain, but it got worse with more rain." },
    { role: "ai",   text: "Got it. Do you know how old your roof is?" },
    { role: "user", text: "Maybe 12-15 years. Previous owners." },
    { role: "ai",   text: "I'll find certified roofers near you to inspect and bid." },
    { role: "ai",   text: "Sending your project to qualified contractors now." },
  ],
  // 3. Kitchen remodel
  [
    { role: "user", text: "Just bought the house — kitchen needs a full update." },
    { role: "ai",   text: "Exciting! Cabinets, counters, appliances — or all of it?" },
    { role: "user", text: "All of it. New layout too if possible." },
    { role: "ai",   text: "Love it. Rough budget range in mind?" },
    { role: "user", text: "Somewhere between $30k–$50k." },
    { role: "ai",   text: "Perfect scope. Lining up 3 kitchen remodelers for you." },
    { role: "ai",   text: "No phone tag — they come to you with bids!" },
  ],
  // 4. Bathroom remodel
  [
    { role: "user", text: "Master bath is outdated. Need to know costs." },
    { role: "ai",   text: "Cosmetic refresh or full gut and rebuild?" },
    { role: "user", text: "Full gut — new tile, vanity, walk-in shower." },
    { role: "ai",   text: "Any timeline? Upcoming events or guests?" },
    { role: "user", text: "Want it done before the holidays." },
    { role: "ai",   text: "Totally doable. Finding contractors with open availability." },
    { role: "ai",   text: "Bath remodelers notified — bids incoming!" },
  ],
  // 5. Landscaping cleanup
  [
    { role: "user", text: "Backyard is completely overgrown. Need a full cleanup." },
    { role: "ai",   text: "Mostly weeds and shrubs, or are there trees too?" },
    { role: "user", text: "Shrubs, weeds, and a couple small dead trees." },
    { role: "ai",   text: "Ballpark lot size? Helps me match the right crew." },
    { role: "user", text: "About a quarter acre." },
    { role: "ai",   text: "I'll get local landscapers competing for your project." },
    { role: "ai",   text: "Multiple quotes — no cold calls needed on your end." },
  ],
  // 6. Interior painting
  [
    { role: "user", text: "Need the whole interior repainted. About 2,200 sq ft." },
    { role: "ai",   text: "All rooms, or skipping ceilings and trim?" },
    { role: "user", text: "Everything including trim. Walls need lots of prep." },
    { role: "ai",   text: "Colors picked out or still deciding?" },
    { role: "user", text: "Have the colors, just need someone reliable." },
    { role: "ai",   text: "I'll line up 3 painters who handle full prep and cleanup." },
    { role: "ai",   text: "Compare bids and choose the best fit — easy!" },
  ],
  // 7. Pool repair
  [
    { role: "user", text: "Pool pump died and I think there's a small leak." },
    { role: "ai",   text: "Water level dropping noticeably day to day?" },
    { role: "user", text: "About half an inch per day." },
    { role: "ai",   text: "Worth getting checked. In-ground or above-ground?" },
    { role: "user", text: "In-ground gunite. About 15 years old." },
    { role: "ai",   text: "I'll find pool pros for both pump and leak detection." },
    { role: "ai",   text: "Multiple bids incoming — no chasing required!" },
  ],
  // 8. Flooring installation
  [
    { role: "user", text: "Want to replace carpet with hardwood on the main floor." },
    { role: "ai",   text: "Rough square footage? Any stairs involved?" },
    { role: "user", text: "Around 1,400 sq ft. Open plan, no stairs." },
    { role: "ai",   text: "Solid hardwood, engineered, or open to both?" },
    { role: "user", text: "Open to both. Trying to stay under $15k." },
    { role: "ai",   text: "Very doable. Sending this to flooring pros near you." },
    { role: "ai",   text: "Compare bids side-by-side and pick your favorite!" },
  ],
  // 9. Water heater replacement
  [
    { role: "user", text: "Water heater is 18 years old and starting to rust." },
    { role: "ai",   text: "Smart move! Tank or open to going tankless?" },
    { role: "user", text: "Open to tankless if the cost makes sense." },
    { role: "ai",   text: "Current fuel source — gas or electric?" },
    { role: "user", text: "Natural gas." },
    { role: "ai",   text: "I'll get bids for both options so you can compare." },
    { role: "ai",   text: "Local plumbers notified — quotes coming your way!" },
  ],
  // 10. Electrical panel upgrade
  [
    { role: "user", text: "Breakers keep tripping. Panel might be too old." },
    { role: "ai",   text: "What amperage is your current panel, if you know?" },
    { role: "user", text: "100 amp. House was built in 1978." },
    { role: "ai",   text: "Likely time for 200A upgrade. Adding EV charger too?" },
    { role: "user", text: "Yes, exactly what I was thinking." },
    { role: "ai",   text: "Great combo. Finding licensed electricians near you." },
    { role: "ai",   text: "Verified pros notified — bids on the way!" },
  ],
];

// Pick a random scenario on each render cycle
function pickScenario(): ChatMsg[] {
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

// slight human variance helper
function jitter(base: number, range = 200) {
  return base + Math.floor(Math.random() * range) - range / 2;
}

// ── typing animation hook ──────────────────────────────────────────────────────
function useChat() {
  const [messages, setMessages] = useState<ChatMsg[]>(() => pickScenario());
  const [visible, setVisible] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function step(msgs: ChatMsg[]) {
      const i = indexRef.current;
      if (i >= msgs.length) {
        // loop: wait 3s then pick a new scenario and restart
        timerRef.current = setTimeout(() => {
          const next = pickScenario();
          setMessages(next);
          setVisible([]);
          indexRef.current = 0;
          timerRef.current = setTimeout(() => step(next), 600);
        }, 3000);
        return;
      }

      const msg = msgs[i];

      if (msg.role === "user") {
        timerRef.current = setTimeout(() => {
          setVisible((v) => [...v, msg]);
          indexRef.current++;
          timerRef.current = setTimeout(() => step(msgs), jitter(700, 300));
        }, i === 0 ? 800 : jitter(600, 300));
      } else {
        timerRef.current = setTimeout(() => {
          setTyping(true);
          const typingDuration = jitter(1100, 400);
          timerRef.current = setTimeout(() => {
            setTyping(false);
            setVisible((v) => [...v, msg]);
            indexRef.current++;
            timerRef.current = setTimeout(() => step(msgs), jitter(500, 200));
          }, typingDuration);
        }, jitter(500, 200));
      }
    }

    step(messages);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { visible, typing };
}

// ── iPhone frame ───────────────────────────────────────────────────────────────
function IPhoneMockup() {
  const { visible, typing } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // auto-scroll inside phone only
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible, typing]);

  return (
    // Outer container — fixed size, never resizes
    <div
      className="relative mx-auto"
      style={{ width: 270, height: 540, flexShrink: 0 }}
    >
      {/* iPhone shell */}
      <div
        className="absolute inset-0 rounded-[44px] bg-[#1a1a1a] shadow-2xl"
        style={{ boxShadow: "0 0 0 2px #3a3a3a, 0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)" }}
      />

      {/* Side buttons */}
      <div className="absolute -left-[3px] top-[110px] h-8 w-[3px] rounded-l-full bg-[#2e2e2e]" />
      <div className="absolute -left-[3px] top-[150px] h-12 w-[3px] rounded-l-full bg-[#2e2e2e]" />
      <div className="absolute -left-[3px] top-[210px] h-12 w-[3px] rounded-l-full bg-[#2e2e2e]" />
      <div className="absolute -right-[3px] top-[155px] h-16 w-[3px] rounded-r-full bg-[#2e2e2e]" />

      {/* Screen bezel */}
      <div className="absolute inset-[8px] overflow-hidden rounded-[38px] bg-white">

        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-[14px] -translate-x-1/2 z-10 h-[26px] w-[90px] rounded-full bg-[#1a1a1a]" />

        {/* Status bar */}
        <div className="absolute left-0 right-0 top-0 flex h-[52px] items-end justify-between px-5 pb-1.5 z-10 bg-white">
          <span className="text-[9px] font-semibold text-black">9:41</span>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-medium text-black">●●●●</span>
            <span className="text-[8px] font-medium text-black">WiFi</span>
            <span className="text-[8px] font-medium text-black">100%</span>
          </div>
        </div>

        {/* iMessage header */}
        <div className="absolute left-0 right-0 top-[52px] z-10 flex flex-col items-center bg-white pb-2 pt-1.5 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#29CC4A]">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <p className="mt-0.5 text-[10px] font-semibold text-black">HomeBids AI</p>
          <p className="text-[8px] text-[#8e8e93]">iMessage</p>
        </div>

        {/* Messages scroll area — only this scrolls */}
        <div
          ref={scrollRef}
          className="absolute bottom-[44px] left-0 right-0 top-[136px] overflow-y-auto px-3 py-2"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="space-y-1.5">
            {visible.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animation: "msgIn 0.22s ease-out" }}
              >
                <div
                  className={`max-w-[78%] rounded-[17px] px-3 py-1.5 text-[11px] leading-[1.4] ${
                    msg.role === "user"
                      ? "rounded-br-[4px] bg-[#29CC4A] text-white"
                      : "rounded-bl-[4px] bg-[#e9e9eb] text-black"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start" style={{ animation: "msgIn 0.18s ease-out" }}>
                <div className="flex items-center gap-[3px] rounded-[17px] rounded-bl-[4px] bg-[#e9e9eb] px-3 py-2">
                  <span className="h-[5px] w-[5px] rounded-full bg-[#8e8e93]" style={{ animation: "typingDot 1.2s ease-in-out infinite", animationDelay: "0ms" }} />
                  <span className="h-[5px] w-[5px] rounded-full bg-[#8e8e93]" style={{ animation: "typingDot 1.2s ease-in-out infinite", animationDelay: "200ms" }} />
                  <span className="h-[5px] w-[5px] rounded-full bg-[#8e8e93]" style={{ animation: "typingDot 1.2s ease-in-out infinite", animationDelay: "400ms" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 border-t border-[rgba(0,0,0,0.08)] bg-white px-3 py-2.5">
          <div className="flex flex-1 items-center rounded-full border border-[#c6c6c8] bg-white px-3 py-1">
            <span className="text-[10px] text-[#8e8e93]">iMessage</span>
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#29CC4A]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 8V2M2 5l3-3 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────
export default function NewJobPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [copied, setCopied] = useState(false);

  // auth guard
  useEffect(() => {
    if (!USE_MOCK_DATA) { setAuthReady(true); return; }
    const user = getMockUser();
    if (!user) { router.replace("/?signIn=true"); return; }
    if (user.role === "contractor") { router.replace("/contractors/dashboard"); return; }
    if (user.role === "admin") { router.replace("/admin"); return; }
    setAuthReady(true);
  }, [router]);

  const handleTextUs = useCallback(() => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = SMS_HREF;
    } else {
      navigator.clipboard.writeText(HOMEBIDS_PHONE).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, []);

  if (!authReady) return null;

  return (
    <>
      {/* CSS keyframes for message entry + typing dots */}
      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">

          {/* ── 2-col hero ─────────────────────────────────────────────────── */}
          <section className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">

            {/* LEFT — content */}
            <div className="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Most homeowners choose this
              </p>

              <h1 className="mt-3 text-balance text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                Start Your Project<br />in 30 Seconds
              </h1>

              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                Text us your project and our AI instantly finds the best contractors — you&apos;ll start receiving bids fast.
              </p>

              {/* Trust bullets */}
              <ul className="mt-6 space-y-2.5">
                {TRUST_BULLETS.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 shrink-0 text-foreground" />
                    {text}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <Button
                size="lg"
                className="relative mt-8 gap-2 text-base"
                onClick={handleTextUs}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Number copied — text us to begin
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    Text Us to Start
                  </>
                )}
              </Button>

              {copied && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Copy className="h-3 w-3" />
                  {HOMEBIDS_PHONE}
                </p>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                We&apos;ll reach out to 100+ qualified contractors so you don&apos;t have to.
              </p>
            </div>

            {/* RIGHT — fixed iPhone */}
            <div className="flex w-full shrink-0 items-center justify-center lg:w-auto">
              <IPhoneMockup />
            </div>
          </section>

          {/* ── Value grid ─────────────────────────────────────────────────── */}
          <section className="mt-16">
            <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Why homeowners choose HomeBids
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {VALUE_GRID.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Form fallback — hyperlink only ──────────────────────────────── */}
          <p className="mt-12 text-center text-xs text-muted-foreground">
            Prefer to fill out a form instead?{" "}
            <Link
              href="/?showForm=true"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Click here.
            </Link>
          </p>

        </main>
      </div>
    </>
  );
}
