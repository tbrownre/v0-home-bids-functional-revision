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

const CHAT_MESSAGES: ChatMsg[] = [
  { role: "user", text: "I need help replacing my AC unit" },
  { role: "ai",   text: "Got it — what's your zip code?" },
  { role: "user", text: "90210" },
  { role: "ai",   text: "Analyzing your area…" },
  { role: "ai",   text: "Do you have a preferred budget?" },
  { role: "user", text: "Flexible, but under $5,000 ideally" },
  { role: "ai",   text: "Finding top contractors near you…" },
  { role: "ai",   text: "We're notifying 12 qualified contractors now." },
];

// slight human variance helper
function jitter(base: number, range = 200) {
  return base + Math.floor(Math.random() * range) - range / 2;
}

// ── typing animation hook ──────────────────────────────────────────────────────
function useChat(messages: ChatMsg[]) {
  const [visible, setVisible] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function step() {
      const i = indexRef.current;
      if (i >= messages.length) {
        // loop: wait 3 s then restart
        timerRef.current = setTimeout(() => {
          setVisible([]);
          indexRef.current = 0;
          timerRef.current = setTimeout(step, 600);
        }, 3000);
        return;
      }

      const msg = messages[i];

      if (msg.role === "user") {
        // user messages appear immediately (no typing indicator)
        timerRef.current = setTimeout(() => {
          setVisible((v) => [...v, msg]);
          indexRef.current++;
          timerRef.current = setTimeout(step, jitter(700, 300));
        }, i === 0 ? 800 : jitter(600, 300));
      } else {
        // AI: show typing indicator first
        timerRef.current = setTimeout(() => {
          setTyping(true);
          const typingDuration = jitter(1100, 400);
          timerRef.current = setTimeout(() => {
            setTyping(false);
            setVisible((v) => [...v, msg]);
            indexRef.current++;
            timerRef.current = setTimeout(step, jitter(500, 200));
          }, typingDuration);
        }, jitter(500, 200));
      }
    }

    step();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { visible, typing };
}

// ── iPhone frame ───────────────────────────────────────────────────────────────
function IPhoneMockup() {
  const { visible, typing } = useChat(CHAT_MESSAGES);
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
