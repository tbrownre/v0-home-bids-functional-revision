"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Types & data
// ─────────────────────────────────────────────────────────────────────────────
interface Message {
  sender: "user" | "ai";
  text: string;
  delay: number;
}

const SCENARIOS: Message[][] = [
  [
    { sender: "user", text: "Hey HomeBids, I need help with my AC not cooling.", delay: 600 },
    { sender: "ai",   text: "Happy to help. Is the system still turning on, or completely unresponsive?", delay: 900 },
    { sender: "user", text: "It turns on, but the house never cools down.", delay: 700 },
    { sender: "ai",   text: "Got it. How old is the unit, and when did the issue start?", delay: 850 },
    { sender: "user", text: "About 11 years old. Started last week.", delay: 700 },
    { sender: "ai",   text: "Single family home or condo?", delay: 900 },
    { sender: "user", text: "Single family, about 2,400 sq ft.", delay: 650 },
    { sender: "ai",   text: "I have everything I need to find the right pros.", delay: 800 },
  ],
  [
    { sender: "user", text: "Hey HomeBids, I need help remodeling my kitchen.", delay: 600 },
    { sender: "ai",   text: "Full remodel or updating specific things like cabinets?", delay: 900 },
    { sender: "user", text: "Full remodel — cabinets, counters, island, appliances.", delay: 700 },
    { sender: "ai",   text: "Do you have a budget range in mind?", delay: 850 },
    { sender: "user", text: "Between $40k and $60k.", delay: 650 },
    { sender: "ai",   text: "Solid range. What's your timeline?", delay: 900 },
    { sender: "user", text: "Hoping to start in 4–6 weeks.", delay: 700 },
    { sender: "ai",   text: "I have what I need to connect you with the right contractors.", delay: 800 },
  ],
  [
    { sender: "user", text: "Hey HomeBids, I need help with a roof leak after the storm.", delay: 600 },
    { sender: "ai",   text: "Is water actively coming in or just ceiling staining?", delay: 900 },
    { sender: "user", text: "There's a stain on the ceiling in the master bedroom.", delay: 700 },
    { sender: "ai",   text: "Do you know how old the roof is?", delay: 850 },
    { sender: "user", text: "Around 14 years. We bought 3 years ago.", delay: 700 },
    { sender: "ai",   text: "Has anyone been up to look at it yet?", delay: 900 },
    { sender: "user", text: "No, this is the first step.", delay: 600 },
    { sender: "ai",   text: "I have enough to find qualified roofers for estimates.", delay: 800 },
  ],
];

const TYPING_DURATION = 1300;
const RESTART_DELAY = 4000;

function pickScenario(): Message[] {
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

function groupMessages(msgs: Message[]): Array<{ sender: "user" | "ai"; items: { msg: Message; idx: number }[] }> {
  const groups: Array<{ sender: "user" | "ai"; items: { msg: Message; idx: number }[] }> = [];
  msgs.forEach((msg, idx) => {
    const last = groups[groups.length - 1];
    if (last && last.sender === msg.sender) last.items.push({ msg, idx });
    else groups.push({ sender: msg.sender, items: [{ msg, idx }] });
  });
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// iOS-accurate SVG status bar icons
// ─────────────────────────────────────────────────────────────────────────────

// Signal: 4 vertical bars iOS style
function IosSignal() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
      <rect x="0"  y="8"  width="3" height="4"  rx="0.8" fill="#000" />
      <rect x="5"  y="5"  width="3" height="7"  rx="0.8" fill="#000" />
      <rect x="10" y="2"  width="3" height="10" rx="0.8" fill="#000" />
      <rect x="15" y="0"  width="3" height="12" rx="0.8" fill="rgba(0,0,0,0.22)" />
    </svg>
  );
}

// 5G badge — matches iOS status bar "5G" label
function Ios5G() {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: "#000", letterSpacing: "-0.2px" }}>
      5G
    </span>
  );
}

// Battery: iOS pill — green fill with percentage label like reference (94%)
function IosBattery() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: "#000", letterSpacing: "-0.1px" }}>94%</span>
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        {/* Outer case */}
        <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
        {/* Green fill ~94% */}
        <rect x="2" y="2" width="17.5" height="9" rx="2" fill="#30D158" />
        {/* Nub */}
        <path d="M23.5 4.5v4a2 2 0 0 0 0-4z" fill="rgba(0,0,0,0.4)" />
      </svg>
    </div>
  );
}

// Typing dots
function TypingDots() {
  return (
    <div className="flex items-center gap-[3px] px-1 py-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: "#8E8E93" }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function SmsIphonePreview() {
  const [conversation, setConversation] = useState<Message[]>(() => pickScenario());
  const [visible, setVisible] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible, typing]);

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };
  const schedule = (fn: () => void, ms: number) => {
    clear();
    timerRef.current = setTimeout(fn, ms);
  };

  const runStep = (conv: Message[], idx: number) => {
    if (idx >= conv.length) {
      schedule(() => {
        setVisible([]);
        setTyping(false);
        const next = pickScenario();
        setConversation(next);
        schedule(() => runStep(next, 0), 400);
      }, RESTART_DELAY);
      return;
    }
    const msg = conv[idx];
    if (msg.sender === "ai") {
      schedule(() => {
        setTyping(true);
        schedule(() => {
          setTyping(false);
          setVisible((v) => [...v, idx]);
          schedule(() => runStep(conv, idx + 1), msg.delay);
        }, TYPING_DURATION);
      }, msg.delay);
    } else {
      schedule(() => {
        setVisible((v) => [...v, idx]);
        schedule(() => runStep(conv, idx + 1), msg.delay);
      }, msg.delay);
    }
  };

  useEffect(() => {
    schedule(() => runStep(conversation, 0), 600);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleMessages = conversation.filter((_, i) => visible.includes(i));
  const groups = groupMessages(visibleMessages);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-start justify-center">
      {/* Outer wrapper — fixed size, never clips */}
      <div className="relative" style={{ width: 300 }}>

        {/* ── iPhone shell ────────────────────────────────────────────── */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            height: 620,
            borderRadius: 50,
            border: "10px solid #1C1C1E",
            background: "#F2F2F7",
            boxShadow: [
              "0 0 0 1px #3A3A3C",
              "0 32px 64px -8px rgba(0,0,0,0.50)",
              "inset 0 0 0 1px rgba(255,255,255,0.06)",
            ].join(", "),
          }}
        >

          {/* ── Dynamic Island ────────────────────────────────────────── */}
          <div className="relative flex shrink-0 items-center justify-center bg-[#F2F2F7] pt-[11px] pb-[2px]">
            <div
              style={{
                width: 120,
                height: 34,
                borderRadius: 20,
                background: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 38% 38%, #1e2428, #080a0c)",
                  boxShadow: "0 0 0 1.5px #2a2a2a, inset 0 0 4px rgba(100,160,255,0.12)",
                  marginRight: 10,
                }}
              />
            </div>
          </div>

          {/* ── Status bar ────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between bg-[#F2F2F7] px-[18px] pb-[2px] pt-[1px]">
            <div className="flex items-center gap-[5px]">
              <span
                className="tabular-nums"
                style={{ fontSize: 15, fontWeight: 600, color: "#000", letterSpacing: "-0.3px", lineHeight: 1 }}
              >
                9:41
              </span>
              <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
                <circle cx="5.5" cy="4" r="2.8" fill="#000" />
                <path d="M0.5 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#000" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div className="flex items-center gap-[5px]">
              <IosSignal />
              <Ios5G />
              <IosBattery />
            </div>
          </div>

          {/* ── iMessage header ───────────────────────────────────────── */}
          <div
            className="relative flex shrink-0 items-center bg-[#F2F2F7] px-[10px] pb-[10px] pt-[4px]"
            style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
          >
            {/* Back button: white rounded pill with chevron + badge — matches reference */}
            <button
              style={{ minWidth: 60, flexShrink: 0 }}
              tabIndex={-1}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#fff",
                  borderRadius: 22,
                  padding: "5px 10px 5px 8px",
                  height: 32,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
                }}
              >
                <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
                  <path d="M7 1 1 6.5 7 12" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#1C1C1E",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1 }}>1</span>
                </div>
              </div>
            </button>

            {/* Center: avatar + name */}
            <div className="absolute inset-x-0 flex flex-col items-center pointer-events-none">
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "linear-gradient(145deg, #6E54C8 0%, #4A90D9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>HB</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#000", lineHeight: 1 }}>
                  HomeBids AI
                </span>
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1.5l4 3.5-4 3.5" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

            </div>

            {/* Video icon — white rounded rect outline + camera shape, matches reference */}
            <div className="ml-auto" style={{ flexShrink: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                  <rect x="0.75" y="1.75" width="12" height="10.5" rx="2.5" stroke="#000" strokeWidth="1.5" />
                  <path d="M13 5.2 19 2v10l-6-3.2V5.2z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── Messages ──────────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col overflow-y-auto"
            style={{
              background: "#F2F2F7",
              padding: "12px 10px 6px",
              gap: 0,
              scrollbarWidth: "none",
              alignItems: "stretch",
            }}
          >
            {/* Timestamp */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: "#8E8E93", fontWeight: 500 }}>
                Today 9:41 AM
              </span>
            </div>

            <AnimatePresence>
              {groups.map((group, gi) => {
                const isUser = group.sender === "user";
                return (
                  <motion.div
                    key={`g${gi}-${group.items[0]?.idx}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 480, damping: 32 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      // Sent messages align RIGHT, received LEFT — no centering
                      alignItems: isUser ? "flex-end" : "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    {group.items.map(({ msg, idx }, bi) => {
                      const isLast = bi === group.items.length - 1;

                      // iOS iMessage tail rules:
                      // Sent (right): last bubble bottom-right corner = 4px, rest = 18px
                      // Received (left): last bubble bottom-left corner = 4px, rest = 18px
                      const R = 18;
                      const tail = 4;
                      const borderRadius = isUser
                        ? `${R}px ${R}px ${isLast ? tail : R}px ${R}px`
                        : `${R}px ${R}px ${R}px ${isLast ? tail : R}px`;

                      return (
                        <motion.div
                          key={`m${idx}`}
                          initial={{ opacity: 0, scale: 0.88 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 480, damping: 30 }}
                          style={{
                            // CRITICAL: text-align left always, even for sent bubbles
                            textAlign: "left",
                            maxWidth: "78%",
                            marginBottom: 2,
                            padding: "7px 12px",
                            borderRadius,
                            background: isUser ? "#007AFF" : "#E9E9EB",
                            color: isUser ? "#fff" : "#000",
                            fontSize: 14,
                            lineHeight: 1.38,
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.text}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {typing && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      borderRadius: "18px 18px 18px 4px",
                      background: "#E9E9EB",
                      padding: "8px 10px",
                    }}
                  >
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Input bar ─────────────────────────────────────────────── */}
          <div
            className="flex shrink-0 items-center"
            style={{
              background: "#F2F2F7",
              borderTop: "0.5px solid rgba(0,0,0,0.12)",
              padding: "7px 10px 8px",
              gap: 8,
            }}
          >
            {/* Apps button — iOS uses a "+" icon in a circle */}
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#E9E9EB",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="#8E8E93" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>

            {/* Input pill */}
            <div
              className="flex flex-1 items-center"
              style={{
                border: "1px solid #C7C7CC",
                borderRadius: 20,
                minHeight: 34,
                padding: "5px 12px",
              }}
            >
              <span style={{ fontSize: 14, color: "#8E8E93" }}>iMessage</span>
            </div>

            {/* Mic icon — shown when input is empty, matches reference */}
            <div
              className="flex shrink-0 items-center justify-center"
              style={{ width: 30, height: 30 }}
            >
              <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
                {/* Mic body */}
                <rect x="4" y="0.5" width="8" height="13" rx="4" stroke="#8E8E93" strokeWidth="1.5" />
                {/* Arc */}
                <path d="M1 10.5a7 7 0 0 0 14 0" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
                {/* Stem */}
                <line x1="8" y1="17.5" x2="8" y2="21" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* ── Home indicator ────────────────────────────────────────── */}
          <div
            className="flex shrink-0 justify-center"
            style={{ background: "#F2F2F7", paddingTop: 5, paddingBottom: 8 }}
          >
            <div
              style={{
                width: 130,
                height: 5,
                borderRadius: 3,
                background: "rgba(0,0,0,0.18)",
              }}
            />
          </div>
        </div>

        {/* ── Physical buttons ─────────────────────────────────────────── */}
        {/* Silent switch */}
        <div style={{ position: "absolute", left: -4, top: 90, width: 3, height: 26, background: "#1C1C1E", borderRadius: "2px 0 0 2px" }} />
        {/* Volume up */}
        <div style={{ position: "absolute", left: -4, top: 134, width: 3, height: 50, background: "#1C1C1E", borderRadius: "2px 0 0 2px" }} />
        {/* Volume down */}
        <div style={{ position: "absolute", left: -4, top: 196, width: 3, height: 50, background: "#1C1C1E", borderRadius: "2px 0 0 2px" }} />
        {/* Power */}
        <div style={{ position: "absolute", right: -4, top: 155, width: 3, height: 70, background: "#1C1C1E", borderRadius: "0 2px 2px 0" }} />
      </div>
    </div>
  );
}
