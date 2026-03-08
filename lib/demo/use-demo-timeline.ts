"use client";

/**
 * useDemoTimeline
 *
 * When demo mode is active and `triggered` flips to true, fires a scripted
 * sequence of inbox notifications simulating contractor activity on a newly
 * posted job. Fires only once per component mount — guarded by a ref so
 * React StrictMode double-invocations do not double-fire.
 */

import { useEffect, useRef } from "react";
import { isDemoMode } from "./config";
import { addNotification } from "../inbox-store";

interface UseDemoTimelineOptions {
  /** Set to true when the homeowner reaches the "success" step */
  triggered: boolean;
}

const TIMELINE: Array<{
  delayMs: number;
  notification: Parameters<typeof addNotification>[0];
}> = [
  {
    delayMs: 3000,
    notification: {
      id: `demo-tl-1-${Date.now()}`,
      type: "bid_received",
      title: "Contractors are reviewing your project",
      description:
        "3 local contractors have seen your new job and are preparing bids.",
      timestamp: new Date(),
      read: false,
      jobId: "demo-job-new",
      jobTitle: "Your New Job",
      fromName: "HomeBids",
      href: "/?showJobs=true",
    },
  },
  {
    delayMs: 6000,
    notification: {
      id: `demo-tl-2-${Date.now()}`,
      type: "bid_received",
      title: "New bid received — $4,200",
      description:
        "Austin All-Pro Home Services submitted a bid of $4,200 on your job.",
      timestamp: new Date(),
      read: false,
      jobId: "demo-job-new",
      jobTitle: "Your New Job",
      fromName: "Austin All-Pro Home Services",
      amount: 4200,
      href: "/?showJobs=true",
    },
  },
  {
    delayMs: 10000,
    notification: {
      id: `demo-tl-3-${Date.now()}`,
      type: "bid_received",
      title: "New bid received — $3,800",
      description:
        "Hill Country Pros submitted a competitive bid of $3,800 on your job.",
      timestamp: new Date(),
      read: false,
      jobId: "demo-job-new",
      jobTitle: "Your New Job",
      fromName: "Hill Country Pros",
      amount: 3800,
      href: "/?showJobs=true",
    },
  },
  {
    delayMs: 14000,
    notification: {
      id: `demo-tl-4-${Date.now()}`,
      type: "contractor_message",
      title: "New message from contractor",
      description:
        "Austin All-Pro Home Services sent a message: 'Hi! I had a quick question about the scope — do you have any photos of the area?'",
      timestamp: new Date(),
      read: false,
      jobId: "demo-job-new",
      jobTitle: "Your New Job",
      fromName: "Austin All-Pro Home Services",
      href: "/?showJobs=true",
    },
  },
  {
    delayMs: 18000,
    notification: {
      id: `demo-tl-5-${Date.now()}`,
      type: "bid_received",
      title: "New bid received — $4,600",
      description:
        "Premier Home Repairs submitted a bid of $4,600 on your job.",
      timestamp: new Date(),
      read: false,
      jobId: "demo-job-new",
      jobTitle: "Your New Job",
      fromName: "Premier Home Repairs",
      amount: 4600,
      href: "/?showJobs=true",
    },
  },
];

export function useDemoTimeline({ triggered }: UseDemoTimelineOptions) {
  const firedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!isDemoMode()) return;
    if (!triggered) return;
    if (firedRef.current) return;

    firedRef.current = true;

    for (const { delayMs, notification } of TIMELINE) {
      const id = setTimeout(() => {
        // Re-stamp timestamp and id at fire time so they appear "just now"
        addNotification(
          {
            ...notification,
            id: `${notification.id}-${Date.now()}`,
            timestamp: new Date(),
          },
          false, // homeowner persona
        );
      }, delayMs);
      timersRef.current.push(id);
    }

    return () => {
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggered]);
}
