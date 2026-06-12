import Image from "next/image";
import Link from "next/link";

interface HomeBidsLogoProps {
  /**
   * Height of the *visible wordmark artwork* in any valid CSS unit.
   *
   * PNG canvas: 966 × 499 px
   * Measured visible artwork bounds:
   *   left  ~27%  right  ~73%  → text width  = 46% of 966 = ~445 px
   *   top   ~33%  bottom ~66%  → text height = 33% of 499 = ~165 px
   *   visible aspect ratio     = 445 / 165 ≈ 2.70
   *   canvas aspect ratio      = 966 / 499 ≈ 1.936
   *
   * Derived multipliers (height = desired visual height H):
   *   canvas rendered height   = H / 0.33  = H × 3.030
   *   canvas rendered width    = H × 3.030 × 1.936 = H × 5.866
   *   top  offset = −((3.030 − 1) / 2) × H = −1.015 × H
   *   left offset = −(0.27 × 5.866) × H    = −1.584 × H
   *   wrapper width            = H × 2.70
   */
  height?: string;
  /** Wrap in a <Link href="/">. Defaults to true. */
  linked?: boolean;
  className?: string;
}

/**
 * Single source-of-truth HomeBids wordmark component.
 * Import ONLY this wherever the logo appears — never reference the PNG directly.
 */
export function HomeBidsLogo({
  height = "clamp(40px, 5.5vw, 56px)",
  linked = true,
  className = "",
}: HomeBidsLogoProps) {
  const inner = (
    <span
      className={`inline-block overflow-hidden pointer-events-none select-none ${className}`}
      style={{
        height,
        width:      `calc(${height} * 2.70)`,
        position:   "relative",
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
          height:   `calc(${height} * 3.030)`,
          width:    "auto",
          top:      `calc(${height} * -1.015)`,
          left:     `calc(${height} * -1.584)`,
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
