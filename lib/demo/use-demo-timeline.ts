"use client";

import { useEffect, useRef } from "react";
import { addNotification, type InboxNotification } from "@/lib/inbox-store";

/**
 * Fires a scripted sequence of inbox notifications after a demo job is posted.
 * Each notification simulates real contractor activity to make the demo feel live.
 * Fires only once per session (guarded by a ref).
 */
export function useDemoTimeline(triggered: boolean) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!triggered || hasFired.current) return;
    hasFired.current = true;

    const events: Array<{ delay: number; notification: InboxNotification }> = [
      {
        delay: 3000,
        notification: {
          id: `demo-tl-${Date.now()}-1`,
          type: "bid_viewed",
          title: "3 contractors are reviewing your project",
          description: "Your job has been seen by 3 local contractors in the last 2 minutes.",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-1",
          jobTitle: "Your new job",
          fromName: "HomeBids",
          href: "/",
        },
      },
      {
        delay: 7000,
        notification: {
          id: `demo-tl-${Date.now()}-2`,
          type: "bid_received",
          title: "New bid received — $4,200",
          description: "Austin Pro Roofing & HVAC submitted a bid of $4,200 on your job. Timeline: 1 week.",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-1",
          jobTitle: "Your new job",
          fromName: "Austin Pro Roofing & HVAC",
          amount: 4200,
          href: "/",
        },
      },
      {
        delay: 12000,
        notification: {
          id: `demo-tl-${Date.now()}-3`,
          type: "bid_received",
          title: "New bid received — $3,800",
          description: "Hill Country Contractors submitted a competing bid of $3,800. You now have 2 bids to compare.",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-1",
          jobTitle: "Your new job",
          fromName: "Hill Country Contractors",
          amount: 3800,
          href: "/",
        },
      },
      {
        delay: 16000,
        notification: {
          id: `demo-tl-${Date.now()}-4`,
          type: "contractor_message",
          title: "New message from a contractor",
          description: "Austin Pro Roofing & HVAC: 'Hi! Quick question — is there any existing ductwork we should know about?'",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-1",
          jobTitle: "Your new job",
          fromName: "Austin Pro Roofing & HVAC",
          href: "/inbox",
        },
      },
      {
        delay: 20000,
        notification: {
          id: `demo-tl-${Date.now()}-5`,
          type: "bid_received",
          title: "New bid received — $4,600",
          description: "Lone Star Home Services submitted a bid of $4,600. You now have 3 bids — ready to compare and choose.",
          timestamp: new Date(),
          read: false,
          jobId: "demo-job-1",
          jobTitle: "Your new job",
          fromName: "Lone Star Home Services",
          amount: 4600,
          href: "/",
        },
      },
    ];

    const timers = events.map(({ delay, notification }) =>
      setTimeout(() => addNotification(notification, false), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [triggered]);
}
