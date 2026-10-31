"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { LANDING_PAGE_DEMO_URL } from "@/components/landing-page-demo-link";
import { getSmsLink } from "@/lib/sms-config";
import s from "./hiw.module.css";

/**
 * /how-it-works — Tim's "homebids_how_it_works_updated.html" (Oct 31, 2026), ported 1:1: the hero with the
 * Homeowner / Contractor toggle (contractor first, like the file), the three contractor tools, the three homeowner
 * steps with his purpose-built phone / job-card / offers visuals, the quick workflow band, FAQ and the dark closing card.
 * Only three deliberate differences:
 *   - the mock's placeholder header/footer are the site's real Header + Footer (transparent logo);
 *   - the "random image" Tim flagged in 03 / AI Bid Builder is gone — that slot shows the rough-notes → estimate sample
 *     from his /contractors page instead ("tell Claude to remove the image for that section");
 *   - placeholder links point at the real pages: trial signup, the live demo page, the Ava text line.
 * The two screenshots are the same files the /contractors page uses (byte-identical in his file).
 */

type Persona = "contractor" | "homeowner";

const TRIAL = "/contractors/signup?plan=trial";

export default function HowItWorksPage() {
  const [persona, setPersona] = useState<Persona>("contractor");
  const homeowner = persona === "homeowner";

  return (
    <div className={`min-h-screen bg-white ${s.page} ${homeowner ? s.homeowner : ""}`} data-hb-hiw={persona}>
      <Header />

      {/* HERO */}
      <section className={s.hero}>
        <span className={s.eyebrow}>HOW IT WORKS</span>
        <h1 id="heroTitle">
          {homeowner ? (
            <>
              Need work done?
              <br />
              <span className={s.blue}>Just text HomeBids.</span>
            </>
          ) : (
            <>
              Find jobs. Get leads.
              <br />
              <span className={s.blue}>Send bids by text.</span>
            </>
          )}
        </h1>
        <p id="heroSub">
          {homeowner
            ? "Text HomeBids. Ava organizes your project and helps you reach matching local contractors."
            : "Three tools that help you spend less time chasing work—and more time doing it."}
        </p>
        <div className={s.personaCaption}>I&apos;M A</div>
        <div className={s.persona} role="group" aria-label="Choose how you use HomeBids">
          <button id="homeBtn" type="button" aria-pressed={homeowner} onClick={() => setPersona("homeowner")}>
            ⌂ &nbsp; Homeowner
          </button>
          <button id="proBtn" type="button" aria-pressed={!homeowner} onClick={() => setPersona("contractor")}>
            ⚒ &nbsp; Contractor
          </button>
        </div>
        <div className={`${s.trust} ${s.contractorOnly}`}>
          <span><i>✓</i> 14 days free</span>
          <span><i>✓</i> Then $99/month</span>
          <span><i>✓</i> Cancel anytime</span>
        </div>
        <div className={`${s.trust} ${s.homeownerOnly}`}>
          <span><i>✓</i> Always free for homeowners</span>
          <span><i>✓</i> No app or account</span>
        </div>
      </section>

      <main>
        {/* CONTRACTOR — three tools */}
        <div className={`${s.wrap} ${s.steps} ${s.contractorOnly}`}>
          <div className={s.intro}>
            <span className={s.stepTag}>THREE SIMPLE TOOLS</span>
            <h2>Everything works together.</h2>
            <p>Find opportunities. Capture inquiries. Build bids.</p>
          </div>

          <section className={`${s.feature} ${s.tint}`}>
            <div className={s.copy}>
              <div className={s.stepTag}>01 / LEAD RADAR</div>
              <h3>
                Local jobs.
                <br />
                <span className={s.blue}>Instant alerts.</span>
              </h3>
              <p>
                Monitor up to <strong>25 local Facebook community groups</strong> for opportunities that match your trades.
              </p>
              <ul className={s.bullets}>
                <li><span className={s.check}>✓</span> Get notified when a matching post appears</li>
                <li><span className={s.check}>✓</span> Build a bid or copy a ready-to-send reply</li>
                <li><span className={s.check}>✓</span> Open the original post to respond</li>
              </ul>
              <Link className={s.linkbtn} href="/contractors">Explore Lead Radar →</Link>
            </div>
            <div className={s.visual}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={s.radarImg}
                src="/contractors/lead-radar-list.png"
                width={904}
                height={515}
                alt="Actual HomeBids Lead Radar opportunity interface with Build Bid and suggested message actions"
              />
            </div>
          </section>

          <section className={s.feature}>
            <div className={s.copy}>
              <div className={s.stepTag}>02 / YOUR CONTRACTOR PAGE</div>
              <h3>
                Your page.
                <br />
                <span className={s.blue}>iMessage lead intake.</span>
              </h3>
              <p>Customers tap to text your business. HomeBids collects job details and photos while you work.</p>
              <ul className={s.bullets}>
                <li><span className={s.check}>✓</span> Your business and services on one page</li>
                <li><span className={s.check}>✓</span> Homeowners start right in iMessage/SMS</li>
                <li><span className={s.check}>✓</span> Their inquiries stay with your business</li>
              </ul>
              <a className={s.linkbtn} href={LANDING_PAGE_DEMO_URL} target="_blank" rel="noopener">
                View Real Contractor Page →
              </a>
            </div>
            <div className={s.visual}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={s.pollardImg}
                src="/contractors/contractor-page-demo.png"
                width={1584}
                height={1250}
                alt="Actual Pollard Palms contractor landing page with Text for a free quote button and iMessage conversation"
              />
            </div>
          </section>

          <section className={`${s.feature} ${s.tint}`}>
            <div className={s.copy}>
              <div className={s.stepTag}>03 / AI BID BUILDER</div>
              <h3>
                Text the job.
                <br />
                <span className={s.blue}>Get a polished bid.</span>
              </h3>
              <p>Send rough notes or photos. Answer a few questions, review pricing, then share your estimate.</p>
              <ul className={s.bullets}>
                <li><span className={s.check}>✓</span> Professional, shareable bid links</li>
                <li><span className={s.check}>✓</span> You review and approve every bid</li>
                <li><span className={s.check}>✓</span> Customers can ask questions and approve</li>
              </ul>
              <Link className={s.linkbtn} href="/contractors">Explore Bid Builder →</Link>
            </div>
            <div className={s.visual}>
              <div className={s.sample} aria-label="Illustrative estimate built from rough job notes">
                <div>
                  <div className={s.label}>Rough job notes</div>
                  <p>“Paint master bedroom and hallway. Repair drywall in two spots. Labor $950. Materials around $200. Two days.”</p>
                  <p className={s.notesLink}>Job details →</p>
                </div>
                <div className={s.doc}>
                  <div className={s.label}>Professional estimate preview</div>
                  <h4>Interior Painting &amp; Drywall</h4>
                  <table>
                    <tbody>
                      <tr><td>Scope of work</td><td>Organized</td></tr>
                      <tr><td>Labor</td><td>$950</td></tr>
                      <tr><td>Materials</td><td>$200</td></tr>
                      <tr><td><b>Total</b></td><td><b>$1,150</b></td></tr>
                    </tbody>
                  </table>
                  <p className={s.approved}>✓ Awaiting contractor approval</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* HOMEOWNER — three steps */}
        <div className={`${s.wrap} ${s.steps} ${s.homeownerOnly}`}>
          <div className={s.intro}>
            <span className={s.stepTag}>ALWAYS FREE FOR HOMEOWNERS</span>
            <h2>One text. Real bids.</h2>
            <p>Tell HomeBids what you need. We help you find the right contractor.</p>
          </div>

          <section className={`${s.feature} ${s.tint} ${s.homeownerOnly}`}>
            <div className={s.copy}>
              <div className={s.stepTag}>01 / TEXT HOMEBIDS</div>
              <h3>
                Tell Ava what <span className={s.blue}>you need done.</span>
              </h3>
              <p>Text your project details. Ava asks a few questions and puts your job together.</p>
              <ul className={s.bullets}>
                <li><span className={s.check}>✓</span>Just iMessage or SMS</li>
                <li><span className={s.check}>✓</span>No app. No account.</li>
              </ul>
            </div>
            <div className={s.visual}>
              <div className={s.homePhone} aria-label="Illustrative HomeBids text conversation">
                <div className={s.homePhoneTop}>9:41 <span>● ▰</span></div>
                <div className={s.homeChatHead}>
                  <span className={s.homeChatAvatar}>H</span>
                  <div>
                    <strong>HomeBids</strong>
                    <small>Project assistant · Ava</small>
                  </div>
                </div>
                <div className={s.homeChatBody}>
                  <div className={`${s.bubble} ${s.bubbleUser}`}>Need someone to repair my sliding screen door.</div>
                  <div className={`${s.bubble} ${s.bubbleAi}`}>Happy to help! ✅ Is the screen torn, the door hard to slide, or both?</div>
                  <div className={`${s.bubble} ${s.bubbleUser}`}>Torn screen and missing wheels.</div>
                  <div className={`${s.bubble} ${s.bubbleAi}`}>Got it! I&apos;ll organize the details so contractors can review the job.</div>
                </div>
                <div className={s.homeChatInput}>iMessage <span>＋</span></div>
              </div>
            </div>
          </section>

          <section className={`${s.feature} ${s.homeownerOnly}`}>
            <div className={s.copy}>
              <div className={s.stepTag}>02 / SHARE YOUR PROJECT</div>
              <h3>
                Your job goes out. <span className={s.blue}>Your info stays private.</span>
              </h3>
              <p>Get a shareable job link. HomeBids helps reach matching contractors and local community groups.</p>
              <ul className={s.bullets}>
                <li><span className={s.check}>✓</span>Share it wherever you like</li>
                <li><span className={s.check}>✓</span>Contact info stays private until you approve a bid or in-person estimate</li>
              </ul>
            </div>
            <div className={s.visual}>
              <div className={s.jobCard}>
                <div className={s.jobCardLabel}>HOMEBIDS · JOB PREVIEW</div>
                <div className={s.jobCardTitle}>Sliding screen door repair</div>
                <div className={s.jobCardText}>Screen is torn and wheels are missing. Existing door frame in place.</div>
                <div className={s.jobCardMeta}>
                  <span>✓ Organized job details</span>
                  <span>✓ Contact details private</span>
                </div>
                <div className={s.jobCardLink}>
                  <span>Shareable job link</span>
                  <strong>↗</strong>
                </div>
                <div className={s.jobCardFoot}>Illustrative preview · No personal details shown</div>
              </div>
            </div>
          </section>

          <section className={`${s.feature} ${s.tint} ${s.homeownerOnly}`}>
            <div className={s.copy}>
              <div className={s.stepTag}>03 / REVIEW YOUR OPTIONS</div>
              <h3>
                Get bids. <span className={s.blue}>Choose your pro.</span>
              </h3>
              <p>Contractors can send bids or offer a free in-person estimate. Review your options and choose who works for you.</p>
              <ul className={s.bullets}>
                <li><span className={s.check}>✓</span>No obligation to hire</li>
                <li><span className={s.check}>✓</span>Always free for homeowners</li>
              </ul>
            </div>
            <div className={s.visual}>
              <div className={s.offersCard}>
                <div className={s.offersTitle}>Your project</div>
                <div className={s.offersSubtitle}>Sliding screen door repair</div>
                <div className={s.offerRow}>
                  <span className={s.offerIcon}>▤</span>
                  <div>
                    <strong>Professional bid</strong>
                    <small>Review details and ask questions</small>
                  </div>
                  <span className={s.offerArrow}>↗</span>
                </div>
                <div className={s.offerRow}>
                  <span className={s.offerIcon}>⌂</span>
                  <div>
                    <strong>In-person estimate</strong>
                    <small>Meet a contractor before deciding</small>
                  </div>
                  <span className={s.offerArrow}>↗</span>
                </div>
                <div className={s.offersFoot}>You decide who to hire.</div>
              </div>
            </div>
          </section>
        </div>

        {/* Quick workflow (contractor) */}
        <section className={`${s.flowband} ${s.contractorOnly}`}>
          <div className={s.wrap}>
            <h2>One simple workflow.</h2>
            <div className={s.quickflow}>
              <div className={s.quickstep}>
                <span>1</span>
                <div>
                  <strong>Find the opportunity</strong>
                  <small>Lead Radar alerts you</small>
                </div>
              </div>
              <div className={s.quickstep}>
                <span>2</span>
                <div>
                  <strong>Connect by text</strong>
                  <small>Your webpage handles intake</small>
                </div>
              </div>
              <div className={s.quickstep}>
                <span>3</span>
                <div>
                  <strong>Send your bid</strong>
                  <small>Review, approve, share</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ (contractor) */}
        <section className={`${s.wrap} ${s.faq} ${s.contractorOnly}`}>
          <span className={s.stepTag} style={{ display: "block", textAlign: "center" }}>GOOD TO KNOW</span>
          <h2>Quick answers.</h2>
          <div className={s.faqgrid}>
            <details>
              <summary>Does Lead Radar post automatically?</summary>
              <p>No. Review the opportunity, open the original post, and choose what to send or paste yourself.</p>
            </details>
            <details>
              <summary>Can I pick my Facebook groups?</summary>
              <p>Yes. Add up to 25 local community groups and choose your trades.</p>
            </details>
            <details>
              <summary>Do homeowners need an app?</summary>
              <p>No. They can use their regular iMessage or SMS app.</p>
            </details>
            <details>
              <summary>Who controls my bid pricing?</summary>
              <p>You do. Review and approve bids before sending them to customers.</p>
            </details>
          </div>
        </section>

        {/* Closing */}
        <section className={`${s.closing} ${s.contractorOnly}`}>
          <span className={s.eyebrow}>ALL THREE TOOLS INCLUDED</span>
          <h2>Less busywork. More paid work.</h2>
          <p>Lead Radar + Your Contractor Page + Unlimited Bid Builder</p>
          <Link className={s.linkbtn} href={TRIAL}>Start My Free 14-Day Trial →</Link>
          <div className={s.subprice}>Then $99/month · Cancel anytime</div>
        </section>
        <section className={`${s.closing} ${s.homeownerOnly}`}>
          <span className={s.eyebrow}>FREE FOR HOMEOWNERS</span>
          <h2>Ready to get your project started?</h2>
          <p>Text your project to Ava. We help you reach matching contractors.</p>
          <a className={s.linkbtn} href={getSmsLink()}>Text Your Project →</a>
          <div className={s.subprice}>No app · No account · Free for homeowners</div>
        </section>
      </main>
    </div>
  );
}
