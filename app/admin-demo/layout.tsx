import Link from "next/link";
import type { ReactNode } from "react";
import { HomeBidsLogo } from "@/components/homebids-logo";

export const metadata = {
  title: "Admin Demo — HomeBids",
  description: "HomeBids platform admin dashboard demo",
};

export default function AdminDemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="sticky top-0 z-40 border-b border-black/8 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          {/* Logo → home */}
          <HomeBidsLogo height="clamp(20px, 3.5vw, 30px)" />

          <div className="flex items-center gap-3">
            {/* Demo badge */}
            <span className="hidden rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 sm:inline-flex">
              Demo Data
            </span>

            {/* Exit Demo */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#0A84FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#006EDB]"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M8 1 2.5 6.5 8 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Exit Demo</span>
              <span className="sm:hidden">Exit</span>
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
