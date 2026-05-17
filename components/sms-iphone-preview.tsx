"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  sender: "user" | "ai";
  text: string;
  delay: number;
}

const CONVERSATION: Message[] = [
  { sender: "user", text: "I need help with AC repair", delay: 400 },
  { sender: "ai",   text: "Got it. Is your AC not cooling or making noise?", delay: 600 },
  { sender: "user", text: "Not cooling", delay: 900 },
  { sender: "ai",   text: "Thanks — what's your zip code so I can find local contractors?", delay: 700 },
  { sender: "user", text: "85254", delay: 800 },
  { sender: "ai",   text: "On it. Finding the best contractors near you...", delay: 650 },
  { sender: "ai",   text: "3 bids incoming. You'll hear back shortly!", delay: 500 },
];

const TYPING_DURATION = 1100;
const RESTART_DELAY  = 4200;

function TypingDots() {
  return (
    <div className="flex items-center gap-[3px] px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-[5px] w-[5px] rounded-full bg-muted-foreground/60"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

export function SmsIphonePreview() {
  const [visible, setVisible] = useState<number[]>([]);
  const [typing, setTyping]   = useState(false);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible, typing]);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const schedule = (fn: () => void, ms: number) => {
    clear();
    timerRef.current = setTimeout(fn, ms);
  };

  const runStep = (idx: number) => {
    if (idx >= CONVERSATION.length) {
      schedule(() => {
        setVisible([]);
        setTyping(false);
        schedule(() => runStep(0), 500);
      }, RESTART_DELAY);
      return;
    }

    const msg = CONVERSATION[idx];

    if (msg.sender === "ai") {
      schedule(() => {
        setTyping(true);
        schedule(() => {
          setTyping(false);
          setVisible((v) => [...v, idx]);
          schedule(() => runStep(idx + 1), msg.delay);
        }, TYPING_DURATION);
      }, msg.delay);
    } else {
      schedule(() => {
        setVisible((v) => [...v, idx]);
        schedule(() => runStep(idx + 1), msg.delay);
      }, msg.delay);
    }
  };

  useEffect(() => {
    schedule(() => runStep(0), 600);
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center">
      {/* Outer glow / shadow ring */}
      <div className="relative w-[272px] sm:w-[300px]">
        {/* iPhone shell — fixed height, flex column so sections stack cleanly */}
        <div
          className="flex flex-col overflow-hidden rounded-[3rem] bg-white"
          style={{
            height: 560,
            border: "6px solid #1a1a1a",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 30px 60px -12px rgba(0,0,0,0.45), 0 0 0 0.5px #3a3a3a inset",
          }}
        >
          {/* ── Dynamic Island ── */}
          <div className="flex shrink-0 justify-center bg-white pt-3 pb-1">
            <div
              className="flex h-[28px] w-[110px] items-center justify-center rounded-full"
              style={{ background: "#111" }}
            >
              {/* Front camera dot */}
              <div className="h-[9px] w-[9px] rounded-full bg-[#1a1a1a] ring-1 ring-[#333]" />
            </div>
          </div>

          {/* ── Status bar ── */}
          <div className="flex shrink-0 items-center justify-between bg-white px-6 pb-1">
            <span className="text-[12px] font-semibold text-black/85">9:41</span>
            <div className="flex items-center gap-[5px]">
              {/* Signal */}
              <div className="flex items-end gap-[2px]">
                {[3, 5, 7, 9].map((h, i) => (
                  <div key={i} className="w-[3px] rounded-[1px] bg-black/75" style={{ height: h }} />
                ))}
              </div>
              {/* WiFi */}
              <svg viewBox="0 0 17 13" className="h-[11px] w-[14px] fill-black/75">
                <path d="M8.5 10a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-3.7-2.6a5.2 5.2 0 0 1 7.4 0L10.8 8.8a3.1 3.1 0 0 0-4.6 0L4.8 7.4zm-2.9-2.9a9.3 9.3 0 0 1 13.2 0l-1.4 1.4a7.2 7.2 0 0 0-10.4 0L1.9 4.5z" />
              </svg>
              {/* Battery */}
              <div className="relative flex h-[11px] w-[22px] items-center">
                <div className="flex h-full w-[19px] items-center rounded-[2.5px] border border-black/50 px-[1.5px]">
                  <div className="h-[6px] w-[13px] rounded-[1px] bg-black/75" />
                </div>
                <div className="absolute -right-[3px] h-[5px] w-[2px] rounded-r-sm bg-black/40" />
              </div>
            </div>
          </div>

          {/* ── iMessage chat header ── */}
          <div className="flex shrink-0 flex-col items-center gap-0.5 border-b border-black/8 bg-white px-4 pb-2.5 pt-1">
            {/* Chevron + contact name row */}
            <div className="flex w-full items-center">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-[#007AFF] stroke-2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex flex-1 flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm">
                  <span className="text-[12px] font-bold text-white">HB</span>
                </div>
                <p className="mt-0.5 text-[12px] font-semibold text-black leading-tight">HomeBids AI</p>
                <p className="text-[10px] leading-tight text-green-500 font-medium">
                  {typing ? "typing..." : "Active Now"}
                </p>
              </div>
              {/* Spacer to balance the chevron */}
              <div className="h-4 w-4" />
            </div>
          </div>

          {/* ── Message list — fills remaining height, scrolls internally ── */}
          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto bg-white px-3 py-3"
            style={{ scrollbarWidth: "none" }}
          >
            <AnimatePresence mode="popLayout">
              {CONVERSATION.filter((_, i) => visible.includes(i)).map((msg) => {
                const globalIdx = CONVERSATION.indexOf(msg);
                const isUser = msg.sender === "user";
                return (
                  <motion.div
                    key={`msg-${globalIdx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.88, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 480, damping: 28 }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] break-words rounded-2xl px-3 py-[7px] text-[13px] leading-snug ${
                        isUser
                          ? "rounded-br-[5px] bg-[#007AFF] text-white"
                          : "rounded-bl-[5px] bg-[#E9E9EB] text-black"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {typing && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl rounded-bl-[5px] bg-[#E9E9EB] px-3 py-[7px]">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Input bar ── */}
          <div className="flex shrink-0 items-center gap-2 border-t border-black/8 bg-white px-3 py-2">
            {/* + button */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E9E9EB]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-[#8E8E93] fill-none stroke-2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            {/* Input pill */}
            <div className="flex flex-1 items-center rounded-full border border-[#C7C7CC] bg-white px-3 py-1.5">
              <span className="text-[11px] text-[#8E8E93]">iMessage</span>
            </div>
            {/* Send button */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#007AFF]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-white stroke-[2.5]">
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* ── Home indicator ── */}
          <div className="flex shrink-0 justify-center bg-white pb-2 pt-1">
            <div className="h-[4px] w-28 rounded-full bg-black/15" />
          </div>
        </div>

        {/* Side buttons (visual only) */}
        <div className="absolute -left-[7px] top-[100px] h-[32px] w-[4px] rounded-l-full bg-[#1a1a1a]" />
        <div className="absolute -left-[7px] top-[148px] h-[56px] w-[4px] rounded-l-full bg-[#1a1a1a]" />
        <div className="absolute -left-[7px] top-[216px] h-[56px] w-[4px] rounded-l-full bg-[#1a1a1a]" />
        <div className="absolute -right-[7px] top-[160px] h-[72px] w-[4px] rounded-r-full bg-[#1a1a1a]" />
      </div>
    </div>
  );
}
