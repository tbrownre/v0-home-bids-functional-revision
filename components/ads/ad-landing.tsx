import { HOMEBIDS_LOGO_PNG } from "@/lib/brand/logo-png";
import { AUDIENCE_COPY, smsHrefFor, smsTargetFor, type ChatLine, type LandingPage } from "@/lib/ads/landing-pages";
import { AdLandingClient } from "@/components/ads/ad-landing-client";

/**
 * ADLAND (Tim + Abir, Oct 9): the ad creative, alive. Server-rendered, self-styled (no Tailwind dependency so the
 * same HTML works as a standalone preview), zero JS needed for the first screen — the iMessage conversation plays
 * itself with CSS keyframes generated per message, loops, and shows everything at once for reduced-motion users.
 *
 * First screen = the creative: logo · headline (black + blue italic) · subline · phone with the conversation ·
 * black "Open iMessage" pill · tag pill. Below: 3 proof lines, 3 steps, price + risk line, 3 FAQs, final CTA.
 * All copy comes from lib/ads/landing-pages.ts (message match with the ad). Nothing from the URL is rendered.
 */

const CYCLE_S = 13; // one loop of the conversation
const TYPE_S = 1.1; // typing dots before a reply
const GAP_S = 1.35; // gap between bubbles

function conversationKeyframes(slug: string, messages: ReadonlyArray<ChatLine>): string {
  // Spread the bubbles over the cycle, hold, fade everything, restart. Typing dots precede every "them".
  // Each bubble sits in a .cell that grows from 0 just before it appears, so the thread is bottom-anchored and
  // earlier messages push up and out of a fixed-height screen — exactly like Messages — and the phone never
  // grows taller than the first screen, however long the conversation is.
  const count = messages.length;
  const start = 0.6;
  const perMsg = GAP_S;
  const hold = 2.6;
  const total = start + count * perMsg + hold + 1.4;
  const scale = CYCLE_S / total; // stretch or squeeze the script to exactly one cycle
  const pct = (sec: number) => Math.min(99.9, Math.max(0, (sec * scale * 100) / CYCLE_S)).toFixed(2);
  const fadeOut = start + count * perMsg + hold;
  let css = "";
  for (let i = 0; i < count; i++) {
    const at = start + i * perMsg;
    const lead = messages[i].from === "them" ? TYPE_S : 0.3; // typing time for replies, a quick slide for "me"
    const grow = Math.max(0, at - lead);
    css += `@keyframes ${slug}-m${i}{0%,${pct(at)}%{opacity:0;transform:translateY(10px) scale(.96)}${pct(at + 0.35)}%,${pct(fadeOut)}%{opacity:1;transform:none}${pct(fadeOut + 0.5)}%,100%{opacity:0;transform:translateY(0) scale(.98)}}`;
    css += `@keyframes ${slug}-c${i}{0%,${pct(grow)}%{max-height:0}${pct(grow + 0.35)}%,${pct(fadeOut + 0.5)}%{max-height:160px}${pct(fadeOut + 0.9)}%,100%{max-height:0}}`;
    // typing dots for replies: visible during the gap before this bubble
    css += `@keyframes ${slug}-t${i}{0%,${pct(grow)}%{opacity:0}${pct(grow + 0.15)}%,${pct(at - 0.1)}%{opacity:1}${pct(at)}%,100%{opacity:0}}`;
  }
  return css;
}

const CSS = `
.hbgo{--blue:#0A84FF;--ink:#0B0B0F;--ink2:#4B5260;--ink3:#8A9097;--line:#E6E8EC;--bg:#FFFFFF;--pill:999px;--phone:#121214;--bubble-me:#0A84FF;--bubble-them:#E9E9EB;--green:#34C759;
  margin:0;background:var(--bg);color:var(--ink);font-family:'Red Hat Display',-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;min-height:100svh;position:relative;overflow-x:hidden}
.hbgo *{box-sizing:border-box}
.hbgo a{color:inherit;text-decoration:none}
.hbgo .aura{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.hbgo .aura i{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55}
.hbgo .aura i:nth-child(1){width:60vw;height:60vw;max-width:640px;max-height:640px;left:-18vw;top:14vh;background:radial-gradient(circle,#CFE5FF 0%,rgba(207,229,255,0) 70%)}
.hbgo .aura i:nth-child(2){width:56vw;height:56vw;max-width:600px;max-height:600px;right:-20vw;top:8vh;background:radial-gradient(circle,#E8D9FF 0%,rgba(232,217,255,0) 70%)}
.hbgo .aura i:nth-child(3){width:50vw;height:50vw;max-width:520px;max-height:520px;left:20vw;top:48vh;background:radial-gradient(circle,#D6FFF1 0%,rgba(214,255,241,0) 70%)}
.hbgo .wrap{position:relative;z-index:1;max-width:460px;margin:0 auto;padding:18px 20px 40px;text-align:center;display:flex;flex-direction:column}
.hbgo .copy{display:contents}
.hbgo .intro{order:1}.hbgo .device{order:2}.hbgo .cta-island{order:3}
@media(min-width:900px){.hbgo .wrap{max-width:1040px;display:grid;grid-template-columns:1fr 440px;column-gap:56px;align-items:center;text-align:left;padding:40px 32px 72px;min-height:92svh}.hbgo .copy{display:block;order:1}.hbgo .device{order:2}}
.hbgo .logo{display:inline-block;height:26px;width:auto;margin:10px auto 18px}
@media(min-width:900px){.hbgo .logo{margin:0 0 28px;height:30px}}
.hbgo h1{font-size:clamp(38px,10.5vw,52px);line-height:.98;letter-spacing:-.035em;font-weight:800;margin:0}
@media(min-width:900px){.hbgo h1{font-size:clamp(56px,6vw,76px)}}
.hbgo h1 .l2{display:block;color:var(--blue);font-style:italic;font-weight:800}
.hbgo h1 .l2.long{font-size:.68em;line-height:1.08}
@media(min-width:900px){.hbgo h1 .l2.long{font-size:.64em}}
.hbgo .rot{position:relative;display:inline-block;min-width:1ch;white-space:nowrap}
.hbgo .rot span{display:inline-block}
.hbgo .rot .alt{position:absolute;left:50%;top:0;transform:translateX(-50%);opacity:0;white-space:nowrap}
@media(min-width:900px){.hbgo .rot .alt{left:0;transform:none}}
.hbgo .rot .caret{display:inline-block;width:3px;height:.9em;background:var(--ink);margin-left:3px;vertical-align:-.08em;animation:hbgo-blink 1s steps(2) infinite}
@keyframes hbgo-blink{to{opacity:0}}
.hbgo .sub{color:var(--ink2);font-size:clamp(16px,4.4vw,19px);line-height:1.4;margin:14px auto 0;max-width:34ch;font-weight:500}
@media(min-width:900px){.hbgo .sub{margin:16px 0 0;font-size:20px;max-width:38ch}}
.hbgo .cta-wrap{margin-top:-30px;position:relative;z-index:2;padding:0 6px}
@media(min-width:900px){.hbgo .cta-wrap{margin-top:24px;padding:0}}
.hbgo .cta{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:62px;border-radius:var(--pill);background:#0B0B0F;color:#fff;font-weight:800;font-size:19px;padding:14px 22px;box-shadow:0 14px 34px rgba(11,11,15,.22);transition:transform .15s ease,box-shadow .15s ease}
.hbgo .cta:hover{transform:translateY(-1px);box-shadow:0 18px 40px rgba(11,11,15,.28)}
.hbgo .cta:active{transform:translateY(0)}
.hbgo .cta .ico{width:30px;height:30px;border-radius:9px;background:var(--green);display:inline-flex;align-items:center;justify-content:center;flex:none}
.hbgo .cta .ico svg{width:18px;height:18px;fill:#fff}
.hbgo .cta .chev{margin-left:auto;opacity:.85;font-weight:700}
.hbgo .tagpill{display:inline-flex;align-items:center;gap:7px;margin-top:12px;padding:7px 14px;border-radius:var(--pill);background:#fff;border:1px solid var(--line);color:var(--ink2);font-size:14px;font-weight:600;box-shadow:0 2px 10px rgba(11,11,15,.05)}
.hbgo .tagpill svg{width:14px;height:14px;stroke:var(--ink2);fill:none;stroke-width:2}
.hbgo .alt-cta{display:none;margin-top:14px;text-align:center}
.hbgo .alt-cta.on{display:block}
.hbgo .qr{display:inline-flex;flex-direction:column;align-items:center;gap:10px;padding:16px 18px;background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 10px 30px rgba(11,11,15,.08);max-width:100%}
.hbgo .qr .qt{display:flex;flex-direction:column;gap:4px;max-width:30ch}
.hbgo .qr b{font-size:18px;letter-spacing:-.01em}
.hbgo .qr small{color:var(--ink2);font-size:13px;line-height:1.4}
@media(min-width:900px){.hbgo .alt-cta{text-align:left}.hbgo .qr{flex-direction:row;text-align:left;gap:18px;padding:14px 18px 14px 14px}}
.hbgo .device{margin:22px auto 0;max-width:340px;width:100%}
@media(min-width:900px){.hbgo .device{margin:0;max-width:400px}}
.hbgo .phone{position:relative;background:var(--phone);border-radius:48px;padding:12px 12px 0;box-shadow:0 30px 60px rgba(11,11,15,.28),inset 0 0 0 2px #2a2a2e;overflow:hidden}
.hbgo .screen{background:#fff;border-radius:38px 38px 0 0;overflow:hidden;height:clamp(340px,calc(100svh - 440px),450px);display:flex;flex-direction:column}
@media(min-width:900px){.hbgo .phone{padding:12px}.hbgo .screen{border-radius:38px;height:500px}}
.hbgo .notch{position:absolute;left:50%;top:22px;transform:translateX(-50%);width:108px;height:30px;background:#0B0B0F;border-radius:20px;z-index:3}
.hbgo .status{display:flex;justify-content:space-between;align-items:center;padding:16px 22px 0;font-size:14px;font-weight:700;color:#0B0B0F}
.hbgo .status .sig{display:inline-flex;gap:4px;align-items:flex-end}
.hbgo .status .sig i{display:block;width:3px;background:#0B0B0F;border-radius:1px}
.hbgo .head{display:flex;flex-direction:column;align-items:center;padding:16px 14px 10px;border-bottom:1px solid #EFEFF2;position:relative}
.hbgo .head .back{position:absolute;left:14px;top:20px;color:var(--blue);font-weight:700;font-size:15px;display:inline-flex;align-items:center;gap:4px}
.hbgo .head .back b{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--blue);color:#fff;font-size:11px}
.hbgo .head .info{position:absolute;right:16px;top:20px;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--blue);color:var(--blue);font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;font-style:italic;font-family:Georgia,serif}
.hbgo .avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(180deg,#2F8BFF,#0A5FD8);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;box-shadow:0 2px 8px rgba(10,132,255,.35)}
.hbgo .avatar.emoji{background:#F2F2F7;font-size:24px;box-shadow:none}
.hbgo .head .nm{margin-top:6px;font-size:12.5px;font-weight:700;color:#0B0B0F}
.hbgo .head .by{font-size:10.5px;color:#8A9097;margin-top:1px}
.hbgo .thread{flex:1;min-height:0;padding:12px 14px 8px;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 26px);mask-image:linear-gradient(to bottom,transparent 0,#000 26px)}
.hbgo .day{text-align:center;font-size:10.5px;color:#8A9097}
.hbgo .slot{position:relative}
.hbgo .cell{max-height:0;overflow:hidden;will-change:max-height}
.hbgo .msg{margin-top:8px;padding:9px 13px;border-radius:18px;font-size:14px;line-height:1.3;font-weight:600;opacity:0;will-change:opacity,transform}
.hbgo .msg.me{background:var(--bubble-me);color:#fff;border-bottom-right-radius:6px}
.hbgo .msg.them{background:var(--bubble-them);color:#0B0B0F;border-bottom-left-radius:6px}
.hbgo .typing{background:var(--bubble-them);border-radius:18px;border-bottom-left-radius:6px;padding:11px 14px;display:inline-flex;gap:4px;opacity:0;position:absolute;left:0;top:8px}
.hbgo .typing i{width:7px;height:7px;border-radius:50%;background:#8A9097;animation:hbgo-dot 1s infinite}
.hbgo .typing i:nth-child(2){animation-delay:.15s}.hbgo .typing i:nth-child(3){animation-delay:.3s}
@keyframes hbgo-dot{0%,80%,100%{transform:translateY(0);opacity:.6}40%{transform:translateY(-3px);opacity:1}}
.hbgo .composer{display:flex;align-items:center;gap:8px;padding:8px 12px 10px;border-top:1px solid #EFEFF2}
.hbgo .composer .cam,.hbgo .composer .apps{width:30px;height:30px;border-radius:50%;background:#F2F2F7;display:inline-flex;align-items:center;justify-content:center;color:#8A9097;flex:none}
.hbgo .composer .cam svg,.hbgo .composer .apps svg{width:16px;height:16px;stroke:#8A9097;fill:none;stroke-width:1.8}
.hbgo .composer .field{flex:1;height:34px;border:1px solid #D9D9DE;border-radius:17px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;color:#B0B4BA;font-size:14px}
.hbgo .composer .field svg{width:14px;height:14px;stroke:#B0B4BA;fill:none;stroke-width:1.8}
.hbgo .home{display:none;height:5px;width:120px;border-radius:3px;background:#0B0B0F;margin:6px auto 4px;opacity:.9}
@media(min-width:900px){.hbgo .home{display:block}}
.hbgo .composer{padding-bottom:40px}
@media(min-width:900px){.hbgo .composer{padding-bottom:10px}}
/* ── below the fold ── */
.hbgo .more{position:relative;z-index:1;max-width:460px;margin:0 auto;padding:8px 20px 60px}
@media(min-width:900px){.hbgo .more{max-width:1040px;padding:0 32px 90px}}
.hbgo .proof{display:grid;gap:10px;margin:18px 0 0}
@media(min-width:900px){.hbgo .proof{grid-template-columns:repeat(3,1fr);gap:14px}}
.hbgo .proof div{display:flex;gap:10px;align-items:flex-start;padding:14px 16px;border:1px solid var(--line);border-radius:16px;background:#fff;font-weight:600;font-size:15px;color:var(--ink)}
.hbgo .proof svg{width:18px;height:18px;flex:none;stroke:var(--blue);fill:none;stroke-width:2.2;margin-top:1px}
.hbgo h2{font-size:clamp(26px,7vw,34px);letter-spacing:-.03em;line-height:1.05;margin:44px 0 0;font-weight:800}
@media(min-width:900px){.hbgo h2{font-size:40px;margin-top:56px}}
.hbgo .steps{display:grid;gap:12px;margin-top:18px}
@media(min-width:900px){.hbgo .steps{grid-template-columns:repeat(3,1fr);gap:16px}}
.hbgo .step{position:relative;padding:18px 18px 18px 64px;border:1px solid var(--line);border-radius:18px;background:#fff}
.hbgo .step b{position:absolute;left:18px;top:16px;width:34px;height:34px;border-radius:50%;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800}
.hbgo .step h3{margin:2px 0 4px;font-size:17px;letter-spacing:-.01em}
.hbgo .step p{margin:0;color:var(--ink2);font-size:15px;line-height:1.45}
.hbgo .price{margin-top:28px;padding:22px 20px;border-radius:22px;background:#0B0B0F;color:#fff}
.hbgo .price b{display:block;font-size:clamp(20px,5.6vw,24px);letter-spacing:-.02em}
.hbgo .price p{margin:8px 0 0;color:#C7CBD1;font-size:15px;line-height:1.45}
.hbgo .faq{margin-top:26px;border-top:1px solid var(--line)}
.hbgo .faq details{border-bottom:1px solid var(--line);padding:4px 0}
.hbgo .faq summary{cursor:pointer;list-style:none;font-weight:700;font-size:16px;padding:14px 0;display:flex;justify-content:space-between;gap:12px}
.hbgo .faq summary::-webkit-details-marker{display:none}
.hbgo .faq summary::after{content:"+";color:var(--blue);font-weight:800;font-size:20px;line-height:1}
.hbgo .faq details[open] summary::after{content:"–"}
.hbgo .faq p{margin:0 0 14px;color:var(--ink2);font-size:15px;line-height:1.5}
.hbgo .final{margin-top:40px;text-align:center}
.hbgo .final h2{margin-top:0}
.hbgo .final .cta{max-width:420px;margin:18px auto 0}
.hbgo footer{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:center;color:var(--ink3);font-size:13px}
.hbgo footer a{color:var(--ink2);font-weight:600}
@media(prefers-reduced-motion:reduce){.hbgo .msg{opacity:1!important;animation:none!important;transform:none!important}.hbgo .cell{max-height:none!important;animation:none!important}.hbgo .typing{display:none!important}.hbgo .rot .alt{display:none}.hbgo .rot .caret{animation:none}}
`;

const ICON_MSG = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3C6.5 3 2 6.6 2 11c0 2.3 1.2 4.4 3.2 5.9-.2 1.3-.8 2.6-1.7 3.6 2 .1 3.9-.6 5.4-1.8.9.2 2 .3 3.1.3 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
  </svg>
);
const ICON_CLOCK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const ICON_CHECK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-6" />
  </svg>
);

function RotatingWord({ words, slug }: { words: string[]; slug: string }) {
  // CSS-only typewriter: each word has its own slot in the cycle. First word (the creative's) holds longest.
  const n = words.length;
  const cycle = 3.2 * n + 2.4;
  let css = "";
  const kf = (i: number) => {
    const start = i === 0 ? 0 : 2.4 + 3.2 * i;
    const end = i === 0 ? 2.4 + 3.2 : start + 3.2;
    const p = (s: number) => ((s / cycle) * 100).toFixed(2);
    return `@keyframes ${slug}-w${i}{0%,${p(start)}%{opacity:${i === 0 ? 1 : 0}}${p(start + 0.25)}%,${p(end - 0.25)}%{opacity:1}${p(end)}%,100%{opacity:0}}`;
  };
  for (let i = 0; i < n; i++) css += kf(i);
  return (
    <span className="rot" aria-label={words[0]}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <span style={{ animation: `${slug}-w0 ${cycle}s linear infinite` }}>
        {words[0]}
        <span className="caret" aria-hidden="true" />
      </span>
      {words.slice(1).map((w, i) => (
        <span key={w} className="alt" aria-hidden="true" style={{ animation: `${slug}-w${i + 1} ${cycle}s linear infinite` }}>
          {w}
          <span className="caret" aria-hidden="true" />
        </span>
      ))}
    </span>
  );
}

export function AdLanding({ page }: { page: LandingPage }) {
  const copy = AUDIENCE_COPY[page.audience];
  const target = smsTargetFor(page.audience);
  const href = smsHrefFor(page);
  const convoCss = conversationKeyframes(page.slug, page.messages);
  const isEmojiAvatar = /\p{Extended_Pictographic}/u.test(page.chat.avatar);

  return (
    <div className="hbgo" data-hb-go={page.slug} data-hb-audience={page.audience}>
      <style dangerouslySetInnerHTML={{ __html: CSS + convoCss }} />
      <div className="aura" aria-hidden="true"><i /><i /><i /></div>

      <main className="wrap">
        <div className="copy">
          <div className="intro">
            <img className="logo" src={HOMEBIDS_LOGO_PNG.dataUrl} width={HOMEBIDS_LOGO_PNG.width} height={HOMEBIDS_LOGO_PNG.height} alt="HomeBids" />
            <h1 data-hb-headline>
              {page.headline[0]}
              <span className={`l2${page.rotate && page.rotate.some((w) => w.length > 13) ? " long" : ""}`}>
                {page.rotate ? <RotatingWord words={page.rotate} slug={page.slug} /> : page.headline[1]}
              </span>
            </h1>
            <p className="sub" data-hb-sub>{page.sub}</p>
          </div>

          <AdLandingClient slug={page.slug} audience={page.audience} href={href} phone={target.phone} display={target.display} body={page.smsBody}>
            <div className="cta-wrap">
              <a className="cta" href={href} data-hb-cta="hero" rel="nofollow">
                <span className="ico">{ICON_MSG}</span>
                <span data-hb-cta-label>Open iMessage</span>
                <span className="chev">›</span>
              </a>
              <div className="tagpill" data-hb-tag>{ICON_CLOCK}<span>{page.tag}</span></div>
            </div>
          </AdLandingClient>
        </div>

        <div className="device" aria-hidden="true">
          <div className="phone">
            <div className="notch" />
            <div className="screen">
              <div className="status"><span>9:41</span><span className="sig"><i style={{ height: 5 }} /><i style={{ height: 8 }} /><i style={{ height: 11 }} /><i style={{ height: 14 }} /></span></div>
              <div className="head">
                <span className="back"><span>‹</span><b>2</b></span>
                <span className="info">i</span>
                <div className={`avatar${isEmojiAvatar ? " emoji" : ""}`}>{page.chat.avatar}</div>
                <div className="nm">{page.chat.name}</div>
                {page.chat.byline && <div className="by">{page.chat.byline}</div>}
              </div>
              <div className="thread" data-hb-thread>
                <div className="day">Today 9:41 AM</div>
                {page.messages.map((m, i) => (
                  <div className="slot" key={i} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "84%" }}>
                    {m.from === "them" && (
                      <div className="typing" style={{ animation: `${page.slug}-t${i} ${CYCLE_S}s linear infinite` }}>
                        <i /><i /><i />
                      </div>
                    )}
                    <div className="cell" style={{ animation: `${page.slug}-c${i} ${CYCLE_S}s linear infinite` }}>
                      <div className={`msg ${m.from}`} data-hb-msg={m.from} style={{ animation: `${page.slug}-m${i} ${CYCLE_S}s ease infinite` }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="composer">
                <span className="cam"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13" r="3.2" /></svg></span>
                <span className="apps"><svg viewBox="0 0 24 24"><path d="M12 3l3 6 6 .9-4.5 4.3 1 6.3L12 17.5 6.5 20.5l1-6.3L3 9.9 9 9z" /></svg></span>
                <span className="field"><span>iMessage</span><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg></span>
              </div>
              <div className="home" />
            </div>
          </div>
        </div>
      </main>

      <section className="more">
        <div className="proof" data-hb-proof>
          {copy.proof.map((p) => (
            <div key={p}>{ICON_CHECK}<span>{p}</span></div>
          ))}
        </div>

        <h2>How it works</h2>
        <div className="steps">
          {copy.steps.map(([t, d], i) => (
            <div className="step" key={t}>
              <b>{i + 1}</b>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>

        <div className="price" data-hb-price>
          <b>{copy.priceLine}</b>
          <p>{copy.riskLine}</p>
        </div>

        <div className="faq">
          {copy.faq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>

        <div className="final">
          <h2>{copy.finalLine}</h2>
          <a className="cta" href={href} data-hb-cta="final" rel="nofollow">
            <span className="ico">{ICON_MSG}</span>
            <span data-hb-cta-label>Open iMessage</span>
            <span className="chev">›</span>
          </a>
          <div className="tagpill">{ICON_CLOCK}<span>{page.tag}</span></div>
        </div>

        <footer>
          <span>HomeBids LLC · Gilbert, AZ</span>
          <a href="https://www.homebids.ai/privacy">Privacy</a>
          <a href="https://www.homebids.ai/terms">Terms</a>
          <span>Text {target.display}</span>
        </footer>
      </section>
    </div>
  );
}
