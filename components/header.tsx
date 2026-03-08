"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Menu, FileText, Briefcase, HelpCircle, Info, LogIn, LogOut, Plus, Home, ArrowLeft, Bell, DollarSign, MessageCircle, CheckCircle2, Eye, AlertCircle, CreditCard, Tag } from "lucide-react";
import { SignInModal } from "@/components/sign-in-modal";
import {
  subscribeInbox,
  getHomeownerUnreadSnapshot,
  getContractorUnreadSnapshot,
  type NotificationType,
} from "@/lib/inbox-store";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
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

  // Auth state from Supabase
  const [isSignedIn, setIsSignedIn] = useState(isSignedInProp);
  const [isContractor, setIsContractor] = useState(isContractorProp);
  const isLoggedIn = isContractor || isSignedIn;

  useEffect(() => {
    // Skip Supabase entirely in the v0 preview sandbox — it blocks external fetch
    if (typeof window === "undefined") return;
    if (window.location.hostname.includes("vusercontent.net")) return;
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
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const menuItemClass = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted cursor-pointer";
  const separatorClass = "my-1 border-t border-border";

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex items-center justify-between px-3 py-0.5 md:px-4">
        {/* Left: menu button + optional back link */}
        <div className="flex items-center gap-1">
          {/* Trigger */}
          <button
            ref={menuRef as React.RefObject<HTMLButtonElement>}
            type="button"
            onClick={() => !closing && setMenuOpen((o) => !o)}
            className={`relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground${closing ? " pointer-events-none" : ""}`}
            aria-label={`Menu${unreadCount > 0 ? ` (${unreadCount} notifications)` : ""}`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Menu className="h-4 w-4" />
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
              className="absolute left-3 top-14 z-50 w-52 rounded-xl border border-border bg-background p-1.5 shadow-lg"
            >
              {/* Public nav */}
              <Link href="/" className={menuItemClass} onClick={closeMenu}>
                <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                Home
              </Link>
              <Link href="/services" className={menuItemClass} onClick={closeMenu}>
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                Services
              </Link>
              <Link href="/how-it-works" className={menuItemClass} onClick={closeMenu}>
                <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                How It Works
              </Link>
              <Link href="/subscribe" className={menuItemClass} onClick={closeMenu}>
                <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                Pricing
              </Link>
              <Link href="/about" className={menuItemClass} onClick={closeMenu}>
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                About Us
              </Link>

              <div className={separatorClass} />

              {/* Authenticated nav */}
              {isLoggedIn && (
                <Link
                  href={`/inbox?type=${isContractor ? "contractor" : "homeowner"}`}
                  className={menuItemClass}
                  onClick={closeMenu}
                >
                  <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {isContractor ? (
                <Link href="/contractors/jobs" className={menuItemClass} onClick={closeMenu}>
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Available Jobs
                </Link>
              ) : (
                <Link href="/" className={menuItemClass} onClick={closeMenu}>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Post a Job
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  href={isContractor ? "/contractors/bids" : "/?showJobs=true"}
                  className={menuItemClass}
                  onClick={closeMenu}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {isContractor ? "Your Bids" : "Your Jobs"}
                </Link>
              )}

              <div className={separatorClass} />

              {isContractor || isSignedIn ? (
                <button type="button" onClick={handleSignOut} className={`${menuItemClass} text-red-600 hover:text-red-600`}>
                  <LogOut className="h-4 w-4 shrink-0" />
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setShowSignIn(true); }}
                  className={menuItemClass}
                >
                  <LogIn className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Sign In
                </button>
              )}
            </div>
          )}

          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={closeMenu}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel || "Back"}</span>
            </Link>
          )}
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center" onClick={closeMenu}>
          <Image
            src="/images/homebids-logo-new.png"
            alt="HomeBids"
            width={702}
            height={176}
            className="h-[5rem] w-auto -translate-x-4 object-contain md:h-[6rem] md:-translate-x-6"
            priority
            unoptimized
          />
        </Link>
      </div>

      {/* Sign In Modal */}
      {!isContractor && !isSignedIn && (
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
