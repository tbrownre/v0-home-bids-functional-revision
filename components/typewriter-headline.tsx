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

// The longest phrase — used to reserve stable width so the layout never shifts
const LONGEST = "bathroom renovation"

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

  // Cursor blink — only runs when not reduced-motion
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
      aria-label={`"Hey HomeBids, I need help with ${SUGGESTIONS[index]}."`}
    >
      {/*
        The entire sentence sits on one inline flow so static text, animated
        text, period, and closing quote all share the same baseline.
        `inline-block` on the animated slot with a fixed invisible "ghost"
        ensures the container never collapses or jumps.
      */}
      <span aria-hidden="true">
        {/* Opening quote */}
        <span className="text-foreground">&ldquo;Hey HomeBids, I need help with&nbsp;</span>

        {/* Animated slot — reserves width of longest phrase + period + closing quote */}
        <span className="relative inline-block">
          {/* Ghost: invisible — holds the maximum width so the layout never shifts */}
          <span
            className="invisible whitespace-nowrap text-[#0A84FF]"
            aria-hidden="true"
          >
            {LONGEST}
            <span className="text-foreground">.&rdquo;</span>
          </span>

          {/* Actual typed text — absolutely positioned over the ghost, nowrap so
              the period + closing quote never split off to a new line */}
          <span
            className="absolute inset-y-0 left-0 whitespace-nowrap text-[#0A84FF]"
            style={{ lineHeight: "inherit" }}
          >
            {displayed}

            {/* Period in blue — fades in when phrase is complete */}
            <span
              className="text-[#0A84FF]"
              style={{ opacity: isComplete ? 1 : 0, transition: "opacity 0.1s" }}
            >
              .
            </span>

            {/* Closing quote in foreground color — inline with the blue text group */}
            <span
              className="text-foreground"
              style={{ opacity: isComplete ? 1 : 0, transition: "opacity 0.15s" }}
            >
              &rdquo;
            </span>

            {/* Blinking cursor — hidden once phrase is complete */}
            <span
              aria-hidden="true"
              className="inline-block rounded-sm bg-[#0A84FF]"
              style={{
                width: "3px",
                height: "0.82em",
                marginLeft: "2px",
                verticalAlign: "baseline",
                position: "relative",
                top: "-0.05em",
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
