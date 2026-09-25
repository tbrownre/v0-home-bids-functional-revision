'use client';

/**
 * /pro/[slug] — TEMPLATE v2 CHATDEMO (Sep 26, Tim's redesigned HTML).
 * Design + content ported 1:1 from contractor-landing-chat.html.
 * FUNCTIONALITY UNCHANGED from the live version:
 *   - every field merges from contractor_landing_pages.config
 *     (brand/copy/trust/cta) with contractor_profiles fallbacks
 *   - all "text us" links go to cta.sms_number (Ava's line) with the
 *     "(Ref: <slug>)" tag — the page-lead routing depends on that body
 *   - QR uses qrcode.react like before
 * Fixes Tim's two reports: phone demo capped at 342px (no more "iPad"),
 * sticky CTA is position:fixed to the real viewport bottom.
 * The "Chat online" panel is the HTML's scripted PREVIEW — client-side
 * only, sends nothing, books nothing.
 */

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('qrcode.react').then((m) => m.QRCodeSVG), {
  ssr: false,
  loading: () => <span className="mono" style={{ color: 'var(--mute)' }}>QR</span>,
});

interface LandingPageData {
  id: string;
  slug: string;
  config: {
    brand?: {
      company_name?: string;
      logo_url?: string;
      accent?: string;
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
    };
    reviews?: Array<{ title?: string; text?: string; name?: string; city?: string }>;
    meta?: Record<string, unknown>;
  };
  contractor_profiles?: {
    business_name?: string;
    contractor_logo_url?: string;
  };
}

function getMonogram(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const CSS = `
.hb2{--ink:#0B0E14;--paper:#FAFAF8;--card:#FFFFFF;--accent:#0A84FF;--accent-soft:#EAF3FF;--line:#E7E4DE;--mute:#5C6470;--ok:#1F9D55;--r-lg:20px;--r-md:14px;--shadow:0 1px 2px rgba(11,14,20,.05),0 12px 32px -16px rgba(11,14,20,.18);--display:"Red Hat Display",system-ui,sans-serif;--body:"Red Hat Text","Red Hat Display",system-ui,sans-serif;--mono:"Red Hat Mono",ui-monospace,monospace;}
.hb2, .hb2 *{box-sizing:border-box;margin:0;padding:0}
.hb2{font-family:var(--body);color:var(--ink);background:var(--paper);line-height:1.55;-webkit-font-smoothing:antialiased;padding-bottom:96px;min-height:100vh}
.hb2 img{max-width:100%;display:block}
.hb2 a{color:inherit}
.hb2 .wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.hb2 .mono{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.hb2 :focus-visible{outline:3px solid var(--accent);outline-offset:2px;border-radius:6px}
.hb2 section{padding:64px 0}
@media(min-width:900px){.hb2 section{padding:88px 0}}
.hb2 .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-family:var(--display);font-weight:700;font-size:17px;text-decoration:none;background:var(--accent);color:#fff;border-radius:999px;padding:16px 30px;box-shadow:0 10px 24px -10px rgba(10,132,255,.55);transition:transform .15s ease, box-shadow .15s ease;border:0;cursor:pointer}
.hb2 .btn:hover{transform:translateY(-1px);box-shadow:0 14px 30px -10px rgba(10,132,255,.6)}
.hb2 .btn:active{transform:translateY(0)}
.hb2 .btn svg{width:19px;height:19px;flex:none}
.hb2 .btn--sm{font-size:14.5px;padding:10px 18px;box-shadow:none}
.hb2 .btn-note{font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin-top:12px}
.hb2 .site-head{position:sticky;top:0;z-index:50;background:rgba(250,250,248,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.hb2 .site-head .wrap{display:flex;align-items:center;gap:12px;height:62px}
.hb2 .avatar{width:38px;height:38px;border-radius:12px;flex:none;background:var(--ink);color:#fff;display:grid;place-items:center;font-family:var(--display);font-weight:800;font-size:14px;letter-spacing:.02em}
.hb2 .site-head .name{font-family:var(--display);font-weight:800;font-size:16.5px}
.hb2 .site-head .rate{font-family:var(--mono);font-size:12px;color:var(--mute);margin-left:2px}
.hb2 .site-head .rate b{color:var(--ink);font-weight:500}
.hb2 .site-head .btn{margin-left:auto}
@media(max-width:759px){.hb2 .site-head .btn{display:none}.hb2 .site-head .rate{margin-left:auto}}
.hb2 .hero{padding:56px 0 64px}
.hb2 .hero .wrap{display:grid;gap:48px;align-items:center}
@media(min-width:900px){.hb2 .hero{padding:80px 0 96px}.hb2 .hero .wrap{grid-template-columns:1.05fr .95fr;gap:56px}}
.hb2 .eyebrow{color:var(--mute);margin-bottom:18px}
.hb2 .hero h1{font-family:var(--display);font-weight:800;font-size:clamp(33px,5.6vw,54px);line-height:1.06;letter-spacing:-.02em;margin-bottom:18px}
.hb2 .hero h1 em{font-style:normal;color:var(--accent)}
.hb2 .hero .sub{font-size:17.5px;color:var(--mute);max-width:46ch;margin-bottom:28px}
.hb2 .hero .sub b{color:var(--ink);font-weight:600}
.hb2 .phone-fig{margin:0}
.hb2 .phone{width:min(342px,100%);margin:0 auto;background:var(--ink);border-radius:46px;padding:11px;box-shadow:0 30px 60px -24px rgba(11,14,20,.45)}
.hb2 .screen{background:#fff;border-radius:36px;overflow:hidden;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}
.hb2 .p-status{display:flex;justify-content:space-between;align-items:center;padding:12px 22px 6px;font-size:13px;font-weight:600}
.hb2 .p-status .icons{display:flex;gap:5px;align-items:center;color:#111}
.hb2 .p-head{display:flex;align-items:center;gap:10px;padding:8px 14px 12px;border-bottom:1px solid #ECECEC}
.hb2 .p-head .avatar{width:34px;height:34px;border-radius:50%;font-size:12px;background:var(--accent)}
.hb2 .p-head .who b{display:block;font-size:14px;font-weight:600}
.hb2 .p-head .who span{font-size:11.5px;color:#7a7f87}
.hb2 .chat{padding:14px 12px 20px;display:flex;flex-direction:column;gap:7px;min-height:392px}
.hb2 .day{align-self:center;font-size:11px;color:#9aa0a8;margin-bottom:4px}
.hb2 .msg{max-width:80%;padding:9px 13px;border-radius:18px;font-size:14.5px;line-height:1.34;opacity:0;transform:translateY(10px) scale(.97);transition:opacity .32s ease,transform .32s ease}
.hb2 .msg.show{opacity:1;transform:none}
.hb2 .msg.in{background:#E9E9EB;color:#111;align-self:flex-start;border-bottom-left-radius:5px}
.hb2 .msg.out{background:#0A84FF;color:#fff;align-self:flex-end;border-bottom-right-radius:5px}
.hb2 .delivered{align-self:flex-end;font-size:10.5px;color:#9aa0a8;margin:-2px 6px 0 0;opacity:0;transition:opacity .3s}
.hb2 .delivered.show{opacity:1}
.hb2 .typing{display:none;align-self:flex-start;background:#E9E9EB;border-radius:18px;border-bottom-left-radius:5px;padding:12px 14px}
.hb2 .typing.on{display:flex;gap:4px}
.hb2 .typing i{width:7px;height:7px;border-radius:50%;background:#9aa0a8;animation:hb2blink 1.2s infinite}
.hb2 .typing i:nth-child(2){animation-delay:.18s}.hb2 .typing i:nth-child(3){animation-delay:.36s}
@keyframes hb2blink{0%,80%,100%{opacity:.35;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
.hb2 .phone-cap{text-align:center;font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;color:var(--mute);margin-top:16px;text-transform:uppercase}
.hb2 .trust{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:0;background:var(--card)}
.hb2 .trust .wrap{display:grid;grid-template-columns:repeat(2,1fr)}
@media(min-width:760px){.hb2 .trust .wrap{grid-template-columns:repeat(4,1fr)}}
.hb2 .trust a{text-decoration:none}
.hb2 .t-item{padding:22px 14px;text-align:center;border-left:1px solid var(--line)}
.hb2 .t-item:first-child{border-left:none}
@media(max-width:759px){.hb2 .t-item:nth-child(3){border-left:none}.hb2 .t-item:nth-child(n+3){border-top:1px solid var(--line)}}
.hb2 .t-item b{display:block;font-family:var(--mono);font-size:19px;font-weight:500;letter-spacing:-.01em}
.hb2 .t-item span{font-size:12.5px;color:var(--mute)}
.hb2 .t-item .link{color:var(--accent);text-decoration:underline;text-underline-offset:2px}
.hb2 .sec-head{max-width:560px;margin-bottom:40px}
.hb2 .sec-head .mono{color:var(--accent);margin-bottom:12px;display:block}
.hb2 .sec-head h2{font-family:var(--display);font-weight:800;font-size:clamp(26px,3.6vw,36px);letter-spacing:-.015em;line-height:1.12}
.hb2 .sec-head p{color:var(--mute);margin-top:12px;font-size:16px}
.hb2 .steps{display:grid;gap:14px}
@media(min-width:760px){.hb2 .steps{grid-template-columns:repeat(3,1fr);gap:18px}}
.hb2 .step{background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);padding:26px 24px}
.hb2 .step .num{font-family:var(--mono);font-size:13px;color:var(--accent);display:block;margin-bottom:14px}
.hb2 .step h3{font-family:var(--display);font-weight:700;font-size:19px;margin-bottom:8px}
.hb2 .step p{font-size:14.5px;color:var(--mute)}
.hb2 .step .kick{display:inline-block;margin-top:14px;font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ok)}
.hb2 .svc-grid{display:grid;gap:12px;grid-template-columns:repeat(2,1fr)}
@media(min-width:760px){.hb2 .svc-grid{grid-template-columns:repeat(3,1fr);gap:16px}}
.hb2 .svc{position:relative;display:block;background:var(--card);border:1px solid var(--line);border-radius:var(--r-md);padding:20px 18px;text-decoration:none;transition:border-color .15s ease, box-shadow .15s ease, transform .15s ease}
.hb2 .svc:hover{border-color:var(--accent);box-shadow:var(--shadow);transform:translateY(-2px)}
.hb2 .svc h3{font-family:var(--display);font-weight:700;font-size:16.5px;margin-bottom:6px;padding-right:8px}
.hb2 .svc .go{font-size:13px;font-weight:600;color:var(--accent)}
.hb2 .svc-foot{margin-top:22px;font-size:14.5px;color:var(--mute)}
.hb2 .svc-foot a{color:var(--accent);font-weight:600}
.hb2 .rev-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 18px;margin-bottom:28px}
.hb2 .rev-head .score{font-family:var(--display);font-weight:800;font-size:30px;letter-spacing:-.02em}
.hb2 .rev-head .of{color:var(--mute);font-size:14.5px}
.hb2 .rev-head .all{margin-left:auto;font-size:14.5px;font-weight:600;color:var(--accent);text-decoration:none}
.hb2 .rev-grid{display:grid;gap:14px}
@media(min-width:900px){.hb2 .rev-grid{grid-template-columns:repeat(3,1fr);gap:18px}}
.hb2 .rev{background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);padding:24px;display:flex;flex-direction:column;gap:14px}
.hb2 .rev .stars{color:#F5A623;font-size:14px;letter-spacing:2px}
.hb2 .rev h3{font-family:var(--display);font-weight:700;font-size:16px}
.hb2 .rev p{font-size:14.5px;color:#3a4149;flex:1}
.hb2 .rev .who{display:flex;align-items:center;gap:10px}
.hb2 .rev .who .avatar{width:34px;height:34px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-size:12px}
.hb2 .rev .who b{display:block;font-size:13.5px;color:var(--ink)}
.hb2 .rev .who span{font-size:12px;color:var(--mute)}
.hb2 .faq-list{max-width:680px}
.hb2 .faq{border-bottom:1px solid var(--line)}
.hb2 .faq summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;font-family:var(--display);font-weight:700;font-size:16.5px;padding:20px 0}
.hb2 .faq summary::-webkit-details-marker{display:none}
.hb2 .faq summary::after{content:"+";font-weight:500;font-size:22px;color:var(--mute);transition:transform .2s}
.hb2 .faq[open] summary::after{transform:rotate(45deg)}
.hb2 .faq p{padding:0 0 20px;color:var(--mute);font-size:15px;max-width:58ch}
.hb2 .final{background:var(--ink);color:#fff;padding:76px 0}
.hb2 .final .wrap{display:grid;gap:40px;align-items:center}
@media(min-width:900px){.hb2 .final .wrap{grid-template-columns:1.2fr .8fr}}
.hb2 .final h2{font-family:var(--display);font-weight:800;font-size:clamp(30px,4.4vw,44px);letter-spacing:-.02em;line-height:1.08;margin-bottom:14px}
.hb2 .final .sub{color:#B8BEC7;font-size:16.5px;margin-bottom:28px;max-width:44ch}
.hb2 .final .btn-note{color:#8A919B}
.hb2 .qr-card{display:none;background:#fff;color:var(--ink);border-radius:var(--r-lg);padding:26px;text-align:center;justify-self:center}
@media(min-width:900px){.hb2 .qr-card{display:block}}
.hb2 .qr-card .qrbox{width:132px;height:132px;margin:0 auto 14px;display:grid;place-items:center}
.hb2 .qr-card b{font-family:var(--display);font-weight:700;font-size:15px;display:block}
.hb2 .qr-card span{font-size:12.5px;color:var(--mute)}
.hb2 footer{padding:44px 0 56px;border-top:1px solid var(--line);font-size:13.5px;color:var(--mute)}
.hb2 footer .wrap{display:grid;gap:18px}
.hb2 footer .biz{font-family:var(--display);font-weight:800;font-size:15px;color:var(--ink)}
.hb2 footer .mono{font-size:11px}
.hb2 footer a{color:var(--accent);text-decoration:none;font-weight:600}
.hb2 footer .hb{padding-top:14px;border-top:1px solid var(--line);font-size:12.5px}
.hb2 .sticky-cta{position:fixed;left:0;right:0;bottom:0;z-index:60;background:rgba(250,250,248,.92);backdrop-filter:blur(10px);border-top:1px solid var(--line);padding:10px 16px calc(10px + env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:5px}
.hb2 .sticky-cta .btn{width:100%;max-width:420px;font-size:16px;padding:14px 24px}
.hb2 .sticky-cta small{font-family:var(--mono);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
@media(min-width:760px){.hb2 .sticky-cta{display:none}.hb2{padding-bottom:0}}
@media(prefers-reduced-motion:reduce){.hb2 .msg,.hb2 .delivered{opacity:1;transform:none;transition:none}.hb2 .typing{display:none!important}.hb2 .btn,.hb2 .svc{transition:none}}
`;

const SMS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export function EstimatePageContent({ page }: { page: LandingPageData }) {
  const config = page.config || {};
  const brand = config.brand || {};
  const copy = config.copy || {};
  const trust = config.trust || {};
  const cta = config.cta || {};
  const reviews = Array.isArray(config.reviews) ? config.reviews : [];

  const companyName = brand.company_name || page.contractor_profiles?.business_name || 'Your Local Pro';
  const monogram = getMonogram(companyName);
  const trade = (brand.trade || 'home service').toLowerCase();
  const city = brand.city || '';
  const since = brand.since || '';
  const cities = Array.isArray(brand.cities) && brand.cities.length ? brand.cities : city ? [city] : [];
  const services = Array.isArray(copy.services) ? copy.services : [];
  const smsNumber = cta.sms_number || '';
  const refParam = cta.ref || page.slug || 'direct';
  const rating = typeof trust.google_rating === 'number' ? trust.google_rating : undefined;
  const reviewCount = typeof trust.review_count === 'number' ? trust.review_count : undefined;
  const reviewsUrl = trust.google_reviews_url || '';
  const license = trust.license || '';
  const replyTime = trust.reply_time || '< 5 min';
  const jobs = trust.jobs || '';

  // FUNCTIONAL sms format — the (Ref:) tag drives page-lead routing. Unchanged.
  const smsBodyFor = (topic: string) =>
    `Hi Ava! I need help with ${topic} from ${companyName} (Ref: ${refParam})`;
  const smsHref = (topic: string) =>
    `sms:${smsNumber}?body=${encodeURIComponent(smsBodyFor(topic))}`;
  const mainSms = smsHref(`a ${trade} project`);

  // ── animated hero chat (ported from the template's script) ──
  const chatRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;
    const msgs: HTMLElement[] = Array.prototype.slice.call(chat.querySelectorAll('.msg'));
    const outs = msgs.filter((m) => m.classList.contains('out'));
    const lastOut = outs[outs.length - 1];
    const delivered = chat.querySelector<HTMLElement>('.delivered');
    const typing = chat.querySelector<HTMLElement>('.typing');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: number[] = [];

    const showAll = () => {
      msgs.forEach((m) => m.classList.add('show'));
      delivered?.classList.add('show');
      typing?.remove();
    };
    if (reduce) { showAll(); return; }

    let played = false;
    const play = () => {
      if (played) return;
      played = true;
      let t = 500;
      msgs.forEach((m, i) => {
        if (m.classList.contains('in')) {
          const d1 = t;
          timers.push(window.setTimeout(() => {
            if (typing) { chat.insertBefore(typing, m); typing.classList.add('on'); }
          }, d1));
          t += i === 0 ? 900 : 1300;
          const d2 = t;
          timers.push(window.setTimeout(() => {
            typing?.classList.remove('on');
            m.classList.add('show');
          }, d2));
        } else {
          t += 1100;
          const d = t;
          const isLast = m === lastOut;
          timers.push(window.setTimeout(() => {
            m.classList.add('show');
            if (isLast) delivered?.classList.add('show');
          }, d));
        }
        t += 600;
      });
      timers.push(window.setTimeout(() => typing?.remove(), t + 800));
    };

    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { play(); io?.disconnect(); }
        });
      }, { threshold: 0.35 });
      io.observe(chat);
    } else {
      showAll();
    }
    return () => { io?.disconnect(); timers.forEach(clearTimeout); };
  }, []);

  const heroEyebrow = [city, license ? 'Licensed & insured' : '', since ? `Since ${since}` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="hb2">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ===== header ===== */}
      <header className="site-head">
        <div className="wrap">
          <div className="avatar" aria-hidden="true">{monogram}</div>
          <span className="name">{companyName}</span>
          {rating !== undefined && reviewCount !== undefined && (
            <span className="rate"><b>{rating} ★</b> ({reviewCount})</span>
          )}
          {smsNumber && (
            <a className="btn btn--sm" href={mainSms}>Text for a free quote</a>
          )}
        </div>
      </header>

      <main>
        {/* ===== hero ===== */}
        <section className="hero">
          <div className="wrap">
            <div>
              {heroEyebrow && <p className="eyebrow mono">{heroEyebrow}</p>}
              <h1>
                Skip the phone calls. <em>Text us</em> — get a real {trade} quote in minutes.
              </h1>
              <p className="sub">
                Describe the problem, send a photo if it helps, and get an{' '}
                <b>itemized estimate — usually within 5 minutes.</b> Every quote is reviewed and
                confirmed by {companyName} before anything is scheduled.
              </p>
              {smsNumber && (
                <>
                  <a className="btn" href={mainSms}>
                    {SMS_ICON}
                    Text us for a free quote
                  </a>
                  <p className="btn-note">Opens your texting app · Free · No signup · No phone calls</p>
                </>
              )}
            </div>

            {/* the signature: live quote demo (capped at 342px — no more iPad) */}
            <figure
              className="phone-fig"
              role="img"
              aria-label={`Example text conversation: a homeowner describes a ${trade} problem, gets an estimate, and books an appointment — all by text.`}
            >
              <div className="phone" aria-hidden="true">
                <div className="screen">
                  <div className="p-status">
                    <span>9:41</span>
                    <span className="icons">
                      <svg width="46" height="12" viewBox="0 0 46 12" aria-hidden="true"><rect x="0" y="7" width="3" height="5" rx="1" fill="#111" /><rect x="5" y="5" width="3" height="7" rx="1" fill="#111" /><rect x="10" y="3" width="3" height="9" rx="1" fill="#111" /><rect x="15" y="1" width="3" height="11" rx="1" fill="#111" /><rect x="24" y="1" width="18" height="10" rx="3" fill="none" stroke="#111" strokeWidth="1.2" /><rect x="26" y="3" width="12" height="6" rx="1.5" fill="#111" /><rect x="43" y="4" width="2" height="4" rx="1" fill="#111" /></svg>
                    </span>
                  </div>
                  <div className="p-head">
                    <div className="avatar">{monogram}</div>
                    <div className="who"><b>{companyName}</b><span>usually replies in minutes</span></div>
                  </div>
                  <div className="chat" ref={chatRef}>
                    <span className="day">Today 10:14 AM</span>
                    <div className="msg in">Hi! I&apos;m Ava, {companyName}&apos;s assistant 👋 What can we help with today?</div>
                    <div className="msg out">I need help with a {trade} project at my place.</div>
                    <div className="msg in">Got it — describe it briefly, or text a photo if that&apos;s easier.</div>
                    <div className="msg out">Just sent a photo. How soon can someone look at it?</div>
                    <div className="msg in">✅ Thanks! You&apos;ll have an <b>itemized estimate</b> shortly — {companyName} reviews every quote before it&apos;s final.</div>
                    <div className="msg out">Perfect, thank you!</div>
                    <span className="delivered">Delivered</span>
                    <div className="msg in">Done — watch your texts. We usually reply in minutes 🎉</div>
                    <div className="typing"><i></i><i></i><i></i></div>
                  </div>
                </div>
              </div>
              <figcaption className="phone-cap">Actual quote flow · no app to download</figcaption>
            </figure>
          </div>
        </section>

        {/* ===== trust strip ===== */}
        {(rating !== undefined || license || jobs || replyTime) && (
          <div className="trust">
            <div className="wrap">
              {rating !== undefined && reviewCount !== undefined && (
                reviewsUrl ? (
                  <a className="t-item" href={reviewsUrl} target="_blank" rel="noopener noreferrer">
                    <b>{rating} ★</b>
                    <span><span className="link">{reviewCount} Google reviews</span></span>
                  </a>
                ) : (
                  <div className="t-item"><b>{rating} ★</b><span>{reviewCount} Google reviews</span></div>
                )
              )}
              <div className="t-item"><b>{replyTime}</b><span>average reply time</span></div>
              {license && <div className="t-item"><b>{license}</b><span>licensed &amp; insured</span></div>}
              {jobs && <div className="t-item"><b>{jobs}</b><span>local jobs done</span></div>}
            </div>
          </div>
        )}

        {/* ===== how it works ===== */}
        <section id="how">
          <div className="wrap">
            <div className="sec-head">
              <span className="mono">How it works</span>
              <h2>Three texts. One honest quote.</h2>
            </div>
            <div className="steps">
              <div className="step">
                <span className="num">01</span>
                <h3>Text us</h3>
                <p>Tap the button and your texting app opens with the first message ready. Ava replies right away — any hour, any day.</p>
                <span className="kick">No app · no account</span>
              </div>
              <div className="step">
                <span className="num">02</span>
                <h3>Answer a few questions</h3>
                <p>Describe the problem, your area, and timing. Photos help — send them right in the thread.</p>
                <span className="kick">About 2 minutes</span>
              </div>
              <div className="step">
                <span className="num">03</span>
                <h3>Get your quote &amp; book</h3>
                <p>You get an itemized estimate in the same thread. {companyName} reviews and confirms every quote before work is scheduled.</p>
                <span className="kick">Fast turnaround</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== services: each card prefills its own text ===== */}
        {services.length > 0 && smsNumber && (
          <section id="services" style={{ paddingTop: 0 }}>
            <div className="wrap">
              <div className="sec-head">
                <span className="mono">What we do</span>
                <h2>Tap your project. The text writes itself.</h2>
              </div>
              <div className="svc-grid">
                {services.map((service) => (
                  <a key={service} className="svc" href={smsHref(service)}>
                    <h3>{service}</h3>
                    <span className="go">Text about {service.toLowerCase()} →</span>
                  </a>
                ))}
              </div>
              <p className="svc-foot">
                Something else?{' '}
                <a href={mainSms}>Text us anyway</a> — we handle most {trade} projects.
              </p>
            </div>
          </section>
        )}

        {/* ===== reviews (only when real ones exist) ===== */}
        {reviews.length > 0 && (
          <section id="reviews" style={{ paddingTop: 0 }}>
            <div className="wrap">
              <div className="sec-head" style={{ marginBottom: 24 }}>
                <span className="mono">From your neighbors</span>
                <h2>{rating !== undefined ? `Rated ${rating} on Google` : 'What customers say'}</h2>
              </div>
              {rating !== undefined && reviewCount !== undefined && (
                <div className="rev-head">
                  <span className="score">{rating} ★</span>
                  <span className="of">{reviewCount} verified Google reviews</span>
                  {reviewsUrl && (
                    <a className="all" href={reviewsUrl} target="_blank" rel="noopener noreferrer">
                      Read them all on Google →
                    </a>
                  )}
                </div>
              )}
              <div className="rev-grid">
                {reviews.slice(0, 3).map((r, i) => (
                  <article className="rev" key={i}>
                    <span className="stars" aria-label="5 stars">★★★★★</span>
                    {r.title && <h3>{r.title}</h3>}
                    <p>{r.text}</p>
                    <div className="who">
                      <span className="avatar">{getMonogram(r.name || 'A B')}</span>
                      <span><b>{r.name}</b><span>{r.city}</span></span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== faq ===== */}
        <section id="faq" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="sec-head">
              <span className="mono">Fair questions</span>
              <h2>Before you text</h2>
            </div>
            <div className="faq-list">
              <details className="faq">
                <summary>Is the quote really free?</summary>
                <p>Yes — free and no obligation. You&apos;ll see an itemized estimate before you decide anything, and you can simply stop replying if it&apos;s not for you.</p>
              </details>
              <details className="faq">
                <summary>Am I texting a bot?</summary>
                <p>You&apos;ll start with Ava, {companyName}&apos;s AI assistant — that&apos;s how you get answers instantly, even at 9pm. {companyName} personally reviews and confirms every quote before any work is scheduled.</p>
              </details>
              <details className="faq">
                <summary>Will you spam me afterward?</summary>
                <p>No. We text you about your project — that&apos;s it. Reply STOP at any time and it stops.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      {/* ===== final CTA band ===== */}
      <section className="final">
        <div className="wrap">
          <div>
            <h2>Ready when you are.</h2>
            <p className="sub">Text us now — you&apos;ll usually have a real, itemized quote within minutes.</p>
            {smsNumber && (
              <a className="btn" href={mainSms}>
                {SMS_ICON}
                Text us for a free quote
              </a>
            )}
            <p className="btn-note">Open 7 days · Fast replies</p>
          </div>
          {smsNumber && (
            <div className="qr-card">
              <div className="qrbox">
                <QRCode value={mainSms} size={132} level="M" />
              </div>
              <b>On a computer?</b>
              <span>Scan with your phone camera<br />to start the text.</span>
            </div>
          )}
        </div>
      </section>

      {/* ===== footer ===== */}
      <footer>
        <div className="wrap">
          <div>
            <p className="biz">{companyName}</p>
            {city && <p>Honest, fast {trade} work{since ? ` since ${since}` : ''} — {city}.</p>}
          </div>
          {license && <p className="mono">{license} · licensed &amp; insured</p>}
          {cities.length > 0 && <p>Serving {cities.join(', ')}</p>}
          {smsNumber && (
            <p><a href={mainSms}>Text for a free quote</a></p>
          )}
          <p className="hb">
            © {new Date().getFullYear()} {companyName}. All rights reserved. · Landing page powered by <b>HomeBids.ai</b>
            <br />By texting, you agree to receive messages about your project.
          </p>
        </div>
      </footer>

      {/* ===== sticky mobile CTA — FIXED to the viewport bottom ===== */}
      {smsNumber && (
        <div className="sticky-cta">
          <a className="btn" href={mainSms}>Text us for a free quote</a>
          <small>Usually replies in minutes</small>
        </div>
      )}
    </div>
  );
}
