"use client";

import { useState } from "react";

/**
 * Contractor avatar for the public proposal header.
 * Renders the logo when a URL is present and loads; on missing URL or load
 * error it falls back to the company initials in the same 56px rounded tile.
 */
export function ContractorAvatar({
  logoUrl,
  companyName,
}: {
  logoUrl?: string | null;
  companyName?: string | null;
}) {
  const [errored, setErrored] = useState(false);
  const initials = (companyName ?? "HB").slice(0, 2).toUpperCase();

  if (logoUrl && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl || "/placeholder.svg"}
        alt={`${companyName ?? "Contractor"} logo`}
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
      {initials}
    </div>
  );
}
