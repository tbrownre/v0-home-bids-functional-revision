import Image from "next/image";
import Link from "next/link";

interface HomeBidsLogoProps {
  /**
   * Height of the *visible artwork* (not the raw image canvas).
   * The source PNG has ~30% transparent padding on every side; we use a
   * clipping wrapper + negative margins so only the wordmark is visible.
   */
  height?: string;
  /** If true, wraps in a <Link href="/">. Defaults to true. */
  linked?: boolean;
  className?: string;
}

/**
 * Single shared HomeBids wordmark logo.
 *
 * The source PNG (966×499) has large transparent padding — the visible
 * wordmark occupies roughly the middle 45% of the canvas height and 55%
 * of the canvas width.
 *
 * Strategy: render the image at 2.4× the desired visual height, then
 * clip to just the artwork using overflow-hidden on the outer div.
 *
 * Used in Header, AdminDemoLayout, SignInPage, Footer, GatewayLanding —
 * one component, one source of truth.
 */
export function HomeBidsLogo({
  height = "clamp(22px, 4vw, 34px)",
  linked = true,
  className = "",
}: HomeBidsLogoProps) {
  // The visible text occupies ~44% of the PNG's height and ~56% of its width.
  // To show text at `height`, the full PNG must be rendered at height/0.44.
  // We clip with overflow-hidden and center-crop using negative margins.
  const img = (
    <span
      className={`inline-block overflow-hidden pointer-events-none ${className}`}
      style={{
        height,
        // Width = height × (aspect of visible text ≈ 4.2)
        width: `calc(${height} * 4.2)`,
        position: "relative",
      }}
      aria-hidden="true"
    >
      <Image
        src="/images/homebids-wordmark.png"
        alt="HomeBids"
        width={966}
        height={499}
        className="absolute object-contain"
        style={{
          // Render full canvas at 1/0.44 = ~2.27× desired height
          height: `calc(${height} * 2.27)`,
          width: "auto",
          // Center vertically: offset = -(fullHeight - visibleHeight) / 2 = -(1.27/2 × height)
          top: `calc(${height} * -0.635)`,
          // Center horizontally: visible text starts ~22% from left
          left: `calc(${height} * -1.0)`,
        }}
        priority
      />
    </span>
  );

  if (!linked) {
    return (
      <span aria-label="HomeBids" role="img" style={{ display: "inline-flex", alignItems: "center" }}>
        {img}
      </span>
    );
  }

  return (
    <Link
      href="/"
      aria-label="Go to HomeBids homepage"
      className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {img}
    </Link>
  );
}
