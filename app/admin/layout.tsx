import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Admin — Contractor Applications",
  description: "Review and manage contractor applications",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-xs font-bold text-background">A</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">Admin Portal</p>
              <p className="text-xs text-muted-foreground mt-0.5">Contractor Management</p>
            </div>
          </div>

          {/* Exit Demo — prominent, always visible */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#0A84FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#006EDB] active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 1 3 7l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Back to HomeBids</span>
            <span className="sm:hidden">Exit</span>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
