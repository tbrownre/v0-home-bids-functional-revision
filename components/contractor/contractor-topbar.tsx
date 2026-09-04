"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Eye, MessageCircle, UserCog } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { contractorNavItems } from "@/lib/navigation";
import { getMockUser, mockSignOut, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getContractorSmsLink } from "@/lib/sms-config";
import { timeAgo } from "@/lib/proposal-format";
import {
  useContractorSignals,
  unansweredThreads,
  profileCompletion,
  PROFILE_FIELD_LABELS,
} from "@/lib/use-contractor-signals";

interface Note {
  id: string;
  icon: "message" | "view" | "profile";
  title: string;
  detail: string;
  href: string;
}

const ICON_STYLE = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full";

export function ContractorTopbar() {
  const pathname = usePathname() ?? "";
  const signals = useContractorSignals();

  const [name, setName] = useState("there");
  useEffect(() => {
    (async () => {
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (user?.firstName) setName(user.firstName);
    })();
  }, []);

  const initial = name.charAt(0).toUpperCase() || "T";

  // ── Build the notification feed from real data ──────────────────────────────
  const notes = useMemo<Note[]>(() => {
    const out: Note[] = [];

    for (const t of unansweredThreads(signals.threads).slice(0, 4)) {
      out.push({
        id: `msg-${t.job_ref}`,
        icon: "message",
        title: t.display_name ? `New message from ${t.display_name}` : "New homeowner message",
        detail: [t.title, t.last_message].filter(Boolean).join(" • "),
        href: "/contractors/messages",
      });
    }

    for (const p of signals.proposals.filter((p) => p.first_viewed_at).slice(0, 4)) {
      out.push({
        id: `view-${p.id}`,
        icon: "view",
        title: p.homeowner_name ? `Bid viewed by ${p.homeowner_name}` : "Your bid was viewed",
        detail: [p.project_title, timeAgo(p.last_viewed_at ?? p.first_viewed_at)].filter(Boolean).join(" • "),
        href: "/contractors/bids-history",
      });
    }

    const { missing } = profileCompletion(signals.profile);
    if (signals.loaded && missing.length > 0) {
      out.push({
        id: "profile-gaps",
        icon: "profile",
        title: `Profile needs ${missing.length} more item${missing.length === 1 ? "" : "s"}`,
        detail: `Add ${missing.slice(0, 2).map((k) => PROFILE_FIELD_LABELS[k]).join(", ")}${missing.length > 2 ? "…" : ""}`,
        href: "/contractors/profile",
      });
    }

    return out;
  }, [signals]);

  const hasNotes = notes.length > 0;

  // ── Popover open/close ──────────────────────────────────────────────────────
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (bellRef.current && !bellRef.current.contains(t)) setBellOpen(false);
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    setBellOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/contractors/dashboard" className="flex shrink-0 items-center" aria-label="HomeBids dashboard">
          <HomeBidsLogo size="20px" linked={false} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Primary">
          {contractorNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
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
          {/* Bell */}
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => { setBellOpen((o) => !o); setMenuOpen(false); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
              aria-expanded={bellOpen}
            >
              <Bell className="h-5 w-5" />
              {hasNotes && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-background bg-primary" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-[52px] w-[320px] rounded-2xl border border-border bg-background p-2 shadow-xl">
                <h3 className="px-2.5 py-2 text-base font-bold text-foreground">Notifications</h3>
                {hasNotes ? (
                  notes.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted"
                      onClick={() => setBellOpen(false)}
                    >
                      <span
                        className={`${ICON_STYLE} ${
                          n.icon === "message"
                            ? "bg-primary/10 text-primary"
                            : n.icon === "view"
                              ? "bg-sky-100 text-sky-600"
                              : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {n.icon === "message" && <MessageCircle className="h-4 w-4" />}
                        {n.icon === "view" && <Eye className="h-4 w-4" />}
                        {n.icon === "profile" && <UserCog className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">{n.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted-foreground">{n.detail}</span>
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="px-2.5 pb-3 pt-1 text-sm text-muted-foreground">
                    You&apos;re all caught up. New activity shows up here.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Avatar menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => { setMenuOpen((o) => !o); setBellOpen(false); }}
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
                  href="/contractors/profile"
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                  onClick={() => setMenuOpen(false)}
                >
                  Account settings
                </Link>
                <a
                  href={getContractorSmsLink("I need help with HomeBids")}
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

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden" aria-label="Primary mobile">
        {contractorNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
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
