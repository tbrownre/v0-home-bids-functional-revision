"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Contractor Landing Page — shared copy + demo link (Tim, Sep 27).
 * One source of truth so every Pro benefit list says the same thing.
 * Terminology is fixed: "Contractor Landing Page" / "Your own contractor landing page".
 *
 * Oct 6 (Tim): once the contractor's OWN page exists, the demo link must disappear —
 * it becomes "View My Contractor Page →" pointing at their live page.
 */
export const LANDING_PAGE_FEATURE_TITLE = "Your own contractor landing page";
export const LANDING_PAGE_FEATURE_DESC =
  "A professional HomeBids-powered page customers can use to learn about your business, start a project, and contact you directly.";
export const LANDING_PAGE_DEMO_URL = "https://www.homebids.ai/pro/demo-pro-page";
export const LANDING_PAGE_DEMO_LABEL = "View contractor page demo \u2192";

/** Demo link for contractors with no page yet; their real page once it exists. */
export function LandingPageDemoLink({ className = "" }: { className?: string }) {
  const [ownUrl, setOwnUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) return;
        const { getContractorProfile } = await import("@/lib/supabase/actions");
        const res = await getContractorProfile();
        const url = String((res as { profile?: { landing_page_url?: string | null } | null })?.profile?.landing_page_url ?? "").trim();
        if (!cancelled && url) setOwnUrl(url.startsWith("http") ? url : `https://${url}`);
      } catch {
        /* signed-out / homeowner — demo link stays */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <Link
      href={ownUrl || LANDING_PAGE_DEMO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-sm font-semibold text-primary hover:underline ${className}`.trim()}
    >
      {ownUrl ? "View My Contractor Page \u2192" : LANDING_PAGE_DEMO_LABEL}
    </Link>
  );
}
