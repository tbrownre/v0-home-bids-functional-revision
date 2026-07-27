"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, FileText, Briefcase, HelpCircle, LogIn, LogOut, Home, ArrowLeft, MessageCircle, Hammer, PlusCircle, LayoutDashboard, Sparkles, Users, Wrench, Search } from "lucide-react";
import { homeownerNavItems, loggedOutNavItems, contractorNavItems } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useSignInModal } from "@/components/sign-in-modal-provider";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { useContractorLogoHref } from "@/lib/use-contractor-logo-href";
import {
  subscribeInbox,
  getHomeownerUnreadSnapshot,
  getContractorUnreadSnapshot,
  hydrateNotifications,
  type NotificationType,
} from "@/lib/inbox-store";
import { createClient } from "@/lib/supabase/client";
import { getMockUser, mockSignOut, syncMirrorFromSupabase } from "@/lib/mock-auth";

export interface HeaderProps {
  isContractor?: boolean;
  isSignedIn?: boolean;
  backHref?: string;
  backLabel?: string;
  onSignIn?: () => void;
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case "bid_received":
    case "bid_updated":
      return "bg-blue-100 text-blue-600";
    case "bid_accepted":
    case "job_milestone":
      return "bg-green-100 text-green-600";
    case "bid_not_selected":
      return "bg-gray-100 text-gray-500";
    case "bid_viewed":
      return "bg-purple-100 text-purple-600";
    case "contractor_message":
    case "homeowner_message":
      return "bg-primary/10 text-primary";
    case "payment_released":
      return "bg-emerald-100 text-emerald-600";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function Header({
  isContractor: isContractorProp = false,
  isSignedIn: isSignedInProp = false,
  backHref,
  backLabel,
  onSignIn,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openSignIn } = useSignInModal();
  const logoHref = useContractorLogoHref();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const closeMenu = () => {
    setMenuOpen(false);
    (document.activeElement as HTMLElement)?.blur();
  };

  // Close on route change
  useEffect(() => { closeMenu(); }, [pathname]);

  // Close when tab loses focus
  useEffect(() => {
    const handler = () => { if (document.hidden) closeMenu(); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // Auth state — safe initial values match server render
  const [isSignedIn, setIsSignedIn] = useState(isSignedInProp);
  const [isContractor, setIsContractor] = useState(isContractorProp);
  const isLoggedIn = isContractor || isSignedIn;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Instant paint from the local session mirror — prevents auth-state flash.
    const cached = getMockUser();
    if (cached) {
      setIsSignedIn(cached.role !== "contractor");
      setIsContractor(cached.role === "contractor");
    }

    // Reconcile with the real Supabase session and keep it in sync.
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const isC = session.user.user_metadata?.user_type === "contractor";
          setIsSignedIn(!isC);
          setIsContractor(isC);
        } else {
          setIsSignedIn(false);
          setIsContractor(false);
        }
      });
      subscription = data.subscription;
    } catch {
      // no-op
    }
    // Clear any stale mirror if the real session has expired/ended.
    void syncMirrorFromSupabase();
    return () => subscription?.unsubscribe();
  }, []);

  // Unread badge — server snapshot is always 0 to prevent hydration mismatch
  const unreadSnapshot = useSyncExternalStore(
    subscribeInbox,
    isContractor ? getContractorUnreadSnapshot : getHomeownerUnreadSnapshot,
    () => 0,
  );
  const unreadCount = mounted && isLoggedIn ? unreadSnapshot : 0;

  // Hydrate notifications on mount for signed-in users
  useEffect(() => {
    if (!mounted || !isLoggedIn) return;
    async function hydrate() {
      try {
        const { getNotificationsFeed } = await import("@/lib/supabase/actions");
        const { notifications } = await getNotificationsFeed();
        hydrateNotifications(notifications, isContractor);
      } catch (e) {
        console.error("[Header] Failed to hydrate notifications:", e);
      }
    }
    hydrate();
  }, [mounted, isLoggedIn, isContractor]);

  const handleSignOut = () => {
    closeMenu();
    // Ends the real Supabase session, clears the mirror, and redirects home.
    mockSignOut();
  };

  // Audience preference — for switching between homeowner and contractor experiences
  const [audience, setAudience] = useState<"homeowner" | "contractor" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("homebids_audience") as "homeowner" | "contractor" | null;
    setAudience(stored);
  }, [pathname]);

  const handleAudienceSwitch = (next: "homeowner" | "contractor") => {
    localStorage.setItem("homebids_audience", next);
    setAudience(next);
    closeMenu();
    window.location.href = next === "homeowner" ? "/homeowners" : "/contractors";
  };

  // Determine active contractor tab from search param so only one item highlights
  const activeContractorTab = searchParams?.get("tab") ?? "home";

  const menuItemBase = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer";
  const menuItemActive = "bg-primary/10 text-primary font-medium";
  const separator = "my-1 border-t border-border";

  return (
    <header className="relative shrink-0 border-b border-border bg-background">
      <div className="mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 md:px-5">

        {/* Left: hamburger trigger — wrapped in a relative container so the
            panel can be anchored to THIS element, not the header edge */}
        <div className="relative flex items-center">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Menu${unreadCount > 0 ? ` (${unreadCount} notifications)` : ""}`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Menu className="h-5 w-5" />
            {isLoggedIn && unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel — anchored to the trigger container */}
          {menuOpen && (
            <div
              ref={panelRef}
              role="menu"
              className="absolute left-0 top-[calc(100%+6px)] z-[200] w-56 rounded-xl border border-border bg-background shadow-xl ring-1 ring-black/5"
              style={{ padding: "6px" }}
            >
              {/* Signed-out nav */}
              {!isLoggedIn && (
                <>
                  {loggedOutNavItems.map((item) => {
                    const hrefPath = item.href.split("?")[0];
                    const isActive = hrefPath === "/" ? pathname === "/" : pathname.startsWith(hrefPath);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        role="menuitem"
                        className={`${menuItemBase} ${isActive ? menuItemActive : ""}`}
                        onClick={closeMenu}
                      >
                        {item.label === "Home"         && <Home       className="h-4 w-4 shrink-0" />}
                        {item.label === "How It Works" && <HelpCircle className="h-4 w-4 shrink-0" />}
                        {item.label === "Services"     && <Briefcase  className="h-4 w-4 shrink-0" />}
                        {item.label === "Contractors"  && <Hammer     className="h-4 w-4 shrink-0" />}
                        {item.label === "Pricing"      && <FileText   className="h-4 w-4 shrink-0" />}
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className={separator} />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); openSignIn(); }}
                    className={menuItemBase}
                  >
                    <LogIn className="h-4 w-4 shrink-0" />
                    Contractor Sign In
                  </button>
                  {/* Audience switcher — only shown after a selection has been made */}
                  {mounted && audience && (
                    <>
                      <div className={separator} />
                      {audience === "homeowner" ? (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleAudienceSwitch("contractor")}
                          className={menuItemBase}
                        >
                          <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">Switch to Contractor</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleAudienceSwitch("homeowner")}
                          className={menuItemBase}
                        >
                          <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">Switch to Homeowner</span>
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Homeowner nav — hidden when on contractor routes */}
              {isLoggedIn && !isContractor && !pathname.startsWith("/contractors") && (
                <>
                  {homeownerNavItems.map((item) => {
                    const hrefPath = item.href.split("?")[0];
                    const isActive =
                      (hrefPath === "/" && pathname === "/") ||
                      (hrefPath !== "/" && pathname.startsWith(hrefPath)) ||
                      (item.match?.some((m) => pathname === m || pathname.startsWith(m + "/")) ?? false);
                    const isInbox = item.match?.includes("/inbox");
                    const isHome = item.label === "Home";
                    return (
                      <React.Fragment key={item.label}>
                        {item.label === "Your Jobs" && <div className={separator} />}
                        <Link
                          href={item.href}
                          role="menuitem"
                          className={`${menuItemBase} ${isActive ? menuItemActive : ""}`}
                          onClick={() => {
                            if (isHome) window.dispatchEvent(new CustomEvent("hb:home"));
                            closeMenu();
                          }}
                        >
                          {item.label === "Home"         && <Home          className="h-4 w-4 shrink-0" />}
                          {item.label === "Services"     && <Briefcase     className="h-4 w-4 shrink-0" />}
                          {item.label === "How It Works" && <HelpCircle    className="h-4 w-4 shrink-0" />}
                          {item.label === "Your Jobs"    && <FileText      className="h-4 w-4 shrink-0" />}
                          {item.label === "Inbox"        && <MessageCircle className="h-4 w-4 shrink-0" />}
                          {item.label === "Profile"      && <Home          className="h-4 w-4 shrink-0" />}
                          {item.label === "New Job"      && <PlusCircle    className="h-4 w-4 shrink-0" />}
                          <span className="flex-1">{item.label}</span>
                          {isInbox && unreadCount > 0 && (
                            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white leading-none">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      </React.Fragment>
                    );
                  })}
                  <div className={separator} />
                  <button type="button" role="menuitem" onClick={handleSignOut} className={`${menuItemBase} text-red-600 hover:text-red-600`}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                  </button>
                </>
              )}

              {/* Contractor nav */}
              {isLoggedIn && isContractor && (
                <>
                  {contractorNavItems.map((item) => {
                    const tabParam = item.href.split("tab=")[1];
                    const isActive = tabParam ? activeContractorTab === tabParam : pathname.startsWith(item.href.split("?")[0]);
                    const isSmsLink = item.href.startsWith("sms:");
                    
                    return isSmsLink ? (
                      <a
                        key={item.label}
                        href={item.href}
                        role="menuitem"
                        className={`${menuItemBase}`}
                        onClick={closeMenu}
                      >
                        {item.label === "Build A Bid" && <Sparkles        className="h-4 w-4 shrink-0" />}
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href}
                        role="menuitem"
                        className={`${menuItemBase} ${isActive ? menuItemActive : ""}`}
                        onClick={closeMenu}
                      >
                        {item.label === "Dashboard"   && <LayoutDashboard className="h-4 w-4 shrink-0" />}
                        {item.label === "Bid Inbox"   && <Users           className="h-4 w-4 shrink-0" />}
                        {item.label === "Browse Jobs" && <Search          className="h-4 w-4 shrink-0" />}
                        {item.label === "Account"     && <Wrench          className="h-4 w-4 shrink-0" />}
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className={separator} />
                  <button type="button" role="menuitem" onClick={handleSignOut} className={`${menuItemBase} text-red-600 hover:text-red-600`}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center: Logo — absolutely centered against the header so it stays
            perfectly centered regardless of the differing left/right widths
            (hamburger vs. back link / Log In + Try for Free CTAs). */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <HomeBidsLogo size="clamp(17px, 2.5vw, 26px)" href={logoHref} />
          </div>
        </div>
        {/* Grid placeholder keeps the 3-column structure intact */}
        <div aria-hidden="true" />

        {/* Right: back link | signed-out CTAs | return to dashboard | spacer */}
        <div className="flex items-center justify-end gap-1.5">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel || "Back"}</span>
            </Link>
          ) : isLoggedIn && isContractor ? (
            <Link
              href="/contractors/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>Return to dashboard</span>
              <ArrowLeft className="h-4 w-4 scale-x-[-1]" />
            </Link>
          ) : !isLoggedIn ? (
            // Unauthenticated — show Log In + Try for Free on every public page
            <>
              <button
                type="button"
                onClick={() => openSignIn()}
                className="hidden sm:inline-flex h-8 items-center rounded-full px-3 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                Log In
              </button>
              <Link
                href="/contractors/signup"
                className="inline-flex h-8 items-center rounded-full bg-primary px-2.5 sm:px-3.5 text-xs sm:text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Try for Free
              </Link>
            </>
          ) : (
            // Spacer keeps logo centered when signed in and no back link
            <div className="w-9" />
          )}
        </div>
      </div>

      {/* SignInModal is rendered globally via SignInModalProvider in the root layout */}
    </header>
  );
}
