"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  sender: "user" | "ai";
  text: string;
}

const CONVERSATION: Message[] = [
  { sender: "user", text: "My AC isn't cooling" },
  { sender: "ai", text: "Got it! What's your zip code?" },
  { sender: "user", text: "33607" },
  { sender: "ai", text: "When do you need this done?" },
  { sender: "user", text: "ASAP" },
  { sender: "ai", text: "Finding contractors... 3 bids incoming!" },
];

const TYPING_DELAY = 900;
const MESSAGE_DELAY = 1400;

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function SmsIphonePreview() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Small initial delay before first message
    const startTimer = setTimeout(() => setHasStarted(true), 600);
    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    if (visibleCount >= CONVERSATION.length) return;

    const nextMessage = CONVERSATION[visibleCount];
    const isAi = nextMessage?.sender === "ai";

    if (isAi) {
      // Show typing indicator before AI messages
      setShowTyping(true);
      const typingTimer = setTimeout(() => {
        setShowTyping(false);
        setVisibleCount((c) => c + 1);
      }, TYPING_DELAY);
      return () => clearTimeout(typingTimer);
    } else {
      const timer = setTimeout(() => {
        setVisibleCount((c) => c + 1);
      }, MESSAGE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, hasStarted]);

  // Loop: restart after final message is shown for a few seconds
  useEffect(() => {
    if (visibleCount < CONVERSATION.length) return;
    const restartTimer = setTimeout(() => {
      setVisibleCount(0);
      setHasStarted(false);
      // Re-trigger start after a brief pause
      setTimeout(() => setHasStarted(true), 800);
    }, 4000);
    return () => clearTimeout(restartTimer);
  }, [visibleCount]);

  return (
    <div className="flex items-center justify-center">
      {/* iPhone frame */}
      <div className="relative w-[280px] sm:w-[300px]">
        {/* Device bezel */}
        <div className="rounded-[2.5rem] border-[6px] border-foreground/10 bg-card shadow-2xl">
          {/* Notch / Dynamic Island */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-5 w-24 rounded-full bg-foreground/10" />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-1 text-[10px] font-semibold text-muted-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-px">
                {[4, 6, 8, 10].map((h) => (
                  <div
                    key={h}
                    className="w-[3px] rounded-sm bg-muted-foreground/60"
                    style={{ height: h }}
                  />
                ))}
              </div>
              <svg
                viewBox="0 0 25 12"
                className="h-3 w-5 fill-muted-foreground/60"
              >
                <rect x="0" y="1" width="21" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
                <rect x="2" y="3" width="17" height="6" rx="1" />
                <rect x="22" y="4" width="3" height="4" rx="1" />
              </svg>
            </div>
          </div>

          {/* Messages header */}
          <div className="border-b border-border/50 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-xs font-bold text-primary-foreground">HB</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">HomeBids</p>
                <p className="text-[10px] text-muted-foreground">iMessage</p>
              </div>
            </div>
          </div>

          {/* Message area */}
          <div className="flex min-h-[280px] flex-col justify-end gap-2 p-3">
            <AnimatePresence mode="popLayout">
              {CONVERSATION.slice(0, visibleCount).map((msg, i) => (
                <motion.div
                  key={`${msg.text}-${i}`}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                      msg.sender === "user"
                        ? "bg-[#007AFF] text-[#fff]"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {showTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl bg-secondary px-3 py-1.5">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* iMessage input bar */}
          <div className="border-t border-border/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="flex-1 rounded-full border border-border/60 bg-background px-3 py-1.5 text-[11px] text-muted-foreground">
                iMessage
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-2 pt-1">
            <div className="h-1 w-28 rounded-full bg-foreground/15" />
          </div>
        </div>
      </div>
    </div>
  );
}
