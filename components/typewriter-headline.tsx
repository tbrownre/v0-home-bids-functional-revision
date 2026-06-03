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

  // Detect prefers-reduced-motion once on mount
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

  // Typewriter state machine
  useEffect(() => {
    if (prefersReducedMotion.current) {
      setDisplayed(SUGGESTIONS[0])
      setPhase("pausing")
      return
    }

    const current = SUGGESTIONS[index]

    if (phase === "typing") {
      if (displayed.length < current.length) {
        const id = setTimeout(() => {
          setDisplayed(current.slice(0, displayed.length + 1))
        }, TYPE_SPEED)
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
        const id = setTimeout(() => {
          setDisplayed((d) => d.slice(0, -1))
        }, DELETE_SPEED)
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
    <h1
      className="text-4xl font-bold leading-[1.25] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]"
      aria-label={`"Hey HomeBids, I need help with a ${SUGGESTIONS[index]}."`}
      style={{ fontSize: "28px" }}
    >
      <span aria-hidden="true">
        {/* Static prefix:
            - Mobile (block): sits on its own line, ends without "a" so the
              animated slot can start with "a " on the next line.
            - sm+ (inline): full sentence flows on one line. */}
        <span className="block text-foreground sm:inline">
          &ldquo;Hey HomeBids, I need help with
        </span>

        {/* "a " connector — hidden on mobile (animated slot provides it inline),
            shown as inline text on sm+ to join the prefix */}
        <span className="text-foreground hidden sm:inline">&nbsp;a&nbsp;</span>

        {/* Animated slot — block on mobile (own line), inline on sm+ */}
        <span className="block sm:inline">
          {/* "a " only shown on mobile, before the typed phrase */}
          <span className="text-foreground sm:hidden">a </span>

          <span className="relative inline-block whitespace-nowrap text-[#0A84FF]">
            {/* Typed text */}
            {displayed}

            {/* Period — fades in when phrase is complete */}
            <span style={{ opacity: isComplete ? 1 : 0, transition: "opacity 0.1s" }}>
              .
            </span>

            {/* Closing quote — fades in with the period */}
            <span style={{ opacity: isComplete ? 1 : 0, transition: "opacity 0.15s" }}>
              &rdquo;
            </span>

            {/* Blinking cursor — fades out when phrase is complete */}
            <span
              aria-hidden="true"
              className="inline-block rounded-sm bg-[#0A84FF]"
              style={{
                width: "3px",
                height: "0.82em",
                marginLeft: "2px",
                verticalAlign: "text-bottom",
                opacity: isComplete ? 0 : cursorVisible ? 1 : 0,
                transition: "opacity 0.1s",
              }}
            />
          </span>
        </span>
      </span>
    </h1>
  )
}
