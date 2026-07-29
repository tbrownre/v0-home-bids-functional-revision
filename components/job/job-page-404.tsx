import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function JobPage404() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <AlertCircle className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Job not found</h1>
      <p className="max-w-sm text-muted-foreground">
        This job doesn&apos;t exist or the link has expired. Find other open jobs from homeowners in your area.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">Browse jobs on HomeBids</Link>
      </Button>
    </main>
  );
}
