'use client';

import Link from 'next/link';
import { AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Screen shown when a free-tier contractor exceeds their 3 free bids for own projects.
 * Marketplace/homeowner job bids are unlimited and free forever.
 */
export function BidLimitUpgrade() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md bg-background">
        <div className="space-y-6 p-6 sm:p-8">
          {/* Icon & Headline */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-center text-2xl font-bold text-foreground">
              You&apos;ve Used Your 3 Free Bids
            </h2>
          </div>

          {/* Description */}
          <p className="text-center text-base text-muted-foreground">
            Subscribe to keep building unlimited bids for your own projects. Bidding on HomeBids jobs stays free forever.
          </p>

          {/* Feature Comparison */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10">
                <span className="text-xs font-semibold">✓</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Own Project Bids</p>
                <p className="text-sm text-muted-foreground">3 free, unlimited with subscription</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                <span className="text-xs font-semibold text-green-700">✓</span>
              </div>
              <div>
                <p className="font-medium text-foreground">HomeBids Marketplace Bids</p>
                <p className="text-sm text-muted-foreground">Always free, unlimited, never count toward limit</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Link href="/subscribe?type=contractor">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
                <Zap className="mr-2 h-4 w-4" />
                Subscribe Now
              </Button>
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              3-day free trial. Cancel anytime. $99/month after trial.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
