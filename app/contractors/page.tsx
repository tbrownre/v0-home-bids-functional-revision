import { Header } from "@/components/header";
import { LANDING_PAGE_DEMO_URL } from "@/components/landing-page-demo-link";
import { TrialCta } from "@/components/trial-cta";
import s from "./landing.module.css";

/**
 * /contractors — the contractor landing page.
 *
 * Oct 31, 2026 (Tim: "This page.. we need lead radar front and center, a big seller." → his design file
 * homebids_FINAL_standalone.html, "the contractors page"): this is that file 1:1 — copy, sections, order, sizes, colors
 * (landing.module.css is the mock's stylesheet). Only two deliberate differences:
 *   - the mock's placeholder header/footer (☰ · logo · Log In · Get Started / Platform · Company · Legal) are the site's
 *     real Header + Footer, so the logo is the transparent brand asset ("The logo looks like it has a background on it").
 *   - the mock's placeholder links (#pricing / homebids.ai/contractors) point at the real trial signup - and, LOGINSTATE
 *     (Tim, Oct 31), a signed-in contractor is sent to the trial checkout or, when already on a plan, to the dashboard.
 * The three screenshots are the mock's own images (Lead Radar card, Lead Radar list, the Pollard Palms page).
 */

export default function ContractorsLandingPage() {
  return (
    <div className={`min-h-screen bg-white ${s.page}`} data-hb-landing="radar-2026-10-31">
      <Header />

      <main>
        {/* HERO */}
        <div className={s.hero}>
          <div className={s.shell}>
            <div className={s.heroGrid}>
              <div>
                <span className={s.eyebrow}>⚡ Your 24/7 assistant · By text</span>
                <h1>
                  Find opportunities.
                  <br />
                  <span className={s.blue}>Send more bids.</span>
                </h1>
                <p className={s.lede}>
                  Find local jobs, turn website visitors into text conversations, and build professional bids—all in one place.
                </p>
                <TrialCta className={s.btn} label="Start My Free 14-Day Trial →" />
                <p className={s.micro}>✓ 14 days free &nbsp; ✓ Then $99/month &nbsp; ✓ Cancel anytime</p>
              </div>
              <div className={s.heroArt}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={s.productImg}
                  src="/contractors/lead-radar-card.png"
                  width={831}
                  height={316}
                  alt="Actual Lead Radar opportunity screen, with Build Bid and original post actions"
                />
                <div className={s.float}>Local opportunities, right on your phone</div>
              </div>
            </div>
            <div className={s.pillars}>
              <div className={s.pillar}>
                <div className={s.symbol}>◎</div>
                <div>
                  <strong>Lead Radar</strong>
                  <span>Spot local projects in Facebook groups.</span>
                </div>
              </div>
              <div className={s.pillar}>
                <div className={s.symbol}>▣</div>
                <div>
                  <strong>Your Contractor Page</strong>
                  <span>Capture leads through iMessage/SMS.</span>
                </div>
              </div>
              <div className={s.pillar}>
                <div className={s.symbol}>▤</div>
                <div>
                  <strong>AI Bid Builder</strong>
                  <span>Turn job details into professional bids.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 01 / Lead Radar */}
        <section className={`${s.feature} ${s.tint}`} id="radar">
          <div className={`${s.shell} ${s.sectionGrid}`}>
            <div>
              <span className={s.eyebrow}>01 / Lead Radar</span>
              <h2>
                Up to 25 local Facebook groups.
                <br />
                <span className={s.blue}>Instant alerts.</span>
              </h2>
              <p className={s.description}>
                Choose your trades and subscribe to up to 25 community groups. Get alerted when relevant homeowner projects are found.
              </p>
              <ul className={s.checklist}>
                <li>Get matching opportunities sent by text</li>
                <li>Tap <b>&nbsp;Build Bid&nbsp;</b> to prepare an estimate</li>
                <li>Or copy a professionally written reply to post yourself</li>
                <li>Open the original Facebook post in one tap</li>
              </ul>
              <a href="#pricing" className={`${s.btn} ${s.secondary}`}>Explore Lead Radar →</a>
            </div>
            <div className={s.visual}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/contractors/lead-radar-list.png"
                width={904}
                height={515}
                alt="Actual Lead Radar opportunity list showing suggested replies and Build Bid actions"
              />
              <p className={s.productNote}>Actual HomeBids Lead Radar interface · Group coverage depends on setup</p>
            </div>
          </div>
        </section>

        {/* 02 / Your Contractor Page */}
        <section className={s.feature} id="web">
          <div className={`${s.shell} ${s.sectionGrid}`}>
            <div>
              <span className={s.eyebrow}>02 / Your Contractor Page</span>
              <h2>
                Your website. Your leads.
                <br />
                <span className={s.blue}>Through iMessage.</span>
              </h2>
              <p className={s.description}>
                Get a professional page that turns visitors into text conversations. Customers share project details and photos through iMessage or SMS—no app, no account.
              </p>
              <ul className={s.checklist}>
                <li>Your business name, services and branding</li>
                <li>Text-first lead intake, around the clock</li>
                <li>You keep your customer relationships</li>
              </ul>
              <a className={`${s.btn} ${s.secondary}`} href={LANDING_PAGE_DEMO_URL} target="_blank" rel="noopener">
                See the Real Contractor Demo ↗
              </a>
            </div>
            <div className={`${s.visual} ${s.webVisual}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/contractors/contractor-page-demo.png"
                width={1584}
                height={1250}
                alt="Actual Pollard Palms contractor landing page with Text us for a free quote and iMessage conversation"
              />
              <p className={s.productNote}>Actual Pollard Palms text-first landing page</p>
            </div>
          </div>
        </section>

        {/* 03 / AI Bid Builder */}
        <section className={`${s.feature} ${s.tint}`} id="builder">
          <div className={`${s.shell} ${s.sectionGrid}`}>
            <div>
              <span className={s.eyebrow}>03 / AI Bid Builder</span>
              <h2>
                Text the details.
                <br />
                <span className={s.blue}>Get a professional bid.</span>
              </h2>
              <p className={s.description}>
                Send rough notes, job details or photos by text. HomeBids helps structure the estimate and prepares it for your approval.
              </p>
              <ul className={s.checklist}>
                <li>No complicated software to learn</li>
                <li>Review and control every price</li>
                <li>Share a polished estimate link or PDF</li>
              </ul>
              <a className={`${s.btn} ${s.secondary}`} href="#pricing">Try the Bid Builder →</a>
            </div>
            <div className={s.visual}>
              <div className={s.sample}>
                <div>
                  <div className={s.label}>Rough job notes</div>
                  <p>“Paint master bedroom and hallway. Repair drywall in two spots. Labor $950. Materials around $200. Two days.”</p>
                  <p style={{ fontWeight: 700, color: "#0675ff", marginTop: 30 }}>Job details →</p>
                </div>
                <div className={s.doc}>
                  <div className={s.label}>Professional estimate preview</div>
                  <h3>Interior Painting &amp; Drywall</h3>
                  <table>
                    <tbody>
                      <tr><td>Scope of work</td><td>Organized</td></tr>
                      <tr><td>Labor</td><td>$950</td></tr>
                      <tr><td>Materials</td><td>$200</td></tr>
                      <tr><td><b>Total</b></td><td><b>$1,150</b></td></tr>
                    </tbody>
                  </table>
                  <p style={{ color: "#0675ff", fontSize: 13, fontWeight: 700 }}>✓ Awaiting contractor approval</p>
                </div>
              </div>
              <p className={s.productNote}>Illustrative estimate using the sample from the existing contractor page</p>
            </div>
          </div>
        </section>

        {/* Journey */}
        <div className={s.journey}>
          <div className={s.shell}>
            <h2>One simple way to win back your time.</h2>
            <div className={s.steps}>
              <div className={s.step}>
                <b>01</b>
                <h3>Find the opportunity</h3>
                <p>Get a local Lead Radar alert—or have homeowners reach out through your page.</p>
              </div>
              <div className={s.step}>
                <b>02</b>
                <h3>Build by text</h3>
                <p>Share job details. HomeBids helps organize a professional estimate.</p>
              </div>
              <div className={s.step}>
                <b>03</b>
                <h3>Approve &amp; send</h3>
                <p>Control your pricing and share the bid with the homeowner.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <section className={s.pricing} id="pricing">
          <div className={`${s.shell} ${s.priceGrid}`}>
            <div>
              <span className={s.eyebrow}>Simple, transparent pricing</span>
              <h2>
                Everything you need.
                <br />
                <span className={s.blue}>One simple price.</span>
              </h2>
              <p className={s.description}>
                Lead Radar, your own text-first contractor page, unlimited bids and a 24/7 assistant. No extra estimating software to learn.
              </p>
              <p style={{ fontWeight: 750, fontSize: 17 }}>Your pricing. Your customers. Your approval.</p>
            </div>
            <div className={s.priceCard}>
              <div style={{ fontSize: 12, letterSpacing: ".1em", fontWeight: 800, color: "#687583" }}>HOMEBIDS CONTRACTOR</div>
              <div style={{ margin: "10px 0" }}>
                <span className={s.dollar}>$99</span>
                <span style={{ color: "#6a7381" }}> /month</span>
              </div>
              <span className={s.eyebrow}>14-day free trial</span>
              <ul className={s.checklist}>
                <li>Lead Radar alerts (up to 25 groups)</li>
                <li>Your iMessage/SMS contractor webpage</li>
                <li>Unlimited AI Bid Builder</li>
                <li>Interactive bids and customer follow-up</li>
                <li>No bid fees · Cancel anytime</li>
              </ul>
              <TrialCta className={`${s.btn} ${s.full}`} label="Start My Free 14-Day Trial →" />
              <p className={s.micro}>$99/month after your 14-day trial. Cancel anytime.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={s.faq}>
          <div className={`${s.shell} ${s.faqWrap}`}>
            <h2>Questions? We&apos;ve got answers.</h2>
            <details>
              <summary>How does Lead Radar work?</summary>
              <p>Select your trades and subscribe to up to 25 local community Facebook groups. When the system identifies a matching opportunity, you can review it, build a bid, or copy a suggested reply. Availability depends on the groups and monitoring setup.</p>
            </details>
            <details>
              <summary>Does the contractor page use iMessage?</summary>
              <p>Yes. On compatible Apple devices it can open iMessage; SMS is available for other phones. Homeowners can share project details without downloading an app or creating an account.</p>
            </details>
            <details>
              <summary>Who controls my estimates and prices?</summary>
              <p>You do. HomeBids helps prepare bids, but you review and approve the pricing before sending.</p>
            </details>
            <details>
              <summary>What happens after my free trial?</summary>
              <p>The subscription is $99 per month after 14 days. You can cancel anytime.</p>
            </details>
          </div>
        </section>

        {/* Closing */}
        <section className={s.closing}>
          <span className={s.eyebrow}>Built for contractors who do the work</span>
          <h2>
            Less busywork.
            <br />
            <span className={s.blue}>More paid work.</span>
          </h2>
          <p>Find opportunities. Capture leads by text. Build better bids.</p>
          <TrialCta className={s.btn} label="Start My Free 14-Day Trial →" />
          <p className={s.micro}>14 days free · Then $99/month · Cancel anytime</p>
        </section>
      </main>

      {/* Phones: the mock's sticky trial bar */}
      <div className={s.mobileSticky}>
        <span>
          <b>14 days free</b>Then $99/month
        </span>
        <TrialCta className={s.btn} label="Start Free Trial →" proLabel="Go to dashboard →" />
      </div>
    </div>
  );
}
