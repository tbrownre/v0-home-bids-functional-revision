import Image from "next/image";
import Link from "next/link";

interface HomeBidsLogoProps {
  /** Rendered height via CSS clamp — defaults to the same clamp used in the main Header. */
  height?: string;
  /** If true, wraps in a <Link href="/">. Defaults to true. */
  linked?: boolean;
  className?: string;
}

/**
 * Single shared HomeBids wordmark logo.
 * Used in Header, AdminDemoLayout, SignInPage, and anywhere else the logo appears.
 */
export function HomeBidsLogo({
  height = "clamp(54px, 11vw, 88px)",
  linked = true,
  className = "",
}: HomeBidsLogoProps) {
  const img = (
    <Image
      src="/images/homebids-wordmark.png"
      alt="HomeBids"
      width={480}
      height={120}
      className={`w-auto object-contain pointer-events-none ${className}`}
      style={{ height, mixBlendMode: "multiply" }}
      priority
    />
  );

  if (!linked) return img;

  return (
    <Link
      href="/"
      aria-label="Go to HomeBids homepage"
      className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {img}
    </Link>
  );
}
