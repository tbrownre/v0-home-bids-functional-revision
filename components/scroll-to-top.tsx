"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const scrollTargetsRef = useRef<(Element | Window)[]>([]);
  const anchorRef = useRef<HTMLDivElement>(null);

  const getScrollTop = useCallback(() => {
    return Math.max(
      window.scrollY || 0,
      document.documentElement?.scrollTop || 0,
      document.body?.scrollTop || 0,
      ...scrollTargetsRef.current.map((el) =>
        el instanceof Window ? el.scrollY : el.scrollTop
      )
    );
  }, []);

  const scrollToTop = useCallback(() => {
    // Scroll all possible targets
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* noop */ }
    try { document.documentElement.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* noop */ }
    try { document.body.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* noop */ }
    for (const el of scrollTargetsRef.current) {
      try {
        if (el instanceof Window) {
          el.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          el.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch { /* noop */ }
    }
  }, []);

  useEffect(() => {
    // Find all scrollable ancestors from our anchor element
    const targets: (Element | Window)[] = [window];
    let current: Element | null = anchorRef.current;
    while (current) {
      const style = window.getComputedStyle(current);
      const oy = style.overflowY;
      if (
        (oy === "auto" || oy === "scroll" || oy === "overlay") &&
        current.scrollHeight > current.clientHeight
      ) {
        targets.push(current);
      }
      current = current.parentElement;
    }
    // Also check body and documentElement explicitly
    if (document.body.scrollHeight > document.body.clientHeight) {
      targets.push(document.body);
    }
    if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
      targets.push(document.documentElement);
    }
    scrollTargetsRef.current = targets;

    const toggleVisibility = () => {
      setIsVisible(getScrollTop() > 200);
    };

    toggleVisibility();

    // Attach scroll listener to all targets
    for (const el of targets) {
      el.addEventListener("scroll", toggleVisibility, { passive: true });
    }

    // Also poll briefly in case scroll events don't fire (some iframes)
    const interval = setInterval(toggleVisibility, 500);

    return () => {
      for (const el of targets) {
        el.removeEventListener("scroll", toggleVisibility);
      }
      clearInterval(interval);
    };
  }, [getScrollTop]);

  return (
    <>
      <div ref={anchorRef} className="pointer-events-none absolute h-0 w-0" aria-hidden="true" />
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
