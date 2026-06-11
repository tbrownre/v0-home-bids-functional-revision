"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  sender: "user" | "ai";
  text: string;
  delay: number;
}

const SCENARIOS: Message[][] = [
  // 1. HVAC Repair
  [
    { sender: "user", text: "Hey HomeBids, I need help with my AC not cooling properly.", delay: 600 },
    { sender: "ai",   text: "Happy to help. Is the system still turning on, or is it completely unresponsive?", delay: 900 },
    { sender: "user", text: "It turns on, but the house never really cools down.", delay: 700 },
    { sender: "ai",   text: "Got it. About how old is the unit, and when did you first notice the issue?", delay: 850 },
    { sender: "user", text: "It's about 11 years old. Started last week.", delay: 700 },
    { sender: "ai",   text: "That helps. Are you in a house, condo, or townhome?", delay: 900 },
    { sender: "user", text: "Single family home, about 2,400 sq ft.", delay: 650 },
    { sender: "ai",   text: "I have everything I need to find the right pros for this.", delay: 800 },
  ],
  // 2. Kitchen Remodel
  [
    { sender: "user", text: "Hey HomeBids, I need help remodeling my kitchen.", delay: 600 },
    { sender: "ai",   text: "Great project. Are you looking at a full remodel or updating specific things like cabinets and counters?", delay: 900 },
    { sender: "user", text: "Full remodel — cabinets, counters, island, and new appliances.", delay: 700 },
    { sender: "ai",   text: "Do you have a budget range in mind, even a rough one?", delay: 850 },
    { sender: "user", text: "Somewhere between $40k and $60k.", delay: 650 },
    { sender: "ai",   text: "That's a solid range. What's your timeline looking like?", delay: 900 },
    { sender: "user", text: "Hoping to start within the next 4–6 weeks.", delay: 700 },
    { sender: "ai",   text: "Perfect. I have what I need to connect you with the right contractors.", delay: 800 },
  ],
  // 3. Roof Leak
  [
    { sender: "user", text: "Hey HomeBids, I need help with a roof leak after the last storm.", delay: 600 },
    { sender: "ai",   text: "Let's get that sorted. Is water actively coming in, or are you seeing staining on the ceiling?", delay: 900 },
    { sender: "user", text: "There's a stain on the ceiling in the master bedroom.", delay: 700 },
    { sender: "ai",   text: "Do you have any idea how old the roof is?", delay: 850 },
    { sender: "user", text: "Around 14 years. We bought the house 3 years ago.", delay: 700 },
    { sender: "ai",   text: "Has anyone been up to look at it yet, or is this the first step?", delay: 900 },
    { sender: "user", text: "First step. Haven't touched it yet.", delay: 600 },
    { sender: "ai",   text: "I have enough to find qualified roofers who can inspect and provide estimates.", delay: 800 },
  ],
  // 4. Bathroom Remodel
  [
    { sender: "user", text: "Hey HomeBids, I need help updating my bathroom.", delay: 600 },
    { sender: "ai",   text: "Is this the primary bathroom, a guest bath, or both?", delay: 900 },
    { sender: "user", text: "The master bathroom. It's pretty outdated.", delay: 650 },
    { sender: "ai",   text: "What are you hoping to change — tile, vanity, shower, or the whole layout?", delay: 900 },
    { sender: "user", text: "Everything. New tile, walk-in shower, double vanity.", delay: 700 },
    { sender: "ai",   text: "Got it. Any flexibility on timing?", delay: 850 },
    { sender: "user", text: "Ideally done within the next couple months.", delay: 650 },
    { sender: "ai",   text: "I have what I need to put your project in front of the right contractors.", delay: 800 },
  ],
  // 5. Landscaping
  [
    { sender: "user", text: "Hey HomeBids, I need help redesigning my backyard landscaping.", delay: 600 },
    { sender: "ai",   text: "What's the current state of the backyard?", delay: 900 },
    { sender: "user", text: "Pretty bare. Just grass and an old concrete patio.", delay: 700 },
    { sender: "ai",   text: "Are you thinking plants and garden beds, hardscaping, or a full redesign?", delay: 900 },
    { sender: "user", text: "Full redesign — plants, a new patio, maybe some lighting.", delay: 700 },
    { sender: "ai",   text: "What's the approximate size of the backyard?", delay: 850 },
    { sender: "user", text: "Maybe 50 by 60 feet.", delay: 600 },
    { sender: "ai",   text: "I have what I need to connect you with landscape designers nearby.", delay: 800 },
  ],
];

const TYPING_DURATION = 1300;
const RESTART_DELAY  = 4500;

function pickScenario(): Message[] {
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

// Groups consecutive messages from the same sender
function groupMessages(messages: Message[]): Array<{ sender: "user" | "ai"; items: { msg: Message; idx: number }[] }> {
  const groups: Array<{ sender: "user" | "ai"; items: { msg: Message; idx: number }[] }> = [];
  messages.forEach((msg, idx) => {
    const last = groups[groups.length - 1];
    if (last && last.sender === msg.sender) {
      last.items.push({ msg, idx });
    } else {
      groups.push({ sender: msg.sender, items: [{ msg, idx }] });
    }
  });
  return groups;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-[3px] px-0.5 py-[2px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: "#8E8E93" }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// Signal strength bars — 4 bars like iOS
function SignalBars() {
  return (
    <div className="flex items-end gap-[2px]">
      {[3, 5, 7, 9].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-[1px]"
          style={{ height: h, background: i < 3 ? "#000" : "rgba(0,0,0,0.3)" }}
        />
      ))}
    </div>
  );
}

export function SmsIphonePreview() {
  const [conversation, setConversation] = useState<Message[]>(() => pickScenario());
  const [visible, setVisible] = useState<number[]>([]);
  const [typing, setTyping]   = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible, typing]);

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };
  const schedule = (fn: () => void, ms: number) => { clear(); timerRef.current = setTimeout(fn, ms); };

  const runStep = (conv: Message[], idx: number) => {
    if (idx >= conv.length) {
      schedule(() => {
        setVisible([]);
        setTyping(false);
        const next = pickScenario();
        setConversation(next);
        schedule(() => runStep(next, 0), 500);
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

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-[272px] sm:w-[300px]">

        {/* ── iPhone shell ─────────────────────────────────────────────── */}
        <div
          className="relative flex flex-col overflow-hidden bg-white"
          style={{
            height: 560,
            borderRadius: "44px",
            border: "9px solid #1C1C1E",
            boxShadow:
              "0 0 0 1px #3A3A3C, 0 32px 64px -8px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          {/* ── Dynamic Island ─────────────────────────────────────────── */}
          <div className="relative flex shrink-0 justify-center pt-[10px] pb-[4px] bg-white">
            <div
              className="flex h-[30px] w-[118px] items-center justify-end rounded-full pr-[9px]"
              style={{ background: "#1C1C1E" }}
            >
              {/* Front camera */}
              <div
                className="h-[9px] w-[9px] rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 35%, #2a2a2e, #0d0d0f)",
                  boxShadow: "0 0 0 1.5px #3a3a3c, inset 0 0 3px rgba(255,255,255,0.08)",
                }}
              />
            </div>
          </div>

          {/* ── Status bar ─────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between bg-white px-5 pb-[3px]">
            {/* Time */}
            <span className="text-[13px] font-semibold leading-none tracking-tight" style={{ color: "#000" }}>
              9:41
            </span>
            {/* Right icons */}
            <div className="flex items-center gap-[6px]">
              <SignalBars />
              {/* WiFi */}
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M8 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z" fill="#000"/>
                <path d="M4.3 6.7a5.2 5.2 0 0 1 7.4 0" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                <path d="M1.5 3.9a9.1 9.1 0 0 1 13 0" stroke="#000" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-[1px]">
                <div
                  className="flex h-[11px] w-[22px] items-center rounded-[2.5px] p-[2px]"
                  style={{ border: "1px solid rgba(0,0,0,0.35)" }}
                >
                  <div className="h-full w-[15px] rounded-[1.5px]" style={{ background: "#000" }} />
                </div>
                <div
                  className="h-[4px] w-[1.5px] rounded-r-[1px]"
                  style={{ background: "rgba(0,0,0,0.4)" }}
                />
              </div>
            </div>
          </div>

          {/* ── iMessage chat header ────────────────────────────────────── */}
          <div
            className="flex shrink-0 flex-col items-center pb-2 pt-0 bg-white"
            style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}
          >
            {/* Row: back < | centered avatar+name | video icon */}
            <div className="flex w-full items-start px-2 pt-0.5">
              {/* Back button */}
              <button className="flex items-center gap-[2px] pt-1 pl-1">
                <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                  <path d="M8.5 1.5 2 8l6.5 6.5" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[15px] font-normal" style={{ color: "#007AFF" }}>6</span>
              </button>

              {/* Center: avatar + name + subtitle */}
              <div className="flex flex-1 flex-col items-center">
                {/* Avatar */}
                <div
                  className="flex h-[48px] w-[48px] items-center justify-center rounded-full"
                  style={{ background: "linear-gradient(135deg, #0A84FF, #34aaff)" }}
                >
                  <span className="text-[15px] font-bold text-white">HB</span>
                </div>
                {/* Name row with chevron */}
                <div className="mt-[2px] flex items-center gap-[3px]">
                  <span className="text-[13px] font-semibold" style={{ color: "#000" }}>HomeBids AI</span>
                  <svg width="7" height="11" viewBox="0 0 7 11" fill="none">
                    <path d="M1.5 1 6 5.5 1.5 10" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Subtitle */}
                <span className="text-[11px] leading-none" style={{ color: "#8E8E93" }}>
                  {typing ? "typing…" : "iMessage"}
                </span>
              </div>

              {/* FaceTime video icon */}
              <button className="pt-1 pr-1">
                <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                  <rect x="1" y="2" width="15" height="14" rx="3" fill="#007AFF"/>
                  <path d="M16 6.5l6-4v13l-6-4V6.5z" fill="#007AFF"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Message list ────────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-[10px] pt-3 pb-1"
            style={{ scrollbarWidth: "none", gap: 0 }}
          >
            {/* Timestamp */}
            <div className="mb-3 flex justify-center">
              <span className="text-[11px] font-medium" style={{ color: "#8E8E93" }}>
                Today 9:41 AM
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              {groups.map((group, gi) => {
                const isUser = group.sender === "user";
                return (
                  <motion.div
                    key={`group-${gi}-${group.items[0]?.idx}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-[10px]`}
                  >
                    {group.items.map(({ msg, idx }, bi) => {
                      const isFirst  = bi === 0;
                      const isLast   = bi === group.items.length - 1;

                      // Real iMessage radius rules:
                      // All corners 18px except the "tail" corner:
                      // - Sent (right): last bubble → bottom-right = 4px
                      // - Received (left): last bubble → bottom-left = 4px
                      // Non-last bubbles in a group: all 18px but reduce top-left (received) or top-right (sent) slightly for consecutive
                      const br = isUser
                        ? `18px 18px ${isLast ? "4px" : "18px"} 18px`
                        : `18px 18px 18px ${isLast ? "4px" : "18px"}`;

                      return (
                        <motion.div
                          key={`msg-${idx}`}
                          layout
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className={`mb-[2px] max-w-[78%] break-words px-[12px] py-[7px] text-[14px] leading-[1.35] ${
                            isUser
                              ? "bg-[#007AFF] text-white"
                              : "text-black"
                          }`}
                          style={{
                            borderRadius: br,
                            background: isUser ? "#007AFF" : "#E9E9EB",
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
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  className="mb-[10px] flex items-start"
                >
                  <div
                    className="px-[12px] py-[9px]"
                    style={{ borderRadius: "18px 18px 18px 4px", background: "#E9E9EB" }}
                  >
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Input bar ───────────────────────────────────────────────── */}
          <div
            className="flex shrink-0 items-center gap-[8px] bg-white px-[10px] py-[8px]"
            style={{ borderTop: "0.5px solid rgba(0,0,0,0.12)" }}
          >
            {/* Apps icon */}
            <div
              className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full"
              style={{ background: "#E9E9EB" }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v11M1 6.5h11" stroke="#8E8E93" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Input pill */}
            <div
              className="flex flex-1 items-center rounded-full px-[12px] py-[6px]"
              style={{
                border: "1px solid #C7C7CC",
                minHeight: "32px",
              }}
            >
              <span className="text-[13px]" style={{ color: "#8E8E93" }}>iMessage</span>
            </div>

            {/* Send button */}
            <div
              className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full"
              style={{ background: "#007AFF" }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 11V2M2 6.5l4.5-4.5 4.5 4.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* ── Home indicator ──────────────────────────────────────────── */}
          <div className="flex shrink-0 justify-center bg-white pb-[8px] pt-[4px]">
            <div
              className="h-[5px] w-[120px] rounded-full"
              style={{ background: "rgba(0,0,0,0.18)" }}
            />
          </div>
        </div>

        {/* ── Physical side buttons ─────────────────────────────────────── */}
        {/* Silent switch */}
        <div
          className="absolute rounded-l-full"
          style={{ left: -5, top: 88, width: 4, height: 28, background: "#1C1C1E" }}
        />
        {/* Volume up */}
        <div
          className="absolute rounded-l-full"
          style={{ left: -5, top: 132, width: 4, height: 52, background: "#1C1C1E" }}
        />
        {/* Volume down */}
        <div
          className="absolute rounded-l-full"
          style={{ left: -5, top: 196, width: 4, height: 52, background: "#1C1C1E" }}
        />
        {/* Power */}
        <div
          className="absolute rounded-r-full"
          style={{ right: -5, top: 152, width: 4, height: 72, background: "#1C1C1E" }}
        />
      </div>
    </div>
  );
}
