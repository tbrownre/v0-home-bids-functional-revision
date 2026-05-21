"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  sender: "user" | "ai";
  text: string;
  delay: number;
}

// 10 rotating homeowner project scenarios
// Every homeowner opener: "Hey HomeBids, I need help with…"
// AI gathers scope naturally — no immediate pricing or contractor promises.
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
    { sender: "ai",   text: "Good to know. I have everything I need to find the right pros for this.", delay: 800 },
  ],
  // 2. Kitchen Remodel
  [
    { sender: "user", text: "Hey HomeBids, I need help remodeling my kitchen.", delay: 600 },
    { sender: "ai",   text: "Great project. Are you looking at a full remodel or updating specific things like cabinets and counters?", delay: 900 },
    { sender: "user", text: "Full remodel — cabinets, counters, island, and new appliances.", delay: 700 },
    { sender: "ai",   text: "Understood. Do you have a budget range in mind, even a rough one?", delay: 850 },
    { sender: "user", text: "Somewhere between $40k and $60k.", delay: 650 },
    { sender: "ai",   text: "That's a solid range for what you're describing. What's your timeline looking like?", delay: 900 },
    { sender: "user", text: "Hoping to start within the next 4-6 weeks.", delay: 700 },
    { sender: "ai",   text: "Perfect. I have what I need to connect you with the right contractors.", delay: 800 },
  ],
  // 3. Roof Leak
  [
    { sender: "user", text: "Hey HomeBids, I need help with a roof leak after the last storm.", delay: 600 },
    { sender: "ai",   text: "Understood — let's get that sorted. Is water actively coming in, or are you seeing staining on the ceiling?", delay: 900 },
    { sender: "user", text: "There's a stain on the ceiling in the master bedroom. It keeps spreading.", delay: 700 },
    { sender: "ai",   text: "Makes sense. Do you have any idea how old the roof is?", delay: 850 },
    { sender: "user", text: "I think around 14 years. We bought the house 3 years ago.", delay: 700 },
    { sender: "ai",   text: "Good context. Has anyone been up to look at it yet, or is this the first step?", delay: 900 },
    { sender: "user", text: "First step. Haven't touched it yet.", delay: 600 },
    { sender: "ai",   text: "That's fine. I have enough to find qualified roofers who can inspect and provide estimates.", delay: 800 },
  ],
  // 4. Bathroom Remodel
  [
    { sender: "user", text: "Hey HomeBids, I need help updating my bathroom.", delay: 600 },
    { sender: "ai",   text: "Sure thing. Is this the primary bathroom, a guest bath, or both?", delay: 900 },
    { sender: "user", text: "The master bathroom. It's pretty outdated.", delay: 650 },
    { sender: "ai",   text: "What are you hoping to change — tile, vanity, shower, or the whole layout?", delay: 900 },
    { sender: "user", text: "Everything. New tile, walk-in shower, double vanity.", delay: 700 },
    { sender: "ai",   text: "Got it, that's a full remodel scope. Any flexibility on timing?", delay: 850 },
    { sender: "user", text: "Ideally done within the next couple months.", delay: 650 },
    { sender: "ai",   text: "That's workable. I have what I need to put your project in front of the right contractors.", delay: 800 },
  ],
  // 5. Pool Cleaning / Weekly Service
  [
    { sender: "user", text: "Hey HomeBids, I need help finding weekly pool service.", delay: 600 },
    { sender: "ai",   text: "Of course. Is this for an existing pool that just needs ongoing maintenance?", delay: 900 },
    { sender: "user", text: "Yes, we have an in-ground pool. It's been neglected for a few months.", delay: 700 },
    { sender: "ai",   text: "Understood. About how large is the pool, and is it chlorine or saltwater?", delay: 900 },
    { sender: "user", text: "It's around 15,000 gallons. Chlorine.", delay: 650 },
    { sender: "ai",   text: "Good to know. Are you looking for full-service weekly visits, or just chemical balancing?", delay: 900 },
    { sender: "user", text: "Full service — cleaning, chemicals, the whole thing.", delay: 700 },
    { sender: "ai",   text: "Clear picture. I can find local pool service pros who handle exactly that.", delay: 800 },
  ],
  // 6. Interior Painting
  [
    { sender: "user", text: "Hey HomeBids, I need help painting the inside of my house.", delay: 600 },
    { sender: "ai",   text: "Happy to help with that. Are you painting the whole interior or specific rooms?", delay: 900 },
    { sender: "user", text: "The whole thing — living areas, bedrooms, and hallways.", delay: 700 },
    { sender: "ai",   text: "Roughly how large is the home?", delay: 800 },
    { sender: "user", text: "About 2,100 square feet.", delay: 600 },
    { sender: "ai",   text: "Do you have paint colors already selected, or is that still being decided?", delay: 900 },
    { sender: "user", text: "Colors are picked. Just need a reliable painter.", delay: 650 },
    { sender: "ai",   text: "That helps. I have what I need to match you with painters in your area.", delay: 800 },
  ],
  // 7. Landscaping Redesign
  [
    { sender: "user", text: "Hey HomeBids, I need help redesigning my backyard landscaping.", delay: 600 },
    { sender: "ai",   text: "Sounds like a great project. What's the current state of the backyard?", delay: 900 },
    { sender: "user", text: "It's pretty bare. Just grass and an old concrete patio.", delay: 700 },
    { sender: "ai",   text: "Got it. Are you thinking plants and garden beds, hardscaping, or a full redesign?", delay: 900 },
    { sender: "user", text: "Full redesign — plants, a new patio, maybe some lighting.", delay: 700 },
    { sender: "ai",   text: "What's the approximate size of the backyard?", delay: 850 },
    { sender: "user", text: "Maybe 50 by 60 feet.", delay: 600 },
    { sender: "ai",   text: "That's a solid scope. I have what I need to connect you with landscape designers nearby.", delay: 800 },
  ],
  // 8. Water Heater Replacement
  [
    { sender: "user", text: "Hey HomeBids, I need help replacing my water heater.", delay: 600 },
    { sender: "ai",   text: "Of course. Is it completely out, or still running but showing signs of wear?", delay: 900 },
    { sender: "user", text: "Still running, but it's 17 years old and starting to rust.", delay: 700 },
    { sender: "ai",   text: "Smart to get ahead of it. Is it a tank-style or tankless unit?", delay: 900 },
    { sender: "user", text: "Tank-style. Gas powered.", delay: 600 },
    { sender: "ai",   text: "Are you open to going tankless, or would you prefer a direct replacement?", delay: 900 },
    { sender: "user", text: "Open to tankless if it makes sense for the price.", delay: 700 },
    { sender: "ai",   text: "Good to know. I have everything needed to line up the right plumbers for estimates.", delay: 800 },
  ],
  // 9. Flooring Installation
  [
    { sender: "user", text: "Hey HomeBids, I need help installing new flooring in my home.", delay: 600 },
    { sender: "ai",   text: "Sure thing. What type of flooring are you replacing, and what rooms are involved?", delay: 900 },
    { sender: "user", text: "Replacing carpet with hardwood throughout the main floor.", delay: 700 },
    { sender: "ai",   text: "How many square feet are we looking at, roughly?", delay: 850 },
    { sender: "user", text: "Probably around 1,600 square feet.", delay: 650 },
    { sender: "ai",   text: "Do you have a preference between solid hardwood and engineered hardwood?", delay: 900 },
    { sender: "user", text: "No strong preference. Open to seeing what contractors recommend.", delay: 700 },
    { sender: "ai",   text: "That flexibility will help get you competitive options. I have what I need.", delay: 800 },
  ],
  // 10. Pest Control – Scorpions
  [
    { sender: "user", text: "Hey HomeBids, I need help getting rid of scorpions around my house.", delay: 600 },
    { sender: "ai",   text: "Understood — that's a common issue in certain areas. Are you seeing them inside, outside, or both?", delay: 900 },
    { sender: "user", text: "Mostly outside around the foundation, but a couple have gotten inside.", delay: 700 },
    { sender: "ai",   text: "Good to know. Is this a recurring problem or something that started recently?", delay: 900 },
    { sender: "user", text: "It's gotten worse this summer. Finding one or two a week now.", delay: 700 },
    { sender: "ai",   text: "Are you looking for a one-time treatment or an ongoing service plan?", delay: 900 },
    { sender: "user", text: "Probably ongoing. I want to stay on top of it.", delay: 650 },
    { sender: "ai",   text: "That makes sense for your situation. I have what I need to find pest control pros near you.", delay: 800 },
  ],
];

const TYPING_DURATION = 1400;
const RESTART_DELAY  = 5000;

// Pick a random scenario on each mount (different per page load)
function pickScenario(): Message[] {
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

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
  // Stable scenario for this mount; rotates to the next one after each full cycle
  const [conversation, setConversation] = useState<Message[]>(() => pickScenario());
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

  const runStep = (conv: Message[], idx: number) => {
    if (idx >= conv.length) {
      schedule(() => {
        setVisible([]);
        setTyping(false);
        // Pick the next scenario (different from current) after the restart delay
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
              {conversation.filter((_, i) => visible.includes(i)).map((msg) => {
                const globalIdx = conversation.indexOf(msg);
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
