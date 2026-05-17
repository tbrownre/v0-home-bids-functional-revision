"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  sender: "user" | "ai";
  text: string;
  delay: number; // ms after the previous message finishes appearing
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

const TYPING_DURATION = 1100; // how long the typing indicator shows before AI message appears
const RESTART_DELAY  = 4200; // pause at end before looping

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
  const phaseRef  = useRef(0);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const schedule = (fn: () => void, ms: number) => {
    clear();
    timerRef.current = setTimeout(fn, ms);
  };

  // Kick off the whole sequence
  const runStep = (idx: number) => {
    if (idx >= CONVERSATION.length) {
      // All done — wait then restart
      schedule(() => {
        setVisible([]);
        setTyping(false);
        phaseRef.current = 0;
        schedule(() => runStep(0), 500);
      }, RESTART_DELAY);
      return;
    }

    const msg = CONVERSATION[idx];

    if (msg.sender === "ai") {
      // Show typing indicator, then reveal message
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
      <div className="relative w-[272px] sm:w-[296px]">
        {/* iPhone shell */}
        <div className="overflow-hidden rounded-[2.8rem] border-[5px] border-foreground/10 bg-card shadow-2xl shadow-foreground/8" style={{ height: 520 }}>

          {/* Dynamic island */}
          <div className="flex justify-center bg-card pt-3 pb-0.5">
            <div className="h-[22px] w-[90px] rounded-full bg-foreground/90" />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between bg-card px-5 py-1">
            <span className="text-[11px] font-semibold text-foreground/80">9:41</span>
            <div className="flex items-center gap-1.5">
              {/* Signal bars */}
              <div className="flex items-end gap-[2px]">
                {[3, 5, 7, 9].map((h, i) => (
                  <div key={i} className="w-[3px] rounded-[1px] bg-foreground/70" style={{ height: h }} />
                ))}
              </div>
              {/* WiFi icon */}
              <svg viewBox="0 0 16 12" className="h-3 w-4 text-foreground/70" fill="currentColor">
                <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-3.5-2.5a5 5 0 0 1 7 0l-1.4 1.4a3 3 0 0 0-4.2 0L4.5 7zm-2.8-2.8a9 9 0 0 1 12.6 0l-1.4 1.4a7 7 0 0 0-9.8 0L1.7 4.2z"/>
              </svg>
              {/* Battery */}
              <div className="relative flex h-[10px] w-[20px] items-center">
                <div className="h-full w-[18px] rounded-[2px] border border-foreground/60">
                  <div className="m-[1px] h-[6px] w-[13px] rounded-[1px] bg-foreground/70" />
                </div>
                <div className="absolute -right-[3px] h-[5px] w-[2px] rounded-r-[1px] bg-foreground/50" />
              </div>
            </div>
          </div>

          {/* Chat header */}
          <div className="flex items-center gap-2.5 border-b border-border/40 bg-card px-4 pb-2.5 pt-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground">
              <span className="text-[11px] font-bold text-background">HB</span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight text-foreground">HomeBids AI</p>
              <p className="text-[10px] text-muted-foreground">
                {typing ? (
                  <span className="text-green-600 dark:text-green-400">typing...</span>
                ) : (
                  "iMessage"
                )}
              </p>
            </div>
          </div>

          {/* Message list — fixed height, scrolls internally */}
          <div className="flex h-[260px] flex-col justify-end gap-1.5 overflow-y-auto bg-background px-3 py-3 min-h-0">
            <AnimatePresence mode="popLayout">
              {CONVERSATION.filter((_, i) => visible.includes(i)).map((msg, _, arr) => {
                const globalIdx = CONVERSATION.indexOf(msg);
                return (
                  <motion.div
                    key={`msg-${globalIdx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.88, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 480, damping: 28 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] break-words rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                        msg.sender === "user"
                          ? "rounded-br-[4px] bg-[#007AFF] text-white"
                          : "rounded-bl-[4px] bg-secondary text-secondary-foreground"
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
                  <div className="rounded-2xl rounded-bl-[4px] bg-secondary px-3 py-2">
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 border-t border-border/40 bg-card px-3 py-2">
            <div className="flex-1 rounded-full border border-border/50 bg-background px-3 py-1.5 text-[11px] text-muted-foreground/60">
              iMessage
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#007AFF]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center bg-card pb-2 pt-1">
            <div className="h-[4px] w-28 rounded-full bg-foreground/15" />
          </div>

        </div>
      </div>
    </div>
  );
}
