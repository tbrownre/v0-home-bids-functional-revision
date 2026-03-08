"use client";

import { useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  DollarSign,
  MessageCircle,
  CheckCircle2,
  Eye,
  AlertCircle,
  CreditCard,
  CheckCheck,
  Inbox,
  Filter,
  ArrowLeft,
} from "lucide-react";
import {
  markAsRead,
  markAllAsRead,
  getHomeownerNotificationsSnapshot,
  getContractorNotificationsSnapshot,
  getHomeownerUnreadSnapshot,
  getContractorUnreadSnapshot,
  subscribeInbox,
  type InboxNotification,
  type NotificationType,
} from "@/lib/inbox-store";

// ------- Helpers -------

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "bid_received":
    case "bid_updated":
      return DollarSign;
    case "bid_accepted":
      return CheckCircle2;
    case "bid_not_selected":
      return AlertCircle;
    case "bid_viewed":
      return Eye;
    case "contractor_message":
    case "homeowner_message":
      return MessageCircle;
    case "payment_released":
      return CreditCard;
    case "job_milestone":
      return CheckCircle2;
    default:
      return Bell;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case "bid_received":
    case "bid_updated":
      return "bg-blue-100 text-blue-600 border-blue-200";
    case "bid_accepted":
    case "job_milestone":
      return "bg-green-100 text-green-600 border-green-200";
    case "bid_not_selected":
      return "bg-gray-100 text-gray-500 border-gray-200";
    case "bid_viewed":
      return "bg-purple-100 text-purple-600 border-purple-200";
    case "contractor_message":
    case "homeowner_message":
      return "bg-primary/10 text-primary border-primary/20";
    case "payment_released":
      return "bg-emerald-100 text-emerald-600 border-emerald-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getNotificationAccent(type: NotificationType) {
  switch (type) {
    case "bid_received":
    case "bid_updated":
      return "border-l-blue-500";
    case "bid_accepted":
    case "job_milestone":
      return "border-l-green-500";
    case "bid_not_selected":
      return "border-l-gray-400";
    case "bid_viewed":
      return "border-l-purple-500";
    case "contractor_message":
    case "homeowner_message":
      return "border-l-primary";
    case "payment_released":
      return "border-l-emerald-500";
    default:
      return "border-l-muted-foreground";
  }
}

type TabFilter = "all" | "bids" | "messages" | "updates";

function getTabForType(type: NotificationType): TabFilter {
  switch (type) {
    case "bid_received":
    case "bid_accepted":
    case "bid_not_selected":
    case "bid_updated":
    case "bid_viewed":
      return "bids";
    case "contractor_message":
    case "homeowner_message":
      return "messages";
    case "payment_released":
    case "job_milestone":
      return "updates";
    default:
      return "all";
  }
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ------- Component -------

export default function InboxPage() {
  const searchParams = useSearchParams();
  const userType = searchParams.get("type");
  const isContractor = userType === "contractor";

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Subscribe to inbox store with stable snapshot getters
  const notifications = useSyncExternalStore(
    subscribeInbox,
    isContractor ? getContractorNotificationsSnapshot : getHomeownerNotificationsSnapshot,
    isContractor ? getContractorNotificationsSnapshot : getHomeownerNotificationsSnapshot,
  );
  const unreadCount = useSyncExternalStore(
    subscribeInbox,
    isContractor ? getContractorUnreadSnapshot : getHomeownerUnreadSnapshot,
    isContractor ? getContractorUnreadSnapshot : getHomeownerUnreadSnapshot,
  );

  // Filter notifications
  const filtered = notifications.filter((n) => {
    const matchesTab = activeTab === "all" || getTabForType(n.type) === activeTab;
    const matchesSearch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.fromName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    {
      key: "bids",
      label: "Bids",
      count: notifications.filter((n) => getTabForType(n.type) === "bids").length,
    },
    {
      key: "messages",
      label: "Messages",
      count: notifications.filter((n) => getTabForType(n.type) === "messages").length,
    },
    {
      key: "updates",
      label: "Updates",
      count: notifications.filter((n) => getTabForType(n.type) === "updates").length,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isContractor={isContractor} isSignedIn={!isContractor} />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Page Header */}
          <div className="mb-6">
            <Link
              href={isContractor ? "/contractors/dashboard" : "/?showJobs=true"}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {isContractor ? "Back to Dashboard" : "Back to Jobs"}
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isContractor
                    ? "Bid responses, homeowner messages, and payment updates"
                    : "New bids, contractor messages, and job updates"}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                  onClick={() => markAllAsRead(isContractor)}
                >
                  <CheckCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                </Button>
              )}
            </div>
          </div>

          {/* Tabs + Search */}
          <div className="mb-4 space-y-3">
            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
                    activeTab === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        activeTab === tab.key
                          ? "bg-primary/10 text-primary"
                          : "bg-muted-foreground/10 text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Notification List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Inbox className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    {searchQuery ? "No matching notifications" : "No notifications yet"}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search or switching tabs."
                      : isContractor
                        ? "When homeowners respond to your bids or send messages, they will appear here."
                        : "When contractors submit bids on your jobs or send messages, they will appear here."}
                  </p>
                </motion.div>
              ) : (
                filtered.map((notification, index) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    index={index}
                    isContractor={isContractor}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <ScrollToTop />
    </div>
  );
}

// ------- Notification Card -------

function NotificationCard({
  notification,
  index,
  isContractor,
}: {
  notification: InboxNotification;
  index: number;
  isContractor: boolean;
}) {
  const Icon = getNotificationIcon(notification.type);
  const colorClass = getNotificationColor(notification.type);
  const accentClass = getNotificationAccent(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03 }}
      layout
    >
      <Link
        href={notification.href}
        onClick={() => markAsRead(notification.id, isContractor)}
        className={`group flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md ${
          !notification.read
            ? `border-l-[3px] ${accentClass} border-border`
            : "border-border"
        }`}
      >
        {/* Icon */}
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm ${
                    !notification.read
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground/80"
                  }`}
                >
                  {notification.title}
                </p>
                {!notification.read && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {notification.description}
              </p>
            </div>

            {/* Amount badge */}
            {notification.amount && (
              <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                ${notification.amount.toLocaleString()}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground/60">
              {formatTimeAgo(notification.timestamp)}
            </span>
            <span className="text-[11px] text-muted-foreground/40">|</span>
            <span className="text-[11px] text-muted-foreground/60">{notification.jobTitle}</span>
            <span className="text-[11px] text-muted-foreground/40">|</span>
            <span className="text-[11px] text-muted-foreground/60">{notification.fromName}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
