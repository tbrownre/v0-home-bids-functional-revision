import Image from "next/image";
import Link from "next/link";

interface HomeBidsLogoProps {
  /**
   * Height of the *visible wordmark artwork* in CSS units.
   * The source PNG (966×499) has ~37% transparent padding top/bottom
   * and ~27% left/right. We render the full canvas at the correct
   * scale and clip it so only the artwork is visible.
   *
   * Measured ratios:
   *   - Visible text height = 26% of canvas height  → scale = 1/0.26 = 3.846×
   *   - Visible text width  = 46% of canvas width   → aspect = 3.42:1
   *   - Canvas aspect ratio = 966/499 = 1.936
   *   - Full rendered canvas width = height × 3.846 × 1.936 = height × 7.446
   *   - top  offset = −(3.846 − 1) / 2 × height = −1.423 × height
   *   - left offset = −(7.446 − 3.42) / 2 × height = −2.013 × height
   */
  height?: string;
  /** Wrap in a <Link href="/">. Defaults to true. */
  linked?: boolean;
  className?: string;
}

/**
 * Single source-of-truth HomeBids wordmark component.
 * Import this — and only this — wherever the logo appears.
 */
export function HomeBidsLogo({
  height = "clamp(36px, 5vw, 52px)",
  linked = true,
  className = "",
}: HomeBidsLogoProps) {
  const inner = (
    <span
      className={`inline-block overflow-hidden pointer-events-none select-none ${className}`}
      style={{
        height,
        width:    `calc(${height} * 3.42)`,
        position: "relative",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/homebids-wordmark.png"
        alt="HomeBids"
        width={966}
        height={499}
        className="absolute"
        style={{
          height:   `calc(${height} * 3.846)`,
          width:    "auto",
          top:      `calc(${height} * -1.423)`,
          left:     `calc(${height} * -2.013)`,
          maxWidth: "none",
        }}
        priority
        draggable={false}
      />
    </span>
  );

  if (!linked) {
    return (
      <span
        aria-label="HomeBids"
        role="img"
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link
      href="/"
      aria-label="Go to HomeBids homepage"
      className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {inner}
    </Link>
  );
}

