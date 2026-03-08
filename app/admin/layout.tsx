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
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to site
          </a>
        </div>
      </header>
      {children}
    </div>
  );
}
