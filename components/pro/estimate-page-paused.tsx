import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EstimatePagePaused() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Clock className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">This page is taking a break</h1>
      <p className="max-w-sm text-muted-foreground">
        The contractor has temporarily paused this page. Check back soon or get bids from other verified contractors.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">Get bids from HomeBids</Link>
      </Button>
    </main>
  );
}
