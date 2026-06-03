"use client"

import { useEffect, useRef, useState } from "react"

const SUGGESTIONS = [
  "kitchen remodel",
  "roof repair",
  "bathroom renovation",
  "AC replacement",
  "house painting",
  "flooring install",
  "water heater leak",
  "pool resurfacing",
  "cabinet refinishing",
  "window replacement",
]

const TYPE_SPEED = 55      // ms per character typed
const DELETE_SPEED = 30    // ms per character deleted
const PAUSE_AFTER = 1800   // ms to hold the complete phrase
const PAUSE_BEFORE = 300   // ms before starting to type next

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
    const id = setInterval(() => setCursorVisible((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  // Typewriter state machine
  useEffect(() => {
    if (prefersReducedMotion.current) {
      setDisplayed(SUGGESTIONS[0])
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

  return (
    <h1 className="text-4xl font-bold leading-[1.3] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
      <span className="block text-muted-foreground text-2xl font-semibold tracking-normal sm:text-3xl lg:text-4xl mb-2">
        Hey HomeBids, I need help with
      </span>
      {/* Fixed-height container prevents layout shift */}
      <span
        className="block min-h-[1.3em]"
        aria-label={`Hey HomeBids, I need help with ${SUGGESTIONS[index]}`}
        aria-live="polite"
      >
        <span className="text-[#0A84FF]">{displayed}</span>
        <span
          aria-hidden="true"
          className="inline-block w-[3px] translate-y-[1px] rounded-sm bg-[#0A84FF] align-middle"
          style={{
            height: "0.85em",
            opacity: cursorVisible ? 1 : 0,
            transition: "opacity 0.1s",
          }}
        />
      </span>
    </h1>
  )
}
