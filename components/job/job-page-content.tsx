'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Copy, Check, Phone } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(hasTouch && isSmallScreen && !ua.includes('ipad'));
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const phoneNumber = '+12832291348';
  const jobRefEncoded = encodeURIComponent(`Job: ${job.job_ref || job.id.slice(0, 8)}`);
  const smsBody = `Hi!%20I%20want%20to%20bid%20on%20this%20job%20(${jobRefEncoded})`;
  const smsLink = `sms:${phoneNumber}?&body=${smsBody}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Privacy: show only ZIP and area, never full street address
  const cityDisplay = job.zip_code || 'Your area';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <HomeBidsLogo size="20px" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-3xl px-4 py-8">
        {/* Job Title & Meta */}
        <div className="mb-6 space-y-2">
          <h1 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
        <section className="mb-8 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Project details</h2>
          <p className="text-pretty whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {job.description}
          </p>
        </section>

        {/* Facts Row */}
        <section className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="outline" className="text-sm font-normal">
              {job.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {homeownerFirstName} in {cityDisplay}
            </span>
            {job.budget_min && job.budget_max && (
              <span className="text-sm text-muted-foreground">
                ${job.budget_min.toLocaleString()} – ${job.budget_max.toLocaleString()}
              </span>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-8 space-y-4">
          {isMobile ? (
            <a
              href={smsLink}
              className="block w-full rounded-lg bg-primary px-6 py-4 text-center text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Bid on this job — free
            </a>
          ) : (
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Text to bid:</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-foreground">{phoneNumber}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(phoneNumber)}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
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
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Text our Bid Builder and have a professional bid ready in ~90 seconds.
          </p>
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

      {/* Sticky Mobile CTA */}
      {isMobile && (
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
