'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { HomeBidsLogo } from '@/components/homebids-logo';
import { Badge } from '@/components/ui/badge';

const QRCode = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="h-[200px] w-[200px] bg-muted rounded" /> }
);

interface JobPageContentProps {
  job: {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string;
    zip_code: string | null;
    urgency: string | null;
    budget_min: number | null;
    budget_max: number | null;
    images: string[] | null;
    created_at: string;
    job_ref: string | null;
    status: string;
  };
  homeownerFirstName: string;
}

export function JobPageContent({ job, homeownerFirstName }: JobPageContentProps) {
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [scrolledPastCTA, setScrolledPastCTA] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isIPad = ua.includes('ipad') || (ua.includes('macintosh') && navigator.maxTouchPoints > 1);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(hasTouch && (isSmallScreen || isIPad));
    };

    const handleScroll = () => {
      // Find the CTA section and check if user has scrolled past it
      const ctaSection = document.querySelector('[data-cta-section]');
      if (ctaSection) {
        const rect = ctaSection.getBoundingClientRect();
        setScrolledPastCTA(rect.bottom < 0);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const phoneNumber = '+12832291348';
  const jobRefShort = job.job_ref || job.id.slice(0, 8);
  const jobRefEncoded = encodeURIComponent(`Job: ${jobRefShort}`);
  const smsBody = `Hi!%20I%20want%20to%20bid%20on%20this%20job%20(${jobRefEncoded})`;
  const smsLink = `sms:${phoneNumber}?body=${smsBody}`;
  
  const questionBody = `Hi!%20I%20have%20a%20question%20about%20this%20job%20(Job:%20${jobRefShort}):%20`;
  const questionLink = `sms:${phoneNumber}?body=${questionBody}`;
  const estimateBody = encodeURIComponent(`Hi! I'd like to offer a free in-person estimate for this job (Job: ${jobRefShort})`);
  const estimateLink = `sms:${phoneNumber}?body=${estimateBody}`;

  const urgencyLabels: Record<string, string> = {
    asap: 'ASAP',
    within_week: 'Within a week',
    within_month: 'Within a month',
    flexible: 'Flexible timing',
  };

  const postedDate = new Date(job.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Privacy: extract location with city + state, fallback to ZIP, fallback to just name
  let locationPhrase = homeownerFirstName;
  if (job.location) {
    // Parse location field: could be "City, State" or "City" or full address
    const parts = job.location.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      // Format: "City, State" or "City, State, ZIP" etc.
      const city = parts[0];
      const state = parts[1];
      locationPhrase = `${homeownerFirstName} from ${city}, ${state}`;
    } else if (parts.length === 1) {
      // Just a city or single part
      const city = parts[0];
      // Default to AZ if no state detected
      locationPhrase = `${homeownerFirstName} from ${city}, AZ`;
    }
  } else if (job.zip_code) {
    // Fallback to ZIP if location not available
    locationPhrase = `${homeownerFirstName} from ${job.zip_code}`;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <HomeBidsLogo size="20px" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-3xl px-4 py-8">
        {/* Job Title & Meta */}
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>Posted {postedDate}</span>
            {job.urgency && (
              <Badge variant="secondary" className="font-normal">
                {urgencyLabels[job.urgency] || job.urgency}
              </Badge>
            )}
          </div>
        </div>

        {/* Photo Gallery */}
        {job.images && job.images.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {job.images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={img}
                    alt={`${job.title} photo ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Details */}
        <section className="mb-8 space-y-4 text-center">
          <h2 className="text-xl font-semibold text-foreground">Project details</h2>
          <p className="text-pretty whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {job.description}
          </p>
        </section>

        {/* Facts Row */}
        <section className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="text-sm font-normal">
              {job.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {locationPhrase}
            </span>
            {job.budget_min && job.budget_max && (
              <span className="text-sm text-muted-foreground">
                ${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()}
              </span>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-8 space-y-4 text-center" data-cta-section>
          {/* FREE reassurance block */}
          <div className="rounded-lg bg-accent/10 p-4">
            <p className="text-sm font-medium text-foreground">
              100% FREE to bid — no catch, no app to download, no credit card.
            </p>
          </div>

          {isMobile ? (
            <div className="space-y-3">
              <a
                href={smsLink}
                className="block w-full rounded-lg bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Bid on this job — free
              </a>
              <a
                href={questionLink}
                className="block w-full rounded-lg border border-input bg-background px-6 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Ask {homeownerFirstName} a question first
              </a>
              <div className="space-y-1">
                <a
                  href={estimateLink}
                  className="block w-full rounded-lg border border-input bg-background px-6 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  Offer a free in-person estimate
                </a>
                <p className="text-sm text-muted-foreground">
                  Can&apos;t price it without seeing it? Offer a visit — we&apos;ll set it up with {homeownerFirstName}.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Text to bid:</p>
                <a
                  href={smsLink}
                  className="flex min-h-14 w-full items-center justify-center rounded-lg bg-primary px-4 py-4 text-center text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Text +1 (283) 229-1348 to bid
                </a>
                <p className="text-sm text-muted-foreground">
                  Tap the button - your Messages app opens with the job already filled in.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowQR(!showQR)}
                className="w-full"
              >
                {showQR ? 'Hide' : 'Show'} QR code
              </Button>
              {showQR && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCode value={smsLink} size={200} level="M" />
                </div>
              )}
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium text-foreground">Or ask a question first:</p>
                <Button
                  variant="outline"
                  asChild
                  className="w-full"
                >
                  <a href={questionLink}>
                    Ask {homeownerFirstName} a question
                  </a>
                </Button>
                <div className="mt-3 space-y-1">
                  <Button variant="outline" asChild className="w-full">
                    <a href={estimateLink}>Offer a free in-person estimate</a>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Can&apos;t price it without seeing it? Offer a visit — we&apos;ll set it up with {homeownerFirstName}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="space-y-3 rounded-lg bg-muted/40 p-6">
            <h3 className="font-semibold text-foreground">How it works:</h3>
            <ol className="space-y-2 text-sm text-foreground">
              <li>Tap the button → your Messages app opens</li>
              <li>Send the pre-filled text</li>
              <li>Answer a few quick questions</li>
              <li>Your professional bid is ready in ~90 seconds</li>
            </ol>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="mb-2 text-sm font-medium text-foreground">
            Powered by <HomeBidsLogo size="14px" linked={false} /> — Better bids. Better homes.
          </p>
          <p className="text-xs text-muted-foreground">
            By texting, you agree to receive messages about this job.
          </p>
        </div>
      </footer>

      {/* Sticky Mobile CTA - only show after user scrolls past the inline CTA */}
      {isMobile && scrolledPastCTA && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <a
            href={smsLink}
            className="block w-full rounded-lg bg-primary px-6 py-3 text-center text-base font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          >
            Bid on this job — free
          </a>
        </div>
      )}
    </div>
  );
}
