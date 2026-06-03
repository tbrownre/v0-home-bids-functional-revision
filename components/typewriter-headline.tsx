"use client"

import { useEffect, useRef, useState } from "react"

const SUGGESTIONS = [
  "kitchen remodel",
  "roof repair",
  "bathroom renovation",
  "AC replacement",
  "flooring install",
  "house painting",
  "water heater leak",
  "pool resurfacing",
  "cabinet refinishing",
  "window replacement",
]

const TYPE_SPEED = 55
const DELETE_SPEED = 30
const PAUSE_AFTER = 1800
const PAUSE_BEFORE = 300

export function TypewriterHeadline() {
  const [displayed, setDisplayed] = useState("")
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting" | "waiting">("typing")
  const [index, setIndex] = useState(0)
  const [cursorVisible, setCursorVisible] = useState(true)
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      prefersReducedMotion.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    }
  }, [])

  // Cursor blink
  useEffect(() => {
    if (prefersReducedMotion.current) return
    const id = setInterval(() => setCursorVisible((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  // State machine
  useEffect(() => {
    if (prefersReducedMotion.current) {
      setDisplayed(SUGGESTIONS[0])
      setPhase("pausing")
      return
    }
    const current = SUGGESTIONS[index]
    if (phase === "typing") {
      if (displayed.length < current.length) {
        const id = setTimeout(
          () => setDisplayed(current.slice(0, displayed.length + 1)),
          TYPE_SPEED
        )
        return () => clearTimeout(id)
      } else {
        setPhase("pausing")
      }
    }
    if (phase === "pausing") {
      const id = setTimeout(() => setPhase("deleting"), PAUSE_AFTER)
      return () => clearTimeout(id)
    }
    if (phase === "deleting") {
      if (displayed.length > 0) {
        const id = setTimeout(
          () => setDisplayed((d) => d.slice(0, -1)),
          DELETE_SPEED
        )
        return () => clearTimeout(id)
      } else {
        setPhase("waiting")
      }
    }
    if (phase === "waiting") {
      const id = setTimeout(() => {
        setIndex((i) => (i + 1) % SUGGESTIONS.length)
        setPhase("typing")
      }, PAUSE_BEFORE)
      return () => clearTimeout(id)
    }
  }, [displayed, phase, index])

  const isComplete = phase === "pausing"

  return (
    /*
      The h1 is one flat inline-flow sentence. No block wrappers, no forced
      line breaks, no absolute positioning, no fixed widths.

      min-height reserves two lines of text at 28px × 1.35 line-height so the
      layout never jumps while the typewriter is empty between rotations.

      overflow-wrap: break-word is the last-resort safety net: if an animated
      word is somehow wider than the viewport, the browser breaks it rather
      than scrolling horizontally.
    */
    <h1
      aria-label={`"Hey HomeBids, I need help with a ${SUGGESTIONS[index]}."`}
      style={{
        fontSize: "23px",
        fontWeight: 700,
        lineHeight: 1.35,
        letterSpacing: "-0.01em",
        overflowWrap: "break-word",
        wordBreak: "break-word",
        minHeight: "calc(28px * 1.35 * 2)",
        textAlign: "center",
        marginTop: "19px",
      }}
    >
      <span aria-hidden="true">
        {/* Static prefix — plain inline text, wraps naturally */}
        <span style={{ color: "inherit", textAlign: "center" }}>&ldquo;Hey HomeBids, I need help with a </span>

        {/*
          Animated phrase inline — no wrapper element changes display mode.
          The cursor is a tiny inline-block that does not widen the text line.
          Period and closing quote fade in when the phrase is complete.
        */}
        <span style={{ color: "#0A84FF", whiteSpace: "nowrap" }}>
          {displayed}

          {/*
            Cursor, period, and closing quote are always in the DOM.
            Only opacity changes — no mount/unmount, no layout shift.
            All three are inline so they never push onto a new line.
            whiteSpace: nowrap on the parent keeps this entire segment atomic.
          */}

          {/* Thin vertical bar cursor — inline-block, em-relative sizing */}
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "1.5px",
              height: "0.75em",
              marginLeft: "1.5px",
              verticalAlign: "text-bottom",
              borderRadius: "1px",
              backgroundColor: "#0A84FF",
              opacity: isComplete ? 0 : cursorVisible ? 1 : 0,
              // Only animate opacity — never width, margin, or position
              transition: "opacity 0.12s ease",
            }}
          />

          {/* Period fades in when phrase is complete */}
          <span
            style={{
              opacity: isComplete ? 1 : 0,
              transition: "opacity 0.1s ease",
            }}
          >
            .
          </span>

          {/* Closing quote fades in with period */}
          <span
            style={{
              opacity: isComplete ? 1 : 0,
              transition: "opacity 0.15s ease",
            }}
          >
            &rdquo;
          </span>
        </span>
      </span>
    </h1>
  )
}
