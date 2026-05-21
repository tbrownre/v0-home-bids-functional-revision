"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  sender: "user" | "ai";
  text: string;
  delay: number;
}

// 10 rotating homeowner project scenarios
const SCENARIOS: Message[][] = [
  // 1. HVAC replacement
  [
    { sender: "user", text: "Hey, my AC stopped blowing cold air completely.", delay: 400 },
    { sender: "ai",   text: "Got you — is the outdoor unit running at all, or is everything off?", delay: 650 },
    { sender: "user", text: "The fan spins but nothing's cooling.", delay: 800 },
    { sender: "ai",   text: "That sounds like a refrigerant or compressor issue. How old is the system?", delay: 700 },
    { sender: "user", text: "About 14 years I think.", delay: 750 },
    { sender: "ai",   text: "Got it. I'll match you with 3 local HVAC pros for free estimates.", delay: 650 },
    { sender: "ai",   text: "Bids on the way — usually within a few hours!", delay: 500 },
  ],
  // 2. Roof leak repair
  [
    { sender: "user", text: "We have a leak in our ceiling after the last storm.", delay: 400 },
    { sender: "ai",   text: "Ugh, that's stressful. Is water actively dripping or just a stain?", delay: 700 },
    { sender: "user", text: "Stain right now, but it got worse with the last rain.", delay: 850 },
    { sender: "ai",   text: "Makes sense. Do you know roughly how old your roof is?", delay: 650 },
    { sender: "user", text: "Maybe 12-15 years. Previous owners' install.", delay: 800 },
    { sender: "ai",   text: "I'll find certified roofers near you who can inspect and bid the repair.", delay: 700 },
    { sender: "ai",   text: "Sending your project to qualified contractors now.", delay: 500 },
  ],
  // 3. Kitchen remodel
  [
    { sender: "user", text: "We just bought our house and the kitchen needs a full update.", delay: 400 },
    { sender: "ai",   text: "Exciting! Are we talking cabinets, counters, appliances — or the whole thing?", delay: 700 },
    { sender: "user", text: "All of it. New layout too if possible.", delay: 800 },
    { sender: "ai",   text: "Love it. Do you have a rough budget range in mind?", delay: 650 },
    { sender: "user", text: "Somewhere between $30k-$50k.", delay: 750 },
    { sender: "ai",   text: "Perfect scope. I'll line up 3 kitchen remodelers for competitive bids.", delay: 700 },
    { sender: "ai",   text: "No phone tag needed — they'll come to you!", delay: 500 },
  ],
  // 4. Bathroom remodel
  [
    { sender: "user", text: "Our master bath is outdated. Trying to figure out costs.", delay: 400 },
    { sender: "ai",   text: "Happy to help. Is this a cosmetic refresh or full gut and rebuild?", delay: 700 },
    { sender: "user", text: "Full gut — new tile, vanity, walk-in shower.", delay: 850 },
    { sender: "ai",   text: "Nice scope. What's your rough timeline — any upcoming events?", delay: 650 },
    { sender: "user", text: "Want it done before the holidays if possible.", delay: 800 },
    { sender: "ai",   text: "Totally doable. I'll find contractors with availability this season.", delay: 700 },
    { sender: "ai",   text: "Reaching out to local bath remodelers now — bids incoming!", delay: 500 },
  ],
  // 5. Landscaping cleanup
  [
    { sender: "user", text: "Backyard is completely overgrown. Need a full cleanup.", delay: 400 },
    { sender: "ai",   text: "Gotcha! Is this mainly weeds and overgrowth, or are there trees involved too?", delay: 700 },
    { sender: "user", text: "Mostly shrubs and weeds. A couple small dead trees.", delay: 850 },
    { sender: "ai",   text: "Good to know. Ballpark lot size? Helps me match the right crew.", delay: 650 },
    { sender: "user", text: "About a quarter acre.", delay: 750 },
    { sender: "ai",   text: "Perfect — I'll get local landscapers bidding on this for you.", delay: 700 },
    { sender: "ai",   text: "You'll have multiple quotes without making a single call.", delay: 500 },
  ],
  // 6. Interior painting
  [
    { sender: "user", text: "Need the whole interior of my home repainted. About 2,200 sq ft.", delay: 400 },
    { sender: "ai",   text: "Great project! All rooms, or skipping any — like ceilings or trim?", delay: 700 },
    { sender: "user", text: "Everything including trim. Walls need a lot of prep work too.", delay: 850 },
    { sender: "ai",   text: "Noted. Do you have colors picked out or still deciding?", delay: 650 },
    { sender: "user", text: "Have the colors, just need someone reliable.", delay: 800 },
    { sender: "ai",   text: "I'll line up 3 painters who handle full prep and cleanup.", delay: 700 },
    { sender: "ai",   text: "Bids coming your way — compare and choose the best fit!", delay: 500 },
  ],
  // 7. Pool repair
  [
    { sender: "user", text: "Pool pump died and I think there's a small leak somewhere.", delay: 400 },
    { sender: "ai",   text: "Frustrating combo! Is the water level dropping noticeably day to day?", delay: 700 },
    { sender: "user", text: "About half an inch per day, which seems like a lot.", delay: 850 },
    { sender: "ai",   text: "That's worth getting checked. In-ground or above-ground pool?", delay: 650 },
    { sender: "user", text: "In-ground, gunite. About 15 years old.", delay: 800 },
    { sender: "ai",   text: "Got it. I'll find pool specialists who handle both pump and leak detection.", delay: 700 },
    { sender: "ai",   text: "Multiple bids incoming — no need to track anyone down yourself!", delay: 500 },
  ],
  // 8. Flooring installation
  [
    { sender: "user", text: "Want to replace carpet with hardwood throughout the main floor.", delay: 400 },
    { sender: "ai",   text: "Nice upgrade! Rough square footage, and any stairs involved?", delay: 700 },
    { sender: "user", text: "Around 1,400 sq ft. No stairs, just open plan.", delay: 850 },
    { sender: "ai",   text: "Easy scope. Any preference — solid hardwood, engineered, or open to both?", delay: 650 },
    { sender: "user", text: "Open to both. Trying to stay under $15k.", delay: 800 },
    { sender: "ai",   text: "That's very doable. I'll send this to flooring pros near you.", delay: 700 },
    { sender: "ai",   text: "Expect competitive bids — compare side-by-side and pick your favorite!", delay: 500 },
  ],
  // 9. Water heater replacement
  [
    { sender: "user", text: "Water heater is 18 years old and starting to rust. Time to replace.", delay: 400 },
    { sender: "ai",   text: "Smart move before it becomes an emergency! Tank or tankless?", delay: 700 },
    { sender: "user", text: "Currently tank. Open to going tankless if the cost makes sense.", delay: 850 },
    { sender: "ai",   text: "Good thinking. What's your current fuel source — gas or electric?", delay: 650 },
    { sender: "user", text: "Natural gas.", delay: 800 },
    { sender: "ai",   text: "Perfect. I'll get you bids for both options so you can compare.", delay: 700 },
    { sender: "ai",   text: "Local plumbers notified — bids coming your way shortly!", delay: 500 },
  ],
  // 10. Electrical panel upgrade
  [
    { sender: "user", text: "Circuit breakers keep tripping. I think the panel is too old.", delay: 400 },
    { sender: "ai",   text: "That's worth addressing — safety first. What amperage is the current panel?", delay: 700 },
    { sender: "user", text: "100 amp I think. House was built in 1978.", delay: 850 },
    { sender: "ai",   text: "Likely time for an upgrade to 200A. Adding any new circuits for EV or appliances?", delay: 700 },
    { sender: "user", text: "Was thinking an EV charger too, yeah.", delay: 800 },
    { sender: "ai",   text: "Great combo project. I'll find licensed electricians who handle panel upgrades.", delay: 700 },
    { sender: "ai",   text: "Sending to verified local pros now — bids on the way!", delay: 500 },
  ],
];

const TYPING_DURATION = 1100;
const RESTART_DELAY  = 4200;

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
