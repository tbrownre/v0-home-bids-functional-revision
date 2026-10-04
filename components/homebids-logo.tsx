import Link from "next/link";
import { HOMEBIDS_LOGO_PNG } from "@/lib/brand/logo-png";

interface HomeBidsLogoProps {
  /**
   * Size of the wordmark, as the font-size the old text wordmark used (any CSS length, clamp() ok).
   * The artwork's height is ~0.72× this so every existing call site keeps its visual size.
   */
  size?: string;
  /** Wrap in a <Link>. Defaults to true. */
  linked?: boolean;
  /** Destination href when linked. Defaults to "/". */
  href?: string;
  className?: string;
}

const LOGO_SRC = "/brand/homebids-logo.png"; // the official file (transparent), same pixels as lib/brand/logo-png.ts

/**
 * HomeBids wordmark — the OFFICIAL logo file (Tim, Oct 4 2026), not CSS text.
 * Header, footer, topbars, auth pages and the link-preview cards all draw this same image.
 */
export function HomeBidsLogo({
  size = "clamp(20px, 3vw, 28px)",
  linked = true,
  href = "/",
  className = "",
}: HomeBidsLogoProps) {
  const h = `calc(${size} * 0.72)`;
  const wordmark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="HomeBids"
      width={HOMEBIDS_LOGO_PNG.width}
      height={HOMEBIDS_LOGO_PNG.height}
      draggable={false}
      className={`select-none pointer-events-none block shrink-0 ${className}`}
      style={{ height: h, width: "auto" }}
    />
  );

  if (!linked) {
    return <span className="inline-flex items-center">{wordmark}</span>;
  }

  return (
    <Link
      href={href}
      aria-label={href === "/" ? "Go to HomeBids homepage" : "Go to dashboard"}
      className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {wordmark}
    </Link>
  );
}
