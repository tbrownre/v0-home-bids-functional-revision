"use client";

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Header placeholder */}
      <div className="h-14 border-b border-border bg-background" />
      {/* Content placeholder */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-4">
        <div className="h-8 w-1/3 rounded-lg bg-muted" />
        <div className="h-4 w-2/3 rounded-lg bg-muted" />
        <div className="h-4 w-1/2 rounded-lg bg-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
