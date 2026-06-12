import Image from "next/image";
import Link from "next/link";

interface HomeBidsLogoProps {
  /**
   * Visual height of the wordmark in any valid CSS value.
   * Width scales automatically from the 1094×323 cropped canvas (aspect 3.384:1).
   */
  height?: string;
  /** Wrap in a <Link href="/">. Defaults to true. */
  linked?: boolean;
  className?: string;
}

/**
 * Single source-of-truth HomeBids wordmark.
 * The PNG is pre-cropped — no padding, no clipping tricks needed.
 * Import only this wherever the logo appears.
 */
export function HomeBidsLogo({
  height = "clamp(28px, 4vw, 40px)",
  linked = true,
  className = "",
}: HomeBidsLogoProps) {
  const img = (
    <Image
      src="/images/homebids-wordmark.png"
      alt="HomeBids"
      width={1094}
      height={323}
      className={`pointer-events-none select-none ${className}`}
      style={{ height, width: "auto" }}
      priority
      draggable={false}
    />
  );

  if (!linked) {
    return (
      <span aria-label="HomeBids" role="img" className="inline-flex items-center">
        {img}
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
      {img}
    </Link>
  );
}
