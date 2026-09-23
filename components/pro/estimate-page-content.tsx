'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  Copy,
  Check,
  Phone,
  Smartphone,
  Star,
  MessageCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const QRCode = dynamic(
  () => import('qrcode.react').then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="h-[160px] w-[160px] rounded bg-muted" /> }
);

/**
 * /pro/[slug] v2 — Tim's contractor landing template (Sep 22 mock), ported onto
 * the existing config rails. Every new section is OPTIONAL: it renders only when
 * its config fields exist, so every already-published page keeps working.
 *
 * config additions (all optional):
 *   brand.trade ("plumbing"), brand.city ("Gilbert, AZ"), brand.since ("2009"),
 *   brand.cities (["Gilbert","Chandler",...])
 *   trust.google_reviews_url, trust.reply_time ("< 5 min"), trust.jobs ("500+")
 *   reviews: [{ title, text, name, city }]
 */

interface ReviewItem {
  title?: string;
  text?: string;
  name?: string;
  city?: string;
}

interface LandingPageData {
  id: string;
  slug: string;
  config: {
    brand?: {
      company_name?: string;
      logo_url?: string;
      accent?: string;
      accent_checked?: string;
      trade?: string;
      city?: string;
      since?: string;
      cities?: string[];
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
      google_reviews_url?: string;
      reply_time?: string;
      jobs?: string;
    };
    cta?: {
      sms_number?: string;
      ref?: string;
      qr_url?: string;
    };
    reviews?: ReviewItem[];
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
  const reviews = Array.isArray(config.reviews) ? config.reviews.slice(0, 3) : [];

  const companyName = brand.company_name || page.contractor_profiles?.business_name || 'Contractor';
  const logoUrl = brand.logo_url || page.contractor_profiles?.contractor_logo_url;
  const accentColor = brand.accent || '#0A84FF';
  const trade = (brand.trade || '').trim();
  const tradeWord = trade || 'home service';
  const smsNumber = cta.sms_number || '';
  const refParam = cta.ref || 'direct';
  const services = copy.services || [];
  const cities = Array.isArray(brand.cities) ? brand.cities : [];

  const hasRating = typeof trust.google_rating === 'number' && typeof trust.review_count === 'number';

  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const textColor = getContrastColor(accentColor);
  const monogram = getMonogram(companyName);

  const smsBodyFor = (topic?: string) => {
    const ask = topic
      ? `Hi Ava! I need help with ${topic} from ${companyName} (Ref: ${refParam})`
      : `Hi Ava! I'd like a bid from ${companyName} (Ref: ${refParam})`;
    return `sms:${smsNumber}?body=${encodeURIComponent(ask)}`;
  };
  const smsLink = smsBodyFor();

  const handleCopyPhone = () => {
    try {
      navigator.clipboard.writeText(smsNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          {logoUrl ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
              <Image src={logoUrl} alt={`${companyName} logo`} fill className="object-cover" priority />
            </div>
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {monogram}
            </div>
          )}
          <span className="truncate text-base font-extrabold text-foreground">{companyName}</span>
          {hasRating && (
            <span className="ml-1 hidden text-sm text-muted-foreground sm:inline">
              <b className="font-semibold text-foreground">{trust.google_rating} ★</b> ({trust.review_count})
            </span>
          )}
          {smsNumber && (
            <a
              href={smsLink}
              className="ml-auto hidden rounded-full px-4 py-2 text-sm font-bold sm:inline-flex"
              style={{ backgroundColor: accentColor, color: textColor }}
            >
              Text for a free quote
            </a>
          )}
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-12 pt-10 sm:pt-16">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {[brand.city, trust.license ? 'Licensed & insured' : null, brand.since ? `Since ${brand.since}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Skip the phone calls. <span style={{ color: accentColor }}>Text us</span> — get a real {tradeWord} quote
              in minutes.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Describe the project, send a photo if it helps, and get an{' '}
              <b className="font-semibold text-foreground">itemized estimate — fast.</b> Every quote is reviewed and
              confirmed by {companyName} before anything is scheduled.
            </p>
            {smsNumber && (
              <>
                <a
                  href={smsLink}
                  className="mt-7 inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold shadow-lg"
                  style={{ backgroundColor: accentColor, color: textColor }}
                >
                  <MessageCircle className="h-5 w-5" />
                  Text us for a free quote
                </a>
                <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Opens your texting app · Free · No signup · No phone calls
                </p>
              </>
            )}
          </div>

          <ChatDemo companyName={companyName} tradeWord={tradeWord} accent={accentColor} />
        </div>
      </section>

      {/* ── Trust strip (each cell optional) ──────────────────────────── */}
      {(hasRating || trust.reply_time || trust.license || trust.jobs) && (
        <div className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-5xl grid-cols-2 sm:grid-cols-4">
            {hasRating && (
              <TrustCell
                big={`${trust.google_rating} ★`}
                small={
                  trust.google_reviews_url ? (
                    <a
                      href={trust.google_reviews_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                      style={{ color: accentColor }}
                    >
                      {trust.review_count} Google reviews
                    </a>
                  ) : (
                    `${trust.review_count} Google reviews`
                  )
                }
              />
            )}
            {trust.reply_time && <TrustCell big={trust.reply_time} small="average reply time" />}
            {trust.license && <TrustCell big={trust.license} small="licensed & insured" />}
            {trust.jobs && <TrustCell big={trust.jobs} small="jobs completed" />}
          </div>
        </div>
      )}

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
            Three texts. One honest quote.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Text us',
                d: 'Tap the button and your texting app opens with the first message ready. You get a reply right away — any hour, any day.',
                k: 'No app · no account',
              },
              {
                n: '02',
                t: 'Answer a few questions',
                d: 'Describe the problem, your area, and timing. Photos help — send them right in the thread.',
                k: 'About 2 minutes',
              },
              {
                n: '03',
                t: 'Get your quote & book',
                d: `You get an itemized estimate in the same thread. ${companyName} reviews and confirms every quote before work is scheduled.`,
                k: 'Fast turnaround',
              },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <span className="text-xs font-bold" style={{ color: accentColor }}>
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-bold text-foreground">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                <span className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-wider text-green-600">
                  {s.k}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services (tap → prefilled text) ───────────────────────────── */}
      {services.length > 0 && (
        <section className="px-4 pb-14 sm:pb-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
              What we do
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
              Tap your project. The text writes itself.
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {services.map((service, idx) => (
                <a
                  key={idx}
                  href={smsNumber ? smsBodyFor(service) : undefined}
                  className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h3 className="text-[15px] font-bold text-foreground">{service}</h3>
                  {smsNumber && (
                    <span className="mt-2 inline-block text-sm font-semibold" style={{ color: accentColor }}>
                      Text about it →
                    </span>
                  )}
                </a>
              ))}
            </div>
            {smsNumber && (
              <p className="mt-5 text-sm text-muted-foreground">
                Something else?{' '}
                <a href={smsLink} className="font-semibold" style={{ color: accentColor }}>
                  Text us anyway
                </a>{' '}
                — we handle most {tradeWord} projects{cities.length > 0 ? ` around ${cities[0]}` : ''}.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Reviews (only when provided) ──────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="px-4 pb-14 sm:pb-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
              From your neighbors
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                {hasRating ? `Rated ${trust.google_rating} on Google` : 'What customers say'}
              </h2>
              {trust.google_reviews_url && (
                <a
                  href={trust.google_reviews_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold"
                  style={{ color: accentColor }}
                >
                  Read them all on Google →
                </a>
              )}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {reviews.map((r, i) => (
                <article key={i} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                  <span className="text-sm tracking-widest text-amber-500" aria-label="5 stars">
                    ★★★★★
                  </span>
                  {r.title && <h3 className="mt-3 font-bold text-foreground">{r.title}</h3>}
                  {r.text && <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{r.text}</p>}
                  {(r.name || r.city) && (
                    <p className="mt-4 text-sm">
                      <b className="font-semibold text-foreground">{r.name}</b>
                      {r.city && <span className="text-muted-foreground"> · {r.city}</span>}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-14 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
            Fair questions
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">Before you text</h2>
          <div className="mt-6 divide-y divide-border border-b border-border">
            {[
              {
                q: 'Is the quote really free?',
                a: "Yes — free and no obligation. You'll see an itemized estimate before you decide anything, and you can simply stop replying if it's not for you.",
              },
              {
                q: 'Am I texting a bot?',
                a: `You'll start with Ava, ${companyName}'s AI assistant — that's how you get answers instantly, even at 9pm. ${companyName} personally reviews and confirms every quote before any work is scheduled.`,
              },
              {
                q: 'Will you spam me afterward?',
                a: "No. We text you about your project — that's it. Reply STOP at any time and it stops.",
              },
              {
                q: 'How fast do I get the estimate?',
                a: 'Most estimates come back in the same conversation — describe the project, answer a couple of questions, and the itemized quote lands right in the thread.',
              },
            ].map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-foreground">
                  {f.q}
                  <span className="text-xl font-medium text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA band ────────────────────────────────────────────── */}
      {smsNumber && (
        <section className="bg-[#0B0E14] px-4 py-16 text-white">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight">Ready when you are.</h2>
              <p className="mt-3 max-w-md text-white/70">
                Text us now — you&apos;ll usually have a real, itemized quote the same day.
              </p>
              <a
                href={smsLink}
                className="mt-7 inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold"
                style={{ backgroundColor: accentColor, color: textColor }}
              >
                <MessageCircle className="h-5 w-5" />
                Text us for a free quote
              </a>
              <div className="mt-5 flex items-center gap-2 text-sm text-white/70">
                <Phone className="h-4 w-4" />
                <span className="font-mono">{smsNumber}</span>
                <button
                  onClick={handleCopyPhone}
                  className="ml-1 inline-flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="hidden justify-self-center rounded-2xl bg-white p-6 text-center text-foreground lg:block">
              <div className="mx-auto flex h-[160px] w-[160px] items-center justify-center">
                <QRCode value={smsLink} size={160} level="M" />
              </div>
              <p className="mt-3 font-bold">On a computer?</p>
              <p className="text-xs text-muted-foreground">
                Scan with your phone camera
                <br />
                to start the text.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border px-4 py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-5xl flex-col gap-2">
          <p className="text-[15px] font-extrabold text-foreground">{companyName}</p>
          {trust.license && (
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" />
              {trust.license} · licensed &amp; insured
            </p>
          )}
          {cities.length > 0 && <p>Serving {cities.join(', ')}</p>}
          <p className="mt-2 border-t border-border pt-3 text-xs">
            © {new Date().getFullYear()} {companyName}. All rights reserved. · Landing page powered by{' '}
            <a href="https://homebids.ai" className="font-semibold text-foreground hover:underline">
              HomeBids.ai
            </a>
          </p>
          <p className="text-xs">By texting, you agree to receive messages about your project.</p>
        </div>
      </footer>

      {/* ── Sticky mobile CTA ─────────────────────────────────────────── */}
      {isMobile && smsNumber && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 p-3 backdrop-blur">
          <a
            href={smsLink}
            className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold"
            style={{ backgroundColor: accentColor, color: textColor }}
          >
            <MessageCircle className="h-5 w-5" />
            Text us for a free quote
          </a>
        </div>
      )}
      {isMobile && smsNumber && <div className="h-20" />}
    </main>
  );
}

/* ── Animated iMessage demo (the signature) ──────────────────────────── */

function ChatDemo({
  companyName,
  tradeWord,
  accent,
}: {
  companyName: string;
  tradeWord: string;
  accent: string;
}) {
  const script = [
    { role: 'in', text: `Hi! I'm Ava, ${companyName}'s assistant 👋 What can we help with today?` },
    { role: 'out', text: `I need help with a ${tradeWord} project at my place.` },
    { role: 'in', text: 'Got it — describe it briefly, or text a photo if that’s easier.' },
    { role: 'out', text: 'Sending a photo now 📷' },
    { role: 'in', text: `Perfect. ${companyName} can get you an itemized estimate right in this thread — want me to start it?` },
    { role: 'out', text: 'Yes please!' },
    { role: 'in', text: `Done — you’re in the queue. ${companyName} will confirm shortly 🎉` },
  ] as const;

  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);
  const started = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let i = 0;
    let alive = true;
    const step = () => {
      if (!alive || i >= script.length) return;
      const incoming = script[i].role === 'in';
      if (incoming) {
        setTyping(true);
        setTimeout(() => {
          if (!alive) return;
          setTyping(false);
          setVisible((v) => v + 1);
          i += 1;
          setTimeout(step, 700);
        }, 1200);
      } else {
        setVisible((v) => v + 1);
        i += 1;
        setTimeout(step, 1000);
      }
    };
    const t = setTimeout(step, 800);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' });
  }, [visible, typing]);

  return (
    <figure className="mx-auto w-full max-w-[340px]">
      <div className="rounded-[42px] bg-[#151821] p-[10px] shadow-2xl">
        <div className="overflow-hidden rounded-[34px] bg-white">
          <div className="flex items-center gap-2.5 border-b border-black/10 px-4 py-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
              style={{ backgroundColor: accent }}
            >
              {getMonogram(companyName)}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-black">{companyName}</p>
              <p className="text-[11px] text-[#8e8e93]">usually replies in minutes</p>
            </div>
          </div>
          <div ref={boxRef} className="flex h-[360px] flex-col gap-1.5 overflow-y-auto px-3 py-3">
            {script.slice(0, visible).map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'out' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-[16px] px-3 py-1.5 text-[13px] leading-snug ${
                    m.role === 'out' ? 'rounded-br-[4px] text-white' : 'rounded-bl-[4px] bg-[#E9E9EB] text-black'
                  }`}
                  style={m.role === 'out' ? { backgroundColor: accent } : undefined}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-[16px] rounded-bl-[4px] bg-[#E9E9EB] px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8e8e93]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8e8e93] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8e8e93] [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
        Actual quote flow · no app to download
      </figcaption>
    </figure>
  );
}

function TrustCell({ big, small }: { big: React.ReactNode; small: React.ReactNode }) {
  return (
    <div className="border-l border-border px-3 py-5 text-center first:border-l-0">
      <b className="block font-mono text-lg font-medium text-foreground">{big}</b>
      <span className="text-xs text-muted-foreground">{small}</span>
    </div>
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
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
