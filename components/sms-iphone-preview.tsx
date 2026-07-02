"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Types & data
// ─────────────────────────────────────────────────────────────────────────────
interface Bubble {
  type: "blue" | "gray";
  text: string;
}

interface Example {
  audience: "Homeowner" | "Contractor";
  messages: Bubble[];
}

const EXAMPLES: Example[] = [
  // ── HOMEOWNER ──────────────────────────────────────────────────────────────
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "My AC turns on, but the house never cools down." },
      { type: "gray", text: "Got it. How old is the unit, and when did this start?" },
      { type: "blue", text: "About 11 years old. Started last week." },
      { type: "gray", text: "I have enough to help find the right HVAC pros." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "We found a leak in the master bedroom ceiling." },
      { type: "gray", text: "Do you know how old the roof is?" },
      { type: "blue", text: "Around 14 years old. We bought 3 years ago." },
      { type: "gray", text: "Got it. I'll help organize this for roofers." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "There's water leaking under our kitchen sink." },
      { type: "gray", text: "Is it active right now or only when the sink runs?" },
      { type: "blue", text: "Only when the sink runs." },
      { type: "gray", text: "Thanks. I'll help get this ready for a plumber." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "We want to remodel our kitchen." },
      { type: "gray", text: "Are you looking for cabinets, counters, flooring, or all of it?" },
      { type: "blue", text: "Mostly cabinets, counters, and backsplash." },
      { type: "gray", text: "Perfect. I'll help turn this into a clear project scope." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "Our shower tile is cracked and leaking." },
      { type: "gray", text: "Is the leak visible outside the shower?" },
      { type: "blue", text: "Yes, the wall near it feels soft." },
      { type: "gray", text: "Got it. This should be reviewed by qualified pros." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "We want new flooring in 3 bedrooms." },
      { type: "gray", text: "Do you know the approximate square footage?" },
      { type: "blue", text: "Around 650 sq ft." },
      { type: "gray", text: "Great. I'll help organize the details for flooring pros." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "Our pool is green and needs help." },
      { type: "gray", text: "Is the pump currently running?" },
      { type: "blue", text: "Yes, but the water still looks bad." },
      { type: "gray", text: "Got it. I'll help prepare this for pool service pros." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "Our backyard needs a cleanup and new design." },
      { type: "gray", text: "Are you looking for maintenance or a full refresh?" },
      { type: "blue", text: "Full refresh with gravel, plants, and lighting." },
      { type: "gray", text: "Perfect. I'll help organize the scope." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "We need the outside of our house painted." },
      { type: "gray", text: "Single story or two story?" },
      { type: "blue", text: "Single story, about 2,100 sq ft." },
      { type: "gray", text: "Great. I'll help prepare this for painters." },
    ],
  },
  {
    audience: "Homeowner",
    messages: [
      { type: "blue", text: "A few outlets stopped working." },
      { type: "gray", text: "Did a breaker trip or is there any burning smell?" },
      { type: "blue", text: "No smell. Breaker looks fine." },
      { type: "gray", text: "Thanks. I'll help route this to electricians." },
    ],
  },
  // ── CONTRACTOR ─────────────────────────────────────────────────────────────
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Build a bid for a 4-ton AC replacement." },
      { type: "gray", text: "Got it. Do you want good/better/best options?" },
      { type: "blue", text: "Yes. Include labor, equipment, crane, and warranty." },
      { type: "gray", text: "Perfect. I'll draft a clean HVAC proposal." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Need a roof repair proposal from these notes." },
      { type: "gray", text: "Send the photos or scope details." },
      { type: "blue", text: "Leak near vent pipe. Replace flashing and seal area." },
      { type: "gray", text: "Got it. I'll create the repair scope and proposal." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Create a bid for a 50-gallon water heater install." },
      { type: "gray", text: "Gas or electric?" },
      { type: "blue", text: "Gas. Include haul-away and code upgrades." },
      { type: "gray", text: "Perfect. I'll build the proposal." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Build a flooring bid for 850 sq ft of LVP." },
      { type: "gray", text: "Include demo and baseboards?" },
      { type: "blue", text: "Yes. Demo carpet, install LVP, new baseboards." },
      { type: "gray", text: "Got it. I'll format the bid clearly." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Need a bathroom remodel proposal." },
      { type: "gray", text: "What's included in the scope?" },
      { type: "blue", text: "Demo, tile shower, vanity, fixtures, paint." },
      { type: "gray", text: "Perfect. I'll create a professional proposal." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Build a landscape proposal from my notes." },
      { type: "gray", text: "Send the main scope items." },
      { type: "blue", text: "Gravel, drip line, 8 plants, lighting, cleanup." },
      { type: "gray", text: "Got it. I'll turn this into a clean bid." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Create a bid for 120 ft of wood fence." },
      { type: "gray", text: "Any gate or removal needed?" },
      { type: "blue", text: "Yes. Remove old fence and add one gate." },
      { type: "gray", text: "Perfect. I'll draft the scope and pricing sections." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Build a paint bid for a 3-bedroom house." },
      { type: "gray", text: "Walls only or ceilings and trim too?" },
      { type: "blue", text: "Walls, ceilings, baseboards, and doors." },
      { type: "gray", text: "Got it. I'll create a polished proposal." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Need a bid for 8 window replacements." },
      { type: "gray", text: "Retrofit or full-frame?" },
      { type: "blue", text: "Retrofit. Include removal and disposal." },
      { type: "gray", text: "Perfect. I'll build the proposal." },
    ],
  },
  {
    audience: "Contractor",
    messages: [
      { type: "blue", text: "Create a recurring pest control proposal." },
      { type: "gray", text: "Monthly, bi-monthly, or quarterly?" },
      { type: "blue", text: "Monthly service. Interior and exterior." },
      { type: "gray", text: "Got it. I'll generate the proposal." },
    ],
  },
];

const ROTATE_INTERVAL = 4000;

// ─────────────────────────────────────────────────────────────────────────────
// iOS-accurate SVG status bar icons
// ─────────────────────────────────────────────────────────────────────────────
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

function Ios5G() {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: "#000", letterSpacing: "-0.2px" }}>
      5G
    </span>
  );
}

function IosBattery() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 500, color: "#000", letterSpacing: "-0.1px" }}>94%</span>
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
        <rect x="2" y="2" width="17.5" height="9" rx="2" fill="#30D158" />
        <path d="M23.5 4.5v4a2 2 0 0 0 0-4z" fill="rgba(0,0,0,0.4)" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function SmsIphonePreview() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion.current) return;

    const timer = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % EXAMPLES.length);
        setVisible(true);
      }, 400);
    }, ROTATE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  const example = EXAMPLES[index];
  const isHomeowner = example.audience === "Homeowner";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", width: 300, height: 640, flexShrink: 0 }}>
      <div className="relative" style={{ width: 300, height: 640, flexShrink: 0 }}>

        {/* ── iPhone shell ──────────────────────────────────────────────── */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            height: 620,
            maxHeight: 620,
            flexShrink: 0,
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

          {/* ── Dynamic Island ──────────────────────────────────────────── */}
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

          {/* ── Status bar ──────────────────────────────────────────────── */}
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

          {/* ── iMessage header ─────────────────────────────────────────── */}
          <div
            className="relative flex shrink-0 items-center bg-[#F2F2F7] px-[10px] pb-[10px] pt-[4px]"
            style={{ borderBottom: "0.5px solid rgba(0,0,0,0.12)", lineHeight: "3.1em" }}
          >
            {/* Back button */}
            <button style={{ minWidth: 60, flexShrink: 0 }} tabIndex={-1}>
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
                    background: "rgba(28, 28, 30, 0.00)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#000000", lineHeight: 1 }}>3</span>
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

            {/* Video icon */}
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

          {/* ── Messages ────────────────────────────────────────────────── */}
          <div
            className="flex flex-1 flex-col overflow-hidden"
            style={{
              background: "#F2F2F7",
              padding: "10px 10px 6px",
              gap: 0,
              scrollbarWidth: "none",
              alignItems: "stretch",
            }}
          >
            {/* Timestamp */}
            <div style={{ textAlign: "center", marginBottom: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#8E8E93", fontWeight: 500 }}>
                Today 9:41 AM
              </span>
            </div>

            {/* Rotating content — fades as a unit, no layout shift */}
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                style={{ display: "flex", flexDirection: "column", gap: 0, flex: 1 }}
              >
                {/* Audience label pill — sits above the first bubble */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: isHomeowner ? "rgba(0,122,255,0.08)" : "rgba(52,199,89,0.10)",
                      border: `1px solid ${isHomeowner ? "rgba(0,122,255,0.18)" : "rgba(52,199,89,0.22)"}`,
                      color: isHomeowner ? "#0A7AFF" : "#1A8F3C",
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {/* Dot indicator */}
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: isHomeowner ? "#0A7AFF" : "#1A8F3C",
                        flexShrink: 0,
                      }}
                    />
                    {example.audience}
                  </span>
                </div>

                {/* Message bubbles */}
                {example.messages.map((bubble, i) => {
                  const isBlue = bubble.type === "blue";
                  const R = 18;
                  const tail = 4;
                  // Last blue bubble gets bottom-right tail; last gray gets bottom-left tail
                  const isLastOfType =
                    i === example.messages.length - 1 ||
                    example.messages[i + 1]?.type !== bubble.type;
                  const borderRadius = isBlue
                    ? `${R}px ${R}px ${isLastOfType ? tail : R}px ${R}px`
                    : `${R}px ${R}px ${R}px ${isLastOfType ? tail : R}px`;

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: isBlue ? "flex-end" : "flex-start",
                        marginBottom: 7,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "7px 12px",
                          borderRadius,
                          background: isBlue ? "#007AFF" : "#E9E9EB",
                          color: isBlue ? "#fff" : "#000",
                          fontSize: 13.5,
                          lineHeight: 1.38,
                          wordBreak: "break-word",
                          textAlign: "left",
                        }}
                      >
                        {bubble.text}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Input bar ───────────────────────────────────────────────── */}
          <div
            className="flex shrink-0 items-center"
            style={{
              background: "#F2F2F7",
              borderTop: "0.5px solid rgba(0,0,0,0.12)",
              padding: "7px 10px 8px",
              gap: 8,
            }}
          >
            {/* Apps + button */}
            <div
              className="flex shrink-0 items-center justify-center"
              style={{ width: 30, height: 30, borderRadius: "50%", background: "#E9E9EB" }}
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

            {/* Mic icon */}
            <div className="flex shrink-0 items-center justify-center" style={{ width: 30, height: 30 }}>
              <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
                <rect x="4" y="0.5" width="8" height="13" rx="4" stroke="#8E8E93" strokeWidth="1.5" />
                <path d="M1 10.5a7 7 0 0 0 14 0" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="17.5" x2="8" y2="21" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
