"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Menu, FileText, Briefcase, HelpCircle, LogIn, LogOut, Home, ArrowLeft, MessageCircle, Hammer, PlusCircle } from "lucide-react";
import { homeownerNavItems, loggedOutNavItems, isNavItemActive } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { SignInModal } from "@/components/sign-in-modal";
import {
  subscribeInbox,
  getHomeownerUnreadSnapshot,
  getContractorUnreadSnapshot,
  type NotificationType,
} from "@/lib/inbox-store";
import { createClient } from "@/lib/supabase/client";
import { getMockUser, mockSignOut, USE_MOCK_DATA } from "@/lib/mock-auth";

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

export function Header({ isContractor: isContractorProp = false, isSignedIn: isSignedInProp = false, backHref, backLabel, onSignIn }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const [closing, setClosing] = useState(false);

  const closeMenu = () => {
    setClosing(true);
    setMenuOpen(false);
    (document.activeElement as HTMLElement)?.blur();
    // brief pointer-events guard so fast clicks can't reopen
    setTimeout(() => setClosing(false), 150);
  };

  // Close menu on every route change (catches both Link clicks and window.location)
  useEffect(() => {
    closeMenu();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close when tab loses focus (handles window.location navigations)
  useEffect(() => {
    const handler = () => { if (document.hidden) closeMenu(); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        closeMenu();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!menuOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  // Auth state
  const [isSignedIn, setIsSignedIn] = useState(() => {
    if (USE_MOCK_DATA && typeof window !== "undefined") {
      const user = getMockUser();
      return isSignedInProp || (user?.role === "homeowner" || user?.role === "admin") ? true : false;
    }
    return isSignedInProp;
  });
  const [isContractor, setIsContractor] = useState(() => {
    if (USE_MOCK_DATA && typeof window !== "undefined") {
      const user = getMockUser();
      return isContractorProp || user?.role === "contractor";
    }
    return isContractorProp;
  });
  const isLoggedIn = isContractor || isSignedIn;

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (USE_MOCK_DATA) {
      const user = getMockUser();
      if (user) {
        setIsSignedIn(user.role !== "contractor");
        setIsContractor(user.role === "contractor");
      }
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setIsSignedIn(true);
          setIsContractor(session.user.user_metadata?.user_type === "contractor");
        } else {
          setIsSignedIn(false);
          setIsContractor(false);
        }
      });
      subscription = data.subscription;
    } catch {
      // no-op
    }
    return () => subscription?.unsubscribe();
  }, []);

  // Inbox state (still uses in-memory store for now)
  const unreadSnapshot = useSyncExternalStore(
    subscribeInbox,
    isContractor ? getContractorUnreadSnapshot : getHomeownerUnreadSnapshot,
    isContractor ? getContractorUnreadSnapshot : getHomeownerUnreadSnapshot,
  );
  const unreadCount = isLoggedIn ? unreadSnapshot : 0;

  const handleSignOut = async () => {
    closeMenu();
    if (USE_MOCK_DATA) {
      mockSignOut();
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const menuItemClass = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer";
  const separatorClass = "my-1 border-t border-border";

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="mx-auto grid grid-cols-[1fr_auto_1fr] items-center px-3 py-2 md:px-4">

        {/* Left: menu button + optional back link */}
        <div className="flex items-center gap-1">
          {/* Trigger */}
          <button
            ref={menuRef as React.RefObject<HTMLButtonElement>}
            type="button"
            onClick={() => !closing && setMenuOpen((o) => !o)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground${closing ? " pointer-events-none" : ""}`}
            aria-label={`Menu${unreadCount > 0 ? ` (${unreadCount} notifications)` : ""}`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Menu className="h-5 w-5" />
            {isLoggedIn && unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Popover panel */}
          {menuOpen && (
            <div
              ref={panelRef}
              role="menu"
              className="absolute left-3 top-14 z-50 w-56 rounded-xl border border-border bg-background p-1.5 shadow-lg"
            >
              {/* Nav items — logged out */}
              {!isLoggedIn && (
                <>
                  {loggedOutNavItems.map((item) => (
                    <Link key={item.label} href={item.href} className={menuItemClass} onClick={closeMenu}>
                      {item.label === "Home"         && <Home       className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      {item.label === "Services"     && <Briefcase  className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      {item.label === "How It Works" && <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      {item.label === "Pricing"      && <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      {item.label === "About Us"     && <Home       className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      {item.label}
                    </Link>
                  ))}
                  <div className={separatorClass} />
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setShowSignIn(true); }}
                    className={menuItemClass}
                  >
                    <LogIn className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Sign In
                  </button>
                </>
              )}

              {/* Nav items — logged in homeowner */}
              {isLoggedIn && !isContractor && (
                <>
                  {homeownerNavItems.map((item) => {
                    const active = isNavItemActive(item, pathname);
                    const isInbox = item.match?.includes("/inbox");
                    const isHome = item.label === "Home";
                    return (
                      <React.Fragment key={item.label}>
                        {/* Divider between marketing nav and app nav */}
                        {item.label === "Your Jobs" && (
                          <div className="my-2 border-t border-border" />
                        )}
                        <Link
                          href={item.href}
                          className={`${menuItemClass}${active ? " bg-muted font-medium" : ""}`}
                          onClick={(e) => {
                            if (isHome) {
                              window.dispatchEvent(new CustomEvent("hb:home"));
                            }
                            closeMenu();
                          }}
                        >
                          {item.label === "Home"         && <Home          className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          {item.label === "Services"     && <Briefcase     className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          {item.label === "How It Works" && <HelpCircle    className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          {item.label === "Your Jobs"    && <FileText      className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          {item.label === "Inbox"        && <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          {item.label === "Profile"      && <Home          className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          {item.label === "New Job"      && <PlusCircle    className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          <span className="flex-1">{item.label}</span>
                          {isInbox && unreadCount > 0 && (
                            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      </React.Fragment>
                    );
                  })}
                  <div className={separatorClass} />
                  <button type="button" onClick={handleSignOut} className={`${menuItemClass} text-red-600 hover:text-red-600`}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                  </button>
                </>
              )}

              {/* Nav items — logged in contractor */}
              {isLoggedIn && isContractor && (
                <>
                  <Link href="/contractors/dashboard" className={`${menuItemClass} font-medium`} onClick={closeMenu}>
                    <Hammer className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Contractor Dashboard
                  </Link>
                  <Link href="/contractors/jobs" className={menuItemClass} onClick={closeMenu}>
                    <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                    Available Jobs
                  </Link>
                  <Link href="/inbox?type=contractor" className={menuItemClass} onClick={closeMenu}>
                    <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">Messages</span>
                    {unreadCount > 0 && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/contractors/dashboard" className={menuItemClass} onClick={closeMenu}>
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    My Bids
                  </Link>
                  <div className={separatorClass} />
                  <button type="button" onClick={handleSignOut} className={`${menuItemClass} text-red-600 hover:text-red-600`}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          )}

        </div>

        {/* Center: Logo — always visually centered in the header */}
        <Link href="/" className="flex items-center justify-center" onClick={closeMenu}>
          <Image
            src="/images/homebids-logo-new.png"
            alt="HomeBids"
            width={480}
            height={120}
            className="object-contain"
            style={{ height: "clamp(56px, 10vw, 80px)", width: "auto" }}
            priority
          />
        </Link>

        {/* Right: spacer that mirrors the left column to keep logo truly centered */}
        <div className="flex items-center justify-end">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel || "Back"}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Sign In Modal */}
      {!isLoggedIn && (
        <SignInModal
          open={showSignIn}
          onOpenChange={(val) => {
            setShowSignIn(val);
            if (!val) setMenuOpen(false);
          }}
          onSignIn={(type) => {
            setShowSignIn(false);
            setMenuOpen(false);
            if (type === "homeowner") {
              onSignIn?.();
              if (!onSignIn) {
                window.location.href = "/?showJobs=true";
              }
            }
          }}
        />
      )}
    </header>
  );
}
