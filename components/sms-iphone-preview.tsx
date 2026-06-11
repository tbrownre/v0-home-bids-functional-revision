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

// Signal: 4 vertical bars, iOS style (left-to-right short→tall, first 3 filled)
function IosSignal() {
  const bars = [
    { h: 5,  y: 9 },
    { h: 7,  y: 7 },
    { h: 9,  y: 5 },
    { h: 12, y: 2 },
  ];
  return (
    <svg width="17" height="14" viewBox="0 0 17 14" fill="none">
      {bars.map((b, i) => (
        <rect
          key={i}
          x={i * 4 + 0.5}
          y={b.y}
          width="3"
          height={b.h}
          rx="1"
          fill={i < 3 ? "#000" : "rgba(0,0,0,0.25)"}
        />
      ))}
    </svg>
  );
}

// WiFi: 3 arcs + dot, iOS style
function IosWifi() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
      {/* dot */}
      <circle cx="8" cy="11" r="1.3" fill="#000" />
      {/* inner arc */}
      <path d="M5.2 8.4a4 4 0 0 1 5.6 0" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
      {/* middle arc */}
      <path d="M2.8 5.9a7.4 7.4 0 0 1 10.4 0" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
      {/* outer arc */}
      <path d="M0.5 3.4A10.7 10.7 0 0 1 15.5 3.4" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Battery: iOS pill with nub, ~75% charged
function IosBattery() {
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
      {/* outer case */}
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      {/* inner fill ~75% */}
      <rect x="2" y="2" width="16" height="9" rx="2" fill="#000" />
      {/* nub */}
      <path d="M24.5 4.5v4a2 2 0 0 0 0-4z" fill="rgba(0,0,0,0.4)" />
    </svg>
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
      <div className="relative" style={{ width: 300 }}>

        {/* ── iPhone shell ────────────────────────────────────────────── */}
        <div
          className="relative flex flex-col overflow-hidden bg-white"
          style={{
            height: 580,
            borderRadius: 48,
            border: "10px solid #1C1C1E",
            boxShadow: [
              "0 0 0 1px #3A3A3C",
              "0 28px 60px -8px rgba(0,0,0,0.55)",
              "inset 0 0 0 1px rgba(255,255,255,0.06)",
            ].join(", "),
          }}
        >

          {/* ── Dynamic Island ────────────────────────────────────────── */}
          <div className="relative flex shrink-0 items-center justify-center bg-white pt-[11px] pb-[2px]">
            {/* Pill */}
            <div
              className="relative flex items-center justify-end"
              style={{
                width: 120,
                height: 34,
                borderRadius: 20,
                background: "#000",
              }}
            >
              {/* Front camera lens */}
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
          <div className="flex shrink-0 items-center justify-between bg-white px-[18px] pb-[2px] pt-[1px]">
            {/* Time — left, bold */}
            <span
              className="tabular-nums"
              style={{ fontSize: 15, fontWeight: 600, color: "#000", letterSpacing: "-0.3px", lineHeight: 1 }}
            >
              9:41
            </span>
            {/* Right icons */}
            <div className="flex items-center gap-[6px]">
              <IosSignal />
              <IosWifi />
              <IosBattery />
            </div>
          </div>

          {/* ── iMessage header ───────────────────────────────────────── */}
          <div
            className="relative flex shrink-0 items-center bg-white px-[8px] pb-[8px] pt-[4px]"
            style={{ borderBottom: "0.5px solid rgba(0,0,0,0.15)" }}
          >
            {/* Back button: chevron + "Messages" */}
            <button
              className="flex items-center gap-[2px] pl-[2px]"
              style={{ minWidth: 60 }}
              tabIndex={-1}
            >
              {/* iOS chevron — thin, rounded */}
              <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
                <path
                  d="M7.5 1 1.5 8l6 7"
                  stroke="#007AFF"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span style={{ fontSize: 15, color: "#007AFF", fontWeight: 400 }}>
                Messages
              </span>
            </button>

            {/* Center: avatar + name (absolutely centered in the header row) */}
            <div className="absolute inset-x-0 flex flex-col items-center">
              {/* Avatar circle */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0A84FF 0%, #34aaff 100%)",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>HB</span>
              </div>
              {/* Name row */}
              <div className="flex items-center gap-[2px] mt-[2px]">
                <span style={{ fontSize: 12, fontWeight: 600, color: "#000", lineHeight: 1 }}>
                  HomeBids AI
                </span>
                {/* Chevron after name */}
                <svg width="6" height="9" viewBox="0 0 6 9" fill="none">
                  <path d="M1 1l4 3.5L1 8" stroke="#8E8E93" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* iMessage / typing subtitle */}
              <span style={{ fontSize: 11, color: "#8E8E93", lineHeight: 1, marginTop: 1 }}>
                {typing ? "typing\u2026" : "iMessage"}
              </span>
            </div>

            {/* Video icon — right */}
            <div className="ml-auto">
              {/* iOS FaceTime video icon: filled rounded rect + play triangle */}
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
                <rect x="1" y="3" width="17" height="14" rx="3.5" fill="#007AFF" />
                <path d="M18 7.5 26 3.5v13L18 12.5V7.5z" fill="#007AFF" />
              </svg>
            </div>
          </div>

          {/* ── Messages ──────────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col overflow-y-auto bg-white"
            style={{
              padding: "12px 10px 6px",
              gap: 0,
              scrollbarWidth: "none",
              // Prevent text from centering — align-items default is stretch
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
            className="flex shrink-0 items-center bg-white"
            style={{
              borderTop: "0.5px solid rgba(0,0,0,0.15)",
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

            {/* Send arrow */}
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#007AFF",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 12V2M3 6l4-4 4 4"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* ── Home indicator ────────────────────────────────────────── */}
          <div
            className="flex shrink-0 justify-center bg-white"
            style={{ paddingTop: 5, paddingBottom: 8 }}
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
