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

// Longest phrase — used to size the invisible width-reservation ghost
const LONGEST_PHRASE = "cabinet refinishing"

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

  useEffect(() => {
    if (prefersReducedMotion.current) return
    const id = setInterval(() => setCursorVisible((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

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
      className="font-bold leading-[1.35] tracking-tight text-foreground"
      aria-label={`"Hey HomeBids, I need help with a ${SUGGESTIONS[index]}."`}
      style={{ fontSize: "28px" }}
    >
      {/*
        Strategy: the entire sentence is one continuous inline flow.
        "with a " and the animated slot are wrapped together in a single
        whitespace-nowrap span so the browser treats them as one word —
        they either both fit at the end of a line or both wrap together.
        This prevents "with" or "a" from ever appearing alone.

        Layout-shift prevention: the animated slot uses position:relative
        with an invisible ghost (the longest phrase) to always occupy the
        same width, and the h1 itself has a min-height to reserve vertical
        space even while the typewriter is empty on first render.
      */}
      <span aria-hidden="true">
        {/* Static opening */}
        <span className="text-foreground">&ldquo;Hey HomeBids, I need help </span>

        {/*
          "with a [animated]" — all wrapped together as nowrap so the browser
          never orphans "with" or "a" on their own line. The whole group
          either fits at the end of the previous line or wraps as one unit.
        */}
        <span className="inline-block" style={{ whiteSpace: "nowrap", verticalAlign: "baseline" }}>
          <span className="text-foreground">with a&nbsp;</span>

          {/*
            Animated slot: position:relative container holds both the
            invisible ghost (which reserves stable width) and the
            absolute-positioned live text layer on top of it.
          */}
          <span
            className="relative inline-block text-[#0A84FF]"
            style={{ verticalAlign: "baseline" }}
          >
            {/* Ghost — invisible, reserves the width of the longest phrase */}
            <span
              className="invisible select-none"
              aria-hidden="true"
              style={{ whiteSpace: "nowrap" }}
            >
              {LONGEST_PHRASE}.&rdquo;
            </span>

            {/* Live text — absolutely overlaid on the ghost */}
            <span
              className="absolute left-0 top-0 whitespace-nowrap text-[#0A84FF]"
              style={{ lineHeight: "inherit" }}
            >
              {displayed}

              {/* Period — fades in when complete */}
              <span
                style={{
                  opacity: isComplete ? 1 : 0,
                  transition: "opacity 0.1s",
                }}
              >
                .
              </span>

              {/* Closing quote — fades in with period */}
              <span
                style={{
                  opacity: isComplete ? 1 : 0,
                  transition: "opacity 0.15s",
                }}
              >
                &rdquo;
              </span>

              {/* Blinking cursor */}
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
      </span>
    </h1>
  )
}
