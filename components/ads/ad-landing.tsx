import { HOMEBIDS_LOGO_SMALL } from "@/lib/brand/logo-small";
import { smsHrefFor, smsTargetFor, type LandingPage } from "@/lib/ads/landing-pages";
import type { ExperienceConfig } from "@/lib/ads/experience-engine";
import { AdLandingClient } from "@/components/ads/ad-landing-client";

/**
 * ADLAND v2 — "the replica" (Tim, Oct 9/10): the reference homeowner experience page, rebuilt 1:1 with our
 * brand, our numbers and our copy. One screen, no scroll:
 *
 *   iridescent wave field + glows + particles (SVG, CSS-animated)
 *   wordmark · "Meet your new" + typewriter trade (or the creative's fixed headline) · subline · subcopy
 *   realistic iPhone (gradient frame, Dynamic Island, iMessage header, conversation, compose bar)
 *   black "Open iMessage" pill + caption — and the WHOLE page is the link (tap anywhere → Messages)
 *
 * Server component: markup + scoped CSS only (rendered once, in the HTML — nothing here crosses the client
 * boundary, so the page stays small). The conversation / typewriter / hue shift are driven by
 * lib/ads/experience-engine.ts from the client island (components/ads/ad-landing-client.tsx), which also owns
 * the full-page link, the Android label, the desktop fallback (number + QR) and the pixel / CAPI beacon.
 * All copy comes from lib/ads/landing-pages.ts; nothing from the URL is rendered.
 */

const BLUE = "#0a84ff";

// ───────────────────────────── scoped CSS (reference values, verbatim, under .hbx) ─────────────────────────────
const CSS = `
html,body{height:100%;overflow:hidden!important}
.hbx{--blue:${BLUE};--ink:#101114;--muted:#71747b;color:var(--ink);color-scheme:light;-webkit-font-smoothing:antialiased;font-family:inherit}
.hbx,.hbx *{box-sizing:border-box}
.hbx.experience{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;height:100dvh;min-height:0;padding:clamp(12px,2.6dvh,28px) 16px max(10px,env(safe-area-inset-bottom));background:radial-gradient(at 50% 40%,#fff 25%,#f8fbff 75%,#fff 100%);gap:0;overflow:hidden}
.hbx .intro{text-align:center;z-index:2;flex:0 0 auto;position:relative}
.hbx .wordmark{height:38px;display:flex;align-items:center;justify-content:center;margin:0 auto clamp(5px,1.2dvh,13px)}
.hbx .wordmark img{height:27px;width:auto;display:block}
.hbx h1{letter-spacing:-.052em;margin:0;font-size:clamp(28px,5.1dvh,55px);font-weight:800;line-height:1.03;color:var(--ink)}
.hbx .trade{color:var(--blue);white-space:nowrap;letter-spacing:-.05em;height:1.17em;font-size:clamp(34px,6.2dvh,66px);display:block}
.hbx .trade.long{font-size:clamp(26px,4.6dvh,50px)}
.hbx .cursor{background:var(--blue);vertical-align:-.035em;border-radius:3px;width:3px;height:.9em;margin-left:5px;animation:hbx-blink 1s step-end infinite;display:inline-block}
.hbx .intro p{letter-spacing:-.02em;margin:6px 0 0;font-size:clamp(15px,2dvh,21px);font-weight:500;color:var(--ink)}
.hbx .intro .subcopy{color:#737780;margin-top:2px;font-size:clamp(13px,1.7dvh,17px);font-weight:400}
.hbx .phone-stage{z-index:2;perspective:1200px;flex:1 1 0%;justify-content:center;align-items:center;width:100%;min-height:0;padding:clamp(8px,1.8dvh,20px) 0 12px;display:flex;position:relative}
.hbx .phone{aspect-ratio:.493/1;background:linear-gradient(105deg,#c9c6bf,#363735 5%,#b7b4ad 8%,#eeeae3 43%,#4c4b49 90%,#d7d3cc 95%,#77756f);border-radius:clamp(32px,5.5dvh,61px);height:100%;max-height:650px;padding:7px;position:relative;box-shadow:#a3a29e 0 0 0 1px,rgba(36,47,66,.565) 0 18px 24px -16px,rgba(56,87,119,.314) 0 34px 60px -32px;container-type:inline-size}
.hbx .phone::after,.hbx .phone::before{content:"";background:linear-gradient(#555,#bbb,#555);border-radius:2px;width:3px;position:absolute;left:-3px}
.hbx .phone::before{height:8%;top:24%}
.hbx .phone::after{height:8%;top:34%}
.hbx .phone-screen{border-radius:inherit;background:linear-gradient(100deg,#fff,#fdfdfd);border:5px solid #080909;flex-direction:column;height:100%;overflow:hidden}
.hbx .phone-screen,.hbx .status-bar{display:flex;position:relative}
.hbx .status-bar{flex:0 0 auto;justify-content:space-between;align-items:center;height:12cqw;padding:0 8cqw;font:600 4.5cqw -apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#101114}
.hbx .island{background:#000;border-radius:20px;width:29cqw;height:7.5cqw;position:absolute;top:2cqw;left:50%;transform:translate(-50%)}
.hbx .island::after{content:"";background:#152235;border-radius:50%;width:1.5cqw;height:1.5cqw;position:absolute;top:3cqw;right:3cqw;box-shadow:#35649a 0 0 2px inset}
.hbx .status-icons{width:16cqw;height:4cqw;display:block}
.hbx .contact{background:rgba(250,250,251,.85);border-bottom:1px solid #f3f3f3;flex:0 0 auto;justify-content:center;align-items:center;height:23cqw;display:flex;position:relative}
.hbx .back{color:var(--blue);font:300 12cqw/.7 Arial;position:absolute;top:4cqw;left:5cqw}
.hbx .contact-person{text-align:center}
.hbx .avatar{letter-spacing:-.8cqw;background:linear-gradient(#fff,#eceef0);border:1px solid #dfe2e7;border-radius:50%;justify-content:center;align-items:center;width:12cqw;height:12cqw;margin:auto auto 1cqw;padding-right:1cqw;font:600 7.3cqw Arial;display:flex;color:#17171a}
.hbx .avatar.emoji{letter-spacing:0;padding-right:0;font-size:6.5cqw}
.hbx .avatar b,.hbx .mini-avatar b{color:var(--blue)}
.hbx .contact strong{font:600 max(10px,3.8cqw) -apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#101114;display:block}
.hbx .contact strong span{color:#a9acb0;margin-left:1cqw}
.hbx .contact small{display:block;color:#8e9197;font:400 max(8px,2.8cqw) -apple-system,BlinkMacSystemFont,Arial,sans-serif;margin-top:.4cqw}
.hbx .video{width:6cqw;height:6cqw;color:var(--blue);position:absolute;top:7cqw;right:5cqw}
.hbx .conversation-region{isolation:isolate;flex-direction:column;flex:1 1 0%;min-height:0;display:flex;position:relative;overflow:hidden}
.hbx .messages{scrollbar-width:none;overscroll-behavior:contain;flex:1 1 0%;min-height:0;padding:2.5cqw 3cqw 3cqw;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;overflow-y:auto;transition:opacity .25s}
.hbx .messages::-webkit-scrollbar{display:none}
.hbx.experience[data-phase="clearing"] .messages,.hbx.experience[data-phase="deleting"] .messages{opacity:0}
.hbx .message-date{text-align:center;color:#919298;margin-bottom:3cqw;font-size:max(8px,3cqw);line-height:1.45}
.hbx .message-row{align-items:flex-end;gap:1.7cqw;margin:0 0 2.6cqw;display:flex}
.hbx .message-row.outgoing{justify-content:flex-end;padding-left:12cqw}
.hbx .message-row.incoming{padding-right:4cqw}
.hbx .message-row.row-in{animation:hbx-row-in .28s cubic-bezier(.2,.8,.3,1.1) both}
.hbx .final-response{margin-top:12px}
.hbx .bubble{letter-spacing:-.02em;text-align:left;border-radius:5cqw;max-width:100%;padding:2.6cqw 3.3cqw;font-size:max(11px,4.2cqw);line-height:1.3;position:relative}
.hbx .outgoing .bubble{background:var(--blue);color:#fff;border-bottom-right-radius:1.4cqw}
.hbx .incoming .bubble{color:#171719;background:#ececef;border-bottom-left-radius:1.4cqw}
.hbx .mini-avatar{letter-spacing:-.5cqw;background:#fff;border:1px solid #e8e8eb;border-radius:50%;justify-content:center;width:7cqw;height:7cqw;margin-bottom:.5cqw;padding-right:.5cqw;font:600 4cqw Arial;color:#17171a}
.hbx .mini-avatar.emoji{letter-spacing:0;padding-right:0;font-size:3.8cqw}
.hbx .compose,.hbx .mini-avatar{flex:0 0 auto;align-items:center;display:flex}
.hbx .compose{color:#b2b3b7;gap:2cqw;height:12cqw;padding:0 4cqw;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif}
.hbx .plus{color:#929399;text-align:center;width:7cqw;font-size:7cqw}
.hbx .compose>div{border:1px solid #e0e1e5;border-radius:10cqw;flex:1 1 0%;justify-content:space-between;align-items:center;padding:2cqw 3cqw;font-size:4cqw;display:flex}
.hbx .compose>div span{color:#a8a9ad}
.hbx .compose>div svg{color:#a8a9ad;width:3.5cqw;height:4.5cqw}
.hbx .home-indicator{background:#111;border-radius:20px;flex:0 0 auto;width:33cqw;height:1.3cqw;margin:3cqw auto 2cqw}
.hbx .typing{align-items:center;gap:1.3cqw;min-width:14cqw;min-height:10cqw;padding:3.5cqw 3.8cqw;display:flex;position:relative;border-radius:6cqw!important}
.hbx .typing::after,.hbx .typing::before{content:"";background:#ececef;border-radius:50%;width:3cqw;height:3cqw;position:absolute;bottom:-.6cqw;left:-.7cqw}
.hbx .typing::after{width:1.5cqw;height:1.5cqw;bottom:-1.6cqw;left:-1.7cqw}
.hbx .typing i{background:#929299;border-radius:50%;width:2cqw;height:2cqw;animation:hbx-typing .96s ease-in-out infinite}
.hbx .typing i:nth-child(2){animation-delay:.16s}
.hbx .typing i:nth-child(3){animation-delay:.32s}
.hbx .tapback{z-index:2;transform-origin:70% 100%;pointer-events:none;background:#e2e3e8;border:2px solid #fff;border-radius:14px;justify-content:center;align-items:center;min-width:27px;height:23px;padding:1px 5px;font:700 13px -apple-system,BlinkMacSystemFont,sans-serif;animation:hbx-tapback .32s cubic-bezier(.18,.8,.3,1.3) both;display:flex;position:absolute;top:-12px;right:2cqw;box-shadow:rgba(24,38,60,.082) 0 1px 3px}
.hbx .bubble.has-card{padding-bottom:2.4cqw}
.hbx .ecard{display:flex;flex-direction:column;gap:.5cqw;margin-top:2.4cqw;background:#fff;color:#17171a;border:1px solid #e3e4ea;border-radius:3.2cqw;padding:2.6cqw 3cqw;font-size:max(10px,3.5cqw);line-height:1.3;letter-spacing:-.01em}
.hbx .ecard b{font-size:max(10px,3.7cqw);font-weight:700}
.hbx .ecard span{color:#55585f}
.hbx .ecard em{font-style:normal;color:var(--blue);font-weight:600;margin-top:.8cqw}
.hbx .cta-container{z-index:10;text-align:center;flex:0 0 auto;width:min(100%,390px);position:relative}
.hbx .message-cta{color:#fff;letter-spacing:-.035em;background:linear-gradient(170deg,#2a2b2e,#080909 65%);border-radius:100px;justify-content:center;align-items:center;gap:17px;width:100%;height:clamp(54px,7.6dvh,76px);font-size:clamp(21px,3dvh,29px);font-weight:700;text-decoration:none;transition:transform .2s,box-shadow .2s;display:flex;box-shadow:rgba(255,255,255,.376) 0 1px 3px inset,rgba(24,35,51,.44) 0 12px 25px -12px}
.hbx .message-cta:hover{transform:translateY(-2px);box-shadow:rgba(255,255,255,.376) 0 1px 3px inset,rgba(24,35,51,.5) 0 15px 25px -12px}
.hbx .message-cta:active{transform:scale(.98)}
.hbx .message-cta:focus-visible{outline:3px solid var(--blue);outline-offset:4px}
.hbx .messages-icon{width:clamp(35px,5dvh,48px);height:clamp(35px,5dvh,48px);flex:0 0 auto}
.hbx .cta-container p{color:#747780;margin:8px 0 0;font-size:clamp(13px,1.8dvh,17px)}
.hbx .ambient{z-index:0;pointer-events:none;inset:0;overflow:hidden}
.hbx .ambient,.hbx .glow{position:absolute}
.hbx .glow{filter:blur(60px);opacity:.455;border-radius:50%;width:75vw;height:80dvh}
.hbx .glow-one{background:radial-gradient(#9dcbff,rgba(0,0,0,0) 65%);top:18%;left:-50%}
.hbx .glow-two{background:radial-gradient(#c7c9fc,rgba(0,0,0,0) 60%);top:12%;right:-50%}
.hbx .waves{opacity:.95;transform-origin:50% center;width:110%;height:100%;animation:hbx-wave-drift 13.6s ease-in-out infinite alternate;position:absolute;top:0;left:-5%;overflow:visible;transition:filter 1.2s}
.hbx .wave-right{animation-delay:-8s}
.hbx .wave-shine{opacity:0;background:radial-gradient(at 50% 66%,rgba(139,215,255,.52),rgba(0,0,0,0) 62%);transition:opacity .8s;position:absolute;inset:0}
.hbx .ambient.complete .wave-shine{opacity:.9}
.hbx .particle{opacity:.45;background:#80b7f8;border-radius:50%;width:3px;height:3px;animation:hbx-float 9s ease-in-out infinite alternate;position:absolute}
.hbx .path-shimmer{stroke-dasharray:2,18,4,28,2,1700;opacity:.85;animation:hbx-path-shimmer 8s linear infinite}
.hbx .motion-toggle{right:16px;top:max(16px,env(safe-area-inset-top));z-index:20;color:#848a94;cursor:pointer;background:rgba(255,255,255,.667);border:1px solid #e5e9ef;border-radius:50%;place-items:center;width:30px;height:30px;display:grid;position:absolute;padding:0}
.hbx .motion-toggle svg{width:12px;height:12px;display:block}
.hbx .motion-toggle .ico-play{display:none}
.hbx .motion-toggle.is-paused .ico-pause{display:none}
.hbx .motion-toggle.is-paused .ico-play{display:block}
.hbx .motion-toggle:focus-visible{outline:2px solid var(--blue);outline-offset:3px}
.hbx.motion-paused *,.hbx.motion-paused ::after,.hbx.motion-paused ::before{animation-play-state:paused!important}
.hbx .page-message-link{z-index:15;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;display:block;position:absolute;inset:0}
.hbx .page-message-link:focus-visible{outline:3px solid var(--blue);outline-offset:-5px;border-radius:8px}
.hbx.experience:has(.page-message-link:focus-visible) .message-cta{outline:3px solid var(--blue);outline-offset:4px}
@media(hover:hover){.hbx.experience:has(.page-message-link:hover) .message-cta{box-shadow:rgba(255,255,255,.376) 0 1px 3px inset,rgba(24,35,51,.5) 0 15px 25px -12px;transform:translateY(-2px)}}
.hbx.experience:has(.page-message-link:active) .message-cta{transform:scale(.98)}
.hbx .sms-fallback{z-index:30;bottom:max(104px,calc(env(safe-area-inset-bottom) + 100px));color:#252a32;text-align:left;background:rgba(255,255,255,.97);border:1px solid #dce3ef;border-radius:20px;width:min(360px,100% - 32px);max-height:calc(100dvh - 130px);padding:18px;font-size:14px;position:absolute;left:50%;overflow:auto;transform:translate(-50%);box-shadow:rgba(23,36,59,.25) 0 12px 55px}
.hbx .sms-fallback strong{font-size:17px;display:block;padding-right:28px}
.hbx .sms-fallback p{margin:7px 0 12px;line-height:1.4}
.hbx .sms-fallback label{color:#6c7380;margin:7px 0;font-size:12px;display:block}
.hbx .sms-fallback input{color:#15191e;user-select:text;background:#f4f7fb;border:1px solid #e1e7ee;border-radius:8px;width:100%;margin-top:3px;padding:8px;font-size:16px;font-family:inherit;display:block}
.hbx .fallback-close{color:#69717d;cursor:pointer;background:0 0;border:0;width:32px;height:32px;font-size:25px;line-height:1;position:absolute;top:8px;right:9px;padding:0}
.hbx .fallback-qr{display:flex;align-items:center;gap:14px;margin:4px 0 6px}
.hbx .fallback-qr svg{width:104px;height:104px;flex:0 0 auto;border:1px solid #e1e7ee;border-radius:10px;padding:6px;background:#fff}
.hbx .fallback-qr p{margin:0;font-size:13px;color:#525a66}
.hbx .fallback-actions{gap:8px;margin-top:12px;display:flex}
.hbx .fallback-actions button{color:#fff;cursor:pointer;background:#0a84ff;border:0;border-radius:10px;flex:1 1 0%;padding:10px 5px;font-size:14px;font-weight:600;font-family:inherit}
.hbx .sms-fallback .fallback-hint{color:#6c7380;margin-bottom:0;font-size:12px}
.hbx .copy-status{color:#235e97;min-height:18px;margin-top:5px;font-size:12px;display:block}
.hbx .sr-only{clip:rect(0 0 0 0);white-space:nowrap;border:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}
@keyframes hbx-blink{50%{opacity:0}}
@keyframes hbx-wave-drift{0%{transform:translate(-1%,1%) rotate(-2deg) scale(1.01)}100%{transform:translate(2%,-1%) rotate(2deg) scale(1.05)}}
@keyframes hbx-typing{50%{opacity:.45;transform:translateY(-.9cqw)}}
@keyframes hbx-float{100%{opacity:.1;transform:translate(35px,-40px)}}
@keyframes hbx-path-shimmer{0%{stroke-dashoffset:1800px;opacity:.15}40%{opacity:.9}100%{stroke-dashoffset:-1800px;opacity:.15}}
@keyframes hbx-tapback{0%{opacity:0;transform:scale(.45) rotate(-8deg)}70%{opacity:1;transform:scale(1.1) rotate(2deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes hbx-row-in{0%{opacity:0;transform:translateY(8px) scale(.96)}100%{opacity:1;transform:none}}
@media(max-width:600px){
.hbx.experience{padding-top:max(12px,env(safe-area-inset-top))}
.hbx .wordmark{height:32px;margin-bottom:2px}
.hbx .wordmark img{height:23px}
.hbx h1{font-size:clamp(25px,4.2dvh,36px)}
.hbx .trade{letter-spacing:-.045em;height:1.25em;font-size:min(8.7vw,5.5dvh)}
.hbx .trade.long{font-size:min(6.6vw,4.4dvh)}
.hbx .intro p{margin-top:2px;font-size:16px}
.hbx .intro .subcopy{margin-top:2px;font-size:13px}
.hbx .phone-stage{padding-top:14px;padding-bottom:13px}
.hbx .phone{max-height:590px}
.hbx .cta-container{max-width:340px}
.hbx .message-cta{height:58px;font-size:23px}
.hbx .messages-icon{width:39px;height:39px}
.hbx .cta-container p{margin-top:7px;font-size:14px}
.hbx .glow{width:140vw}
.hbx .waves{width:210%;left:-55%}
.hbx .motion-toggle{right:10px;top:max(12px,env(safe-area-inset-top));width:27px;height:27px}
}
@media(max-height:650px){
.hbx.experience{padding-top:6px}
.hbx .wordmark{height:26px;margin-bottom:0}
.hbx .wordmark img{height:19px}
.hbx h1{font-size:27px}
.hbx .trade{height:1.1em;font-size:min(8.3vw,35px)}
.hbx .trade.long{font-size:min(6.3vw,27px)}
.hbx .intro p{font-size:14px}
.hbx .intro .subcopy{font-size:12px}
.hbx .phone-stage{padding-top:7px;padding-bottom:8px}
.hbx .message-cta{height:49px;font-size:20px}
.hbx .messages-icon{width:33px;height:33px}
.hbx .cta-container p{margin-top:4px;font-size:12px}
}
@media(max-height:480px) and (orientation:landscape){
.hbx.experience{grid-template-rows:1fr auto;grid-template-columns:1fr 1fr;gap:8px 20px;padding:12px 28px;display:grid}
.hbx .intro{grid-area:1/1;align-self:center}
.hbx .phone-stage{grid-area:1/2/3;height:100%;padding:0}
.hbx .cta-container{grid-area:2/1;justify-self:center}
.hbx .trade{font-size:clamp(22px,4vw,38px)}
.hbx .wordmark{margin-bottom:8px}
.hbx .phone{max-height:100%}
.hbx .intro p{font-size:14px}
}
@media(prefers-reduced-motion:reduce){
.hbx *,.hbx ::after,.hbx ::before{scroll-behavior:auto!important;transition:none!important;animation:none!important}
.hbx .cursor{opacity:1}
.hbx .wave-shimmers{display:none}
}
`;

// ───────────────────────────── ambient wave field (reference geometry) ─────────────────────────────
function Waves() {
  const iridescent = Array.from({ length: 34 }, (_, s) => (
    <path
      key={`i${s}`}
      d={`M -180 ${180 + 12 * s} C 110 ${150 + 15 * s}, 180 ${620 - 2 * s}, 640 ${690 + 4 * s} S 1130 ${350 + 13 * s}, 1620 ${360 + 14 * s}`}
      strokeWidth={s % 7 === 0 ? 2 : 0.8}
    />
  ));
  const silver = Array.from({ length: 22 }, (_, s) => (
    <path
      key={`s${s}`}
      d={`M -100 ${740 + 10 * s} C 260 ${820 - 4 * s}, 380 ${270 + 8 * s}, 780 ${530 + 6 * s} S 1270 ${840 - 4 * s}, 1580 ${390 + 13 * s}`}
      strokeWidth={1.1}
    />
  ));
  const shimmers = Array.from({ length: 6 }, (_, i) => (
    <use
      key={`sh${i}`}
      href={i % 2 === 0 ? "#hbx-shimmer-left" : "#hbx-shimmer-right"}
      className="path-shimmer"
      style={{ animationDelay: `${(-1.6 * i).toFixed(1)}s` }}
    />
  ));
  const right = Array.from({ length: 20 }, (_, s) => (
    <path
      key={`r${s}`}
      d={`M 1580 ${190 + 15 * s} C 1190 ${270 + 11 * s}, 1200 ${710 - 3 * s}, 760 ${730 + 2 * s} S 140 ${430 + 11 * s}, -100 ${550 + 12 * s}`}
      strokeWidth={0.7}
    />
  ));
  const particles = Array.from({ length: 18 }, (_, i) => (
    <i
      key={`p${i}`}
      className="particle"
      style={{ left: `${(37 * i) % 100}%`, top: `${25 + ((13 * i) % 65)}%`, animationDelay: `${(-0.7 * i).toFixed(1)}s` }}
    />
  ));
  return (
    <div className="ambient" data-x-ambient aria-hidden="true">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="wave-shine" />
      <svg className="waves" data-x-waves viewBox="0 0 1440 1000" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="hbx-iridescent" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#bad7fc" stopOpacity="0.1" />
            <stop offset="0.25" stopColor="#0A84FF" stopOpacity="0.72" />
            <stop offset="0.42" stopColor="#bbb8ff" stopOpacity="0.96" />
            <stop offset="0.52" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.59" stopColor="#f4cfee" stopOpacity="0.84" />
            <stop offset="0.68" stopColor="#66dafa" stopOpacity="0.91" />
            <stop offset="1" stopColor="#c5e8ff" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="hbx-silver" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e9f6ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#dceaff" stopOpacity="0.58" />
            <stop offset="1" stopColor="#b5c7f6" stopOpacity="0" />
          </linearGradient>
          <path id="hbx-shimmer-left" d="M -180 288 C 110 285,180 602,640 726 S 1130 467,1620 486" />
          <path id="hbx-shimmer-right" d="M 1580 310 C 1190 358,1200 686,760 746 S 140 518,-100 646" />
        </defs>
        <g stroke="url(#hbx-iridescent)" strokeLinecap="round">{iridescent}</g>
        <g stroke="url(#hbx-silver)" strokeLinecap="round">{silver}</g>
        <g className="wave-shimmers" stroke="#d9faff" strokeWidth="2.4" strokeLinecap="round">{shimmers}</g>
      </svg>
      <svg className="waves wave-right" viewBox="0 0 1440 1000" preserveAspectRatio="none" fill="none">
        <g stroke="url(#hbx-iridescent)" strokeLinecap="round" opacity="0.55">{right}</g>
      </svg>
      {particles}
    </div>
  );
}

// ───────────────────────────── small inline icons ─────────────────────────────
const ICON_STATUS = (
  <svg className="status-icons" viewBox="0 0 64 16" aria-hidden="true" fill="currentColor">
    <rect x="0" y="10" width="3" height="6" rx="1" />
    <rect x="5" y="7.5" width="3" height="8.5" rx="1" />
    <rect x="10" y="5" width="3" height="11" rx="1" />
    <rect x="15" y="2" width="3" height="14" rx="1" />
    <path d="M30 6.2a9.4 9.4 0 0 1 11.6 0l-1.5 1.8a7.1 7.1 0 0 0-8.6 0zM32.6 9.4a5.6 5.6 0 0 1 6.4 0l-1.5 1.9a3.3 3.3 0 0 0-3.4 0zM35.2 12.6a2 2 0 0 1 1.6 0L35.8 14z" />
    <rect x="46" y="2.5" width="15" height="11" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.3" />
    <rect x="47.6" y="4.1" width="11.8" height="7.8" rx="1.8" />
    <path d="M62.2 6v4a1.8 1.8 0 0 0 0-4z" fillOpacity="0.4" />
  </svg>
);
const ICON_VIDEO = (
  <svg className="video" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <rect x="2.5" y="6" width="13" height="12" rx="3" />
    <path d="M15.5 10.5 21 7.5v9l-5.5-3z" />
  </svg>
);
const ICON_MIC = (
  <svg viewBox="0 0 14 18" aria-hidden="true" fill="currentColor">
    <rect x="4" y="0.5" width="6" height="10" rx="3" />
    <path d="M1.5 7.5a5.5 5.5 0 0 0 11 0h-1.6a3.9 3.9 0 0 1-7.8 0zM6.2 13h1.6v3.2h2.4V18H3.8v-1.8h2.4z" />
  </svg>
);
const ICON_MESSAGES = (
  <svg className="messages-icon" viewBox="0 0 62 62" aria-hidden="true">
    <defs>
      <linearGradient id="hbx-msg-green" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#66ef76" />
        <stop offset="1" stopColor="#02c827" />
      </linearGradient>
    </defs>
    <rect width="62" height="62" rx="15" fill="url(#hbx-msg-green)" />
    <path fill="#fff" d="M53 29c0 11-10 19-22 19-3 0-5 0-8-1l-10 5 3-9c-5-3-8-8-8-14 0-10 10-19 23-19s22 9 22 19Z" />
  </svg>
);
const ICON_PAUSE = (
  <svg className="ico-pause" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">
    <rect x="1.5" y="1" width="3.2" height="10" rx="1" />
    <rect x="7.3" y="1" width="3.2" height="10" rx="1" />
  </svg>
);
const ICON_PLAY = (
  <svg className="ico-play" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">
    <path d="M2.5 1.2v9.6L10.5 6z" />
  </svg>
);

const isEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s);

/** The conversation set for the engine: one scene per rotating word (first word = the creative's own thread). */
export function experienceConfigFor(page: LandingPage): ExperienceConfig {
  const words = page.rotate && page.rotate.length ? page.rotate : [page.headline[1]];
  const scenes = words.map((word, i) => ({
    word,
    messages: i === 0 ? page.messages : page.scenes?.[word] ?? page.messages,
  }));
  return { scenes, rotate: words.length > 1, avatar: page.chat.avatar, avatarEmoji: isEmoji(page.chat.avatar) };
}

export function AdLanding({ page }: { page: LandingPage }) {
  const target = smsTargetFor(page.audience);
  const href = smsHrefFor(page);
  const cfg = experienceConfigFor(page);
  const longWord = cfg.scenes.some((s) => s.word.length > 14);
  const emojiAvatar = cfg.avatarEmoji;
  const avatarInitials = page.chat.avatar.slice(0, 2);

  return (
    <main className="hbx experience" data-hb-go={page.slug} data-hb-audience={page.audience}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {/* the whole page is the link + the desktop fallback card + the engine (client) */}
      <AdLandingClient slug={page.slug} audience={page.audience} href={href} phone={target.phone} display={target.display} body={page.smsBody} config={cfg} />

      <Waves />

      <button type="button" className="motion-toggle" data-x-toggle aria-label="Pause animation" aria-pressed="false">
        {ICON_PAUSE}
        {ICON_PLAY}
      </button>

      <header className="intro">
        <div className="wordmark">
          <img src={HOMEBIDS_LOGO_SMALL.dataUrl} width={HOMEBIDS_LOGO_SMALL.width} height={HOMEBIDS_LOGO_SMALL.height} alt="HomeBids" />
        </div>
        <h1 data-hb-headline>
          {page.headline[0]}
          <span className={`trade${longWord ? " long" : ""}`} data-x-trade aria-live="off">
            {cfg.scenes[0].word}
            <span className="cursor" data-x-cursor aria-hidden="true" />
          </span>
        </h1>
        <p data-hb-sub>{page.sub}</p>
        {page.sub2 && <p className="subcopy" data-hb-sub2>{page.sub2}</p>}
      </header>

      <div className="phone-stage" aria-hidden="true">
        <section className="phone">
          <div className="phone-screen">
            <div className="status-bar">
              <span>9:41</span>
              <span className="island" />
              {ICON_STATUS}
            </div>
            <div className="contact">
              <span className="back">‹</span>
              <div className="contact-person">
                <div className={`avatar${emojiAvatar ? " emoji" : ""}`}>
                  {emojiAvatar ? page.chat.avatar : <><b>{avatarInitials.slice(0, 1)}</b>{avatarInitials.slice(1)}</>}
                </div>
                <strong>
                  {page.chat.name}
                  <span>›</span>
                </strong>
                {page.chat.byline && <small>{page.chat.byline}</small>}
              </div>
              {ICON_VIDEO}
            </div>
            <div className="conversation-region">
              <div className="messages" data-x-messages data-hb-thread>
                <div className="message-date">
                  iMessage
                  <br />
                  Today 9:41 AM
                </div>
              </div>
            </div>
            <div className="compose">
              <span className="plus">+</span>
              <div>
                <span>iMessage</span>
                {ICON_MIC}
              </div>
            </div>
            <div className="home-indicator" />
          </div>
        </section>
      </div>

      <div className="cta-container">
        <a className="message-cta" href={href} rel="nofollow" tabIndex={-1} aria-hidden="true">
          {ICON_MESSAGES}
          <span data-hb-cta-label>Open iMessage</span>
        </a>
        <p data-hb-tag>{page.tag}</p>
      </div>
    </main>
  );
}
