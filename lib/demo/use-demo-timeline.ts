"use client";

import { useEffect, useRef } from "react";
import { addDemoNotification } from "@/lib/inbox-store";

/**
 * useDemoTimeline — fires scripted inbox notifications after a homeowner
 * "posts" their demo job, simulating contractor activity in real-time.
 *
 * Pass `triggered=true` when the form reaches the success state.
 * The timeline fires only once per page session (tracked via useRef).
 */
export function useDemoTimeline(triggered: boolean) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!triggered || hasFired.current) return;
    hasFired.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        addDemoNotification({
          id: `demo-tl-1-${Date.now()}`,
          type: "bid_received",
          title: "Contractors are reviewing your project",
          description: "3 local contractors are reviewing your job post right now.",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-new",
          jobTitle: "Your new job",
          fromName: "HomeBids",
          href: "/",
        });
      }, 3000)
    );

    timers.push(
      setTimeout(() => {
        addDemoNotification({
          id: `demo-tl-2-${Date.now()}`,
          type: "bid_received",
          title: "New bid received — $4,200",
          description: "Hill Country Tile & Stone submitted a bid of $4,200 on your job.",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-new",
          jobTitle: "Your new job",
          fromName: "Hill Country Tile & Stone",
          amount: 4200,
          href: "/",
        });
      }, 6000)
    );

    timers.push(
      setTimeout(() => {
        addDemoNotification({
          id: `demo-tl-3-${Date.now()}`,
          type: "bid_received",
          title: "New bid received — $3,800",
          description: "ProFix Home Services submitted a bid of $3,800 on your job.",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-new",
          jobTitle: "Your new job",
          fromName: "ProFix Home Services",
          amount: 3800,
          href: "/",
        });
      }, 10000)
    );

    timers.push(
      setTimeout(() => {
        addDemoNotification({
          id: `demo-tl-4-${Date.now()}`,
          type: "contractor_message",
          title: "New message from contractor",
          description: "Hill Country Tile & Stone: 'Hi! Quick question about the tile pattern you had in mind...'",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-new",
          jobTitle: "Your new job",
          fromName: "Hill Country Tile & Stone",
          href: "/",
        });
      }, 14000)
    );

    timers.push(
      setTimeout(() => {
        addDemoNotification({
          id: `demo-tl-5-${Date.now()}`,
          type: "bid_received",
          title: "New bid received — $4,600",
          description: "Austin Tile Masters submitted a bid of $4,600 on your job.",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-new",
          jobTitle: "Your new job",
          fromName: "Austin Tile Masters",
          amount: 4600,
          href: "/",
        });
      }, 18000)
    );

    return () => timers.forEach(clearTimeout);
  }, [triggered]);
}
