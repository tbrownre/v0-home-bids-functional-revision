"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { getMockUser, mockSignOut, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getSmsLink } from "@/lib/sms-config";

/**
 * Homeowner topbar — same visual pattern as ContractorTopbar (sticky, logo,
 * centered nav, avatar menu) but with homeowner nav items and no contractor
 * notification feed. "My Projects" points at the dashboard, which is the
 * homeowner's project list.
 */

interface HomeownerNavItem {
  label: string;
  href: string;
}

const NAV: HomeownerNavItem[] = [
  { label: "Dashboard", href: "/homeowners/dashboard" },
  { label: "My Projects", href: "/homeowners/dashboard" },
];

export function HomeownerTopbar() {
  const pathname = usePathname() ?? "";

  const [name, setName] = useState("there");
  useEffect(() => {
    (async () => {
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (user?.firstName) setName(user.firstName);
    })();
  }, []);

  const initial = name.charAt(0).toUpperCase() || "H";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // De-duplicate nav items that resolve to the same href.
  const seen = new Set<string>();
  const navItems = NAV.filter((i) => {
    if (seen.has(i.href)) return false;
    seen.add(i.href);
    return true;
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <Link href="/homeowners/dashboard" className="flex shrink-0 items-center" aria-label="HomeBids dashboard">
          <HomeBidsLogo size="20px" linked={false} />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1 md:flex-none">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 items-center gap-2 rounded-xl px-2 transition-colors hover:bg-muted"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
                {initial}
              </span>
              <span className="hidden text-sm font-semibold text-foreground sm:inline">{name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[52px] w-56 rounded-2xl border border-border bg-background p-1.5 shadow-xl">
                <Link
                  href="/profile"
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  Account settings
                </Link>
                <a
                  href={getSmsLink("I need help with HomeBids")}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  Help &amp; support
                </a>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); mockSignOut(); }}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden" aria-label="Primary mobile">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                active ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
