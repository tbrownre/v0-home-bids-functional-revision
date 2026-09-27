import Link from "next/link";

/**
 * Contractor Landing Page — shared copy + demo link (Tim, Sep 27).
 * One source of truth so every Pro benefit list says the same thing.
 * Terminology is fixed: "Contractor Landing Page" / "Your own contractor landing page".
 */
export const LANDING_PAGE_FEATURE_TITLE = "Your own contractor landing page";
export const LANDING_PAGE_FEATURE_DESC =
  "A professional HomeBids-powered page customers can use to learn about your business, start a project, and contact you directly.";
export const LANDING_PAGE_DEMO_URL = "https://www.homebids.ai/pro/demo-pro-page";
export const LANDING_PAGE_DEMO_LABEL = "View contractor page demo \u2192";

/** "View contractor page demo →" — always opens in a new tab so the contractor keeps their place. */
export function LandingPageDemoLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href={LANDING_PAGE_DEMO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-sm font-semibold text-primary hover:underline ${className}`.trim()}
    >
      {LANDING_PAGE_DEMO_LABEL}
    </Link>
  );
}
