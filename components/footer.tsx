"use client";

import Link from "next/link";
import React, { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp, Mail, Phone } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { useContractorLogoHref } from "@/lib/use-contractor-logo-href";
import { COMPANY } from "@/lib/company";

// Flyout group — keeps open while hovering trigger or panel
function FlyoutGroup({ label, items }: { label: string; items: { href?: string; label: string; onClick?: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        {label}
        <ChevronUp
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 rounded-xl border border-border bg-background shadow-lg"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <ul className="min-w-[140px] py-1.5">
            {items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground rounded-md"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground rounded-md"
                    onClick={() => { item.onClick?.(); setOpen(false); }}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const PLATFORM_ITEMS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/homeowners", label: "For Homeowners" },
  { href: "/contractors", label: "For Contractors" },
  { href: "/subscribe", label: "Pricing" },
];
// A2P (Tim, Nov 13 2026): Contact is a real page with the company's details, linked from header and footer.
const COMPANY_ITEMS = [
  { href: "/about", label: "About Us" },
  { href: "/affiliates", label: "Affiliates" },
  { href: "/contact", label: "Contact" },
];
const LEGAL_ITEMS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

/** Legal name + phone + email on every page (no street address here — that lives on /contact). */
function CompanyLine({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground ${className}`} data-hb-footer-company>
      <span className="font-semibold text-foreground">{COMPANY.legalName}</span>
      <a href={`tel:${COMPANY.phoneE164}`} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
        <Phone className="h-3 w-3" aria-hidden /> {COMPANY.phoneDisplay}
      </a>
      <a href={`mailto:${COMPANY.email}`} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
        <Mail className="h-3 w-3" aria-hidden /> {COMPANY.email}
      </a>
    </p>
  );
}

export function Footer() {
  const pathname = usePathname();
  const logoHref = useContractorLogoHref();
  // Hosted proposals (/p/[shareToken]) are standalone, contractor-branded pages
  // and must not show the HomeBids marketing footer.
  if (pathname?.startsWith("/p/")) return null;

  return (
    <footer className="border-t border-border bg-background overflow-visible">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Mobile: stacked centered layout */}
        <div className="flex flex-col items-center gap-4 py-6 sm:hidden">
          <nav className="flex flex-row items-center justify-center gap-5" aria-label="Footer navigation">
            <FlyoutGroup label="Platform" items={PLATFORM_ITEMS} />
            <FlyoutGroup label="Company" items={COMPANY_ITEMS} />
            <FlyoutGroup label="Legal" items={LEGAL_ITEMS} />
          </nav>
          <div className="border-t border-border w-full pt-4 flex flex-col items-center gap-1.5">
            <HomeBidsLogo size="16px" href={logoHref} />
            <CompanyLine />
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
            </p>
          </div>
        </div>

        {/* Desktop: single-line layout */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-y-2 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <HomeBidsLogo size="14px" href={logoHref} />
            <span className="text-muted-foreground/40">|</span>
            <span className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.
            </span>
            <span className="text-muted-foreground/40">|</span>
            <CompanyLine />
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Footer navigation">
            <FlyoutGroup label="Platform" items={PLATFORM_ITEMS} />
            <FlyoutGroup label="Company" items={COMPANY_ITEMS} />
            <FlyoutGroup label="Legal" items={LEGAL_ITEMS} />
          </nav>
        </div>

      </div>
    </footer>
  );
}
