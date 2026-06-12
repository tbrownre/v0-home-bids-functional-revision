import Link from "next/link";

interface HomeBidsLogoProps {
  /**
   * Font-size of the wordmark. Width is determined naturally by the text.
   * Defaults to a responsive clamp suitable for the main header.
   */
  size?: string;
  /** Wrap in a <Link href="/">. Defaults to true. */
  linked?: boolean;
  className?: string;
}

/**
 * HomeBids wordmark — pure CSS, no image required.
 * "HOME" in brand blue, "BIDS" in near-black, bold, uppercase,
 * tight letter-spacing, transparent background.
 */
export function HomeBidsLogo({
  size = "clamp(20px, 3vw, 28px)",
  linked = true,
  className = "",
}: HomeBidsLogoProps) {
  const wordmark = (
    <span
      className={`select-none pointer-events-none inline-flex items-baseline leading-none ${className}`}
      aria-hidden="true"
      style={{
        fontFamily: "'Red Hat Display', system-ui, sans-serif",
        fontSize: size,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      <span style={{ color: "#2B7FE8", fontWeight: 800 }}>HOME</span>
      <span style={{ color: "#0D0D0D", fontWeight: 400 }}>BIDS</span>
    </span>
  );

  if (!linked) {
    return (
      <span
        aria-label="HomeBids"
        role="img"
        className="inline-flex items-center"
      >
        {wordmark}
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
      {wordmark}
    </Link>
  );
}
