'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Copy, Check, Phone, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QRCode = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="h-[200px] w-[200px] bg-muted rounded" /> }
);

interface LandingPageData {
  id: string;
  slug: string;
  config: {
    brand?: {
      logo_url?: string;
      accent?: string;
      accent_checked?: string;
    };
    copy?: {
      headline?: string;
      subhead?: string;
      services?: string[];
    };
    trust?: {
      google_rating?: number;
      review_count?: number;
      license?: string;
      years?: number;
    };
    cta?: {
      sms_number?: string;
      ref?: string;
      qr_url?: string;
    };
    meta?: Record<string, any>;
  };
  contractor_profiles?: {
    business_name?: string;
    contractor_logo_url?: string;
  };
}

export function EstimatePageContent({ page }: { page: LandingPageData }) {
  const config = page.config || {};
  const brand = config.brand || {};
  const copy = config.copy || {};
  const trust = config.trust || {};
  const cta = config.cta || {};

  const companyName = page.contractor_profiles?.business_name || 'Contractor';
  const logoUrl = brand.logo_url || page.contractor_profiles?.contractor_logo_url;
  const accentColor = brand.accent || '#3b82f6';
  const smsNumber = cta.sms_number || '';
  const refParam = cta.ref || 'direct';
  const headline = copy.headline || `Get an estimate from ${companyName}`;
  const subhead = copy.subhead || '';
  const services = copy.services || [];

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Ensure text contrast - darken accent if needed for WCAG AA
  const textColor = getContrastColor(accentColor);

  const smsBody = `Hi Ava! I'd like a bid from ${encodeURIComponent(companyName)} (Ref: ${encodeURIComponent(refParam)})`;
  const smsLink = `sms:${smsNumber}?&body=${encodeURIComponent(smsBody)}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(smsNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate monogram if no logo
  const monogram = getMonogram(companyName);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 px-4 py-8 sm:py-12">
        {logoUrl ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-lg">
            <Image
              src={logoUrl}
              alt={`${companyName} logo`}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-lg font-bold text-white text-lg"
            style={{ backgroundColor: accentColor }}
          >
            {monogram}
          </div>
        )}

        <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
          {companyName}
        </h1>

        {/* Trust line */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          {trust.license && <span>{trust.license}</span>}
          {trust.years && <span>{trust.years}+ years</span>}
          {trust.google_rating !== undefined && trust.review_count !== undefined && (
            <span>⭐ {trust.google_rating} ({trust.review_count} reviews)</span>
          )}
        </div>
      </div>

      {/* Copy */}
      <div className="flex flex-col items-center gap-2 px-4 text-center sm:gap-3">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">{headline}</h2>
        {subhead && <p className="text-base text-muted-foreground sm:text-lg">{subhead}</p>}
      </div>

      {/* How it works */}
      <div className="mx-auto mt-8 grid max-w-md gap-4 px-4 sm:mt-12">
        <div className="flex gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-bold"
            style={{ backgroundColor: accentColor }}
          >
            1
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Text us</h3>
            <p className="text-sm text-muted-foreground">Start a conversation</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-bold"
            style={{ backgroundColor: accentColor }}
          >
            2
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Answer a few questions</h3>
            <p className="text-sm text-muted-foreground">Tell us about your project</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white font-bold"
            style={{ backgroundColor: accentColor }}
          >
            3
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Get your bid</h3>
            <p className="text-sm text-muted-foreground">Receive a detailed estimate</p>
          </div>
        </div>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="mt-8 px-4 sm:mt-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Services
          </p>
          <div className="flex flex-wrap gap-2">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="rounded-full border border-input bg-muted px-3 py-1 text-sm text-foreground"
              >
                {service}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile - sticky CTA */}
      {isMobile && smsNumber && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 sm:static sm:mt-12 sm:border-t-0 sm:p-0">
          <a
            href={smsLink}
            className="block w-full rounded-lg px-6 py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: accentColor,
              color: textColor,
            }}
          >
            Text {companyName}&apos;s assistant
          </a>
        </div>
      )}

      {/* Desktop fallback & QR */}
      {!isMobile && smsNumber && (
        <div className="mx-auto mt-12 max-w-md space-y-6 px-4 pb-12">
          <div>
            <Button
              asChild
              className="w-full"
              style={{
                backgroundColor: accentColor,
                color: textColor,
              }}
            >
              <a href={smsLink}>Text {companyName}&apos;s assistant</a>
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="text-sm font-mono">{smsNumber}</span>
              <button
                onClick={handleCopyPhone}
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Smartphone className="h-4 w-4" />
            {showQR ? 'Hide' : 'Show'} QR code
          </button>

          {showQR && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCode value={smsLink} size={200} level="M" />
            </div>
          )}
        </div>
      )}

      {/* Spacer for mobile CTA */}
      {isMobile && <div className="h-20" />}

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground mt-auto">
        <p className="mb-2">
          Powered by{' '}
          <a href="https://homebids.ai" className="font-semibold text-foreground hover:underline">
            HomeBids.ai
          </a>{' '}
          — Better bids. Better homes.
        </p>
        <p>By texting, you agree to receive messages about your project.</p>
      </footer>
    </main>
  );
}

// Helper: Get initials for monogram
function getMonogram(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Helper: Ensure text contrast for WCAG AA
function getContrastColor(hexColor: string): string {
  // Simple luminance calculation
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If dark, use white text; if light, use dark text
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
