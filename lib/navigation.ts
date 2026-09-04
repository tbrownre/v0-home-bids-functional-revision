export interface NavItem {
  label: string;
  href: string;
  match?: string[];
}

// Single source of truth for signed-out navigation.
// "Sign In" is intentionally excluded — it is rendered separately after a divider (contractors only).
export const loggedOutNavItems: NavItem[] = [
  { label: "Home",         href: "/" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Services",     href: "/services" },
  { label: "Contractors",  href: "/contractors" },
  { label: "Pricing",      href: "/subscribe" },
];

// Single source of truth for homeowner logged-in navigation.
// Sign Out is intentionally excluded — it must be appended as an action, not a link.
export const homeownerNavItems: NavItem[] = [
  { label: "Home",         href: "/" },
  { label: "Services",     href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Your Jobs",    href: "/homeowners/dashboard", match: ["/homeowners/dashboard", "/jobs", "/projects"] },
  { label: "Inbox",        href: "/inbox",          match: ["/messages", "/inbox"] },
  { label: "Profile",      href: "/profile",        match: ["/profile", "/settings"] },
  { label: "New Job",      href: "/new-job" },
];

// Single source of truth for contractor logged-in navigation.
// Sign Out is intentionally excluded — it must be appended as an action, not a link.
export const contractorNavItems: NavItem[] = [
  { label: "Dashboard", href: "/contractors/dashboard",    match: ["/contractors/dashboard"] },
  { label: "Bids",      href: "/contractors/bids-history", match: ["/contractors/bids-history"] },
  { label: "Profile",   href: "/contractors/profile",      match: ["/contractors/profile"] },
  { label: "Messages",  href: "/contractors/messages",     match: ["/contractors/messages"] },
];

// Helper to determine whether a nav item should be highlighted.
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  // Exact match on href (strip query strings for comparison)
  const hrefPath = item.href.split("?")[0];
  if (hrefPath !== "/" && pathname.startsWith(hrefPath)) return true;
  if (hrefPath === "/" && pathname === "/") return true;

  // Additional match patterns
  if (item.match) {
    return item.match.some((pattern) => pathname === pattern || pathname.startsWith(pattern + "/"));
  }

  return false;
}
