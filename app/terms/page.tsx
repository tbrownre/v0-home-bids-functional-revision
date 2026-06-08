"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { motion } from "framer-motion";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

const sections = [
  {
    id: "platform-overview",
    title: "Platform Overview",
    content: (
      <>
        <p>HomeBids operates a neutral technology platform that facilitates introductions and communications between homeowners and independent contractors.</p>
        <p>HomeBids does not perform construction, remodeling, repair, maintenance, engineering, architectural, inspection, or trade services.</p>
        <p>HomeBids may use automated systems, artificial intelligence, machine learning systems, algorithmic tools, communications systems, and contractor discovery technologies to help homeowners identify potentially relevant contractors for submitted projects.</p>
        <p>HomeBids is not a contractor, subcontractor, construction manager, staffing company, employment agency, broker, insurer, project manager, or payment processor.</p>
        <p>All contractor services are performed exclusively by independent third parties.</p>
      </>
    ),
  },
  {
    id: "authorization",
    title: "Authorization to Seek Contractors and Distribute Projects",
    content: (
      <>
        <p>By submitting a project request, homeowners expressly authorize HomeBids to:</p>
        <ul>
          <li>distribute project information to contractors</li>
          <li>identify potentially relevant contractors</li>
          <li>contact contractors regarding submitted projects</li>
          <li>facilitate communications between users</li>
          <li>utilize automated outreach systems</li>
          <li>utilize artificial intelligence systems</li>
          <li>use publicly available contractor information</li>
          <li>send project opportunity notifications</li>
        </ul>
        <p>This authorization may include communications through email, platform messaging, automated systems, artificial intelligence tools, and other lawful business communication methods.</p>
        <p>HomeBids does not guarantee contractor responses, bid volume, pricing, availability, or project outcomes.</p>
      </>
    ),
  },
  {
    id: "independent-contractors",
    title: "Independent Contractors",
    content: (
      <>
        <p>All contractors using the Platform operate independent businesses.</p>
        <p>HomeBids does not:</p>
        <ul>
          <li>employ contractors</li>
          <li>supervise contractor work</li>
          <li>control contractor pricing</li>
          <li>manage contractor projects</li>
          <li>direct contractor operations</li>
          <li>guarantee contractor licensing</li>
          <li>guarantee contractor insurance</li>
          <li>guarantee permits or code compliance</li>
        </ul>
        <p>Contractors are solely responsible for licensing, insurance, permits, taxes, regulatory compliance, project performance, warranties, and safety compliance.</p>
        <p>Any agreement entered into exists solely between the homeowner and contractor.</p>
      </>
    ),
  },
  {
    id: "marketplace-neutrality",
    title: "Marketplace Neutrality",
    content: (
      <>
        <p>HomeBids operates solely as a neutral technology platform.</p>
        <p>HomeBids does not endorse, certify, guarantee, recommend, verify, warrant, or insure any contractor, homeowner, business, project, bid, project scope, license status, insurance status, qualifications, reviews, ratings, pricing, or project outcome.</p>
        <p>Contractor visibility, ranking, or display order may depend on factors including:</p>
        <ul>
          <li>geographic relevance</li>
          <li>responsiveness</li>
          <li>profile completeness</li>
          <li>subscription status</li>
          <li>platform activity</li>
          <li>algorithmic systems</li>
          <li>homeowner preferences</li>
        </ul>
        <p>These factors do not constitute endorsements or recommendations.</p>
      </>
    ),
  },
  {
    id: "no-project-management",
    title: "No Project Management or Payment Handling",
    content: (
      <>
        <p>HomeBids does not:</p>
        <ul>
          <li>supervise projects</li>
          <li>manage timelines</li>
          <li>control construction work</li>
          <li>process contractor payments</li>
          <li>provide escrow services</li>
          <li>mediate disputes</li>
          <li>guarantee workmanship</li>
          <li>inspect completed work</li>
        </ul>
        <p>HomeBids is not responsible for project outcomes, delays, damages, disputes, change orders, property damage, injuries, contractor conduct, or completed work.</p>
        <p>All agreements are negotiated directly between homeowners and contractors.</p>
      </>
    ),
  },
  {
    id: "ai-systems",
    title: "AI and Automated Systems",
    content: (
      <>
        <p>HomeBids may use artificial intelligence, machine learning systems, automated systems, and algorithmic technologies to:</p>
        <ul>
          <li>generate project summaries</li>
          <li>categorize projects</li>
          <li>identify contractors</li>
          <li>facilitate communications</li>
          <li>generate recommendations</li>
          <li>organize data</li>
          <li>improve platform functionality</li>
        </ul>
        <p>AI-generated content may be inaccurate, incomplete, delayed, misleading, or outdated.</p>
        <p>Users are solely responsible for independently reviewing and verifying all information before relying upon it.</p>
        <p>HomeBids does not guarantee the accuracy of AI-generated content.</p>
      </>
    ),
  },
  {
    id: "public-contractor-info",
    title: "Public Contractor Information and Contractor Discovery",
    content: (
      <>
        <p>HomeBids may collect, organize, analyze, display, and utilize information obtained from:</p>
        <ul>
          <li>publicly available sources</li>
          <li>business directories</li>
          <li>licensing databases</li>
          <li>public websites</li>
          <li>user submissions</li>
          <li>reviews</li>
          <li>third-party data providers</li>
          <li>lawful commercial data sources</li>
        </ul>
        <p>HomeBids does not guarantee the accuracy, completeness, or timeliness of publicly sourced information.</p>
        <p>Contractors may request updates or removal of inaccurate information by contacting HomeBids.</p>
      </>
    ),
  },
  {
    id: "communications",
    title: "Platform Communications",
    content: (
      <>
        <p>The Platform may enable communications between homeowners and contractors.</p>
        <p>HomeBids may send:</p>
        <ul>
          <li>project opportunity notifications</li>
          <li>contractor outreach emails</li>
          <li>bid notifications</li>
          <li>platform alerts</li>
          <li>transactional communications</li>
          <li>service-related communications</li>
        </ul>
        <p>Users are solely responsible for communications conducted through the Platform.</p>
        <p>HomeBids does not verify or guarantee the accuracy of user communications.</p>
        <p>Contractors may opt out of certain communications in accordance with applicable law.</p>
      </>
    ),
  },
  {
    id: "affiliate-program",
    title: "Affiliate and Referral Programs",
    content: (
      <>
        <p>HomeBids may operate affiliate, referral, ambassador, or promotional programs.</p>
        <p>Participants may receive compensation for referring users to the Platform.</p>
        <p>Compensation may include:</p>
        <ul>
          <li>referral commissions</li>
          <li>recurring revenue shares</li>
          <li>promotional incentives</li>
          <li>bonuses</li>
          <li>marketing rewards</li>
        </ul>
        <p>Affiliate participants may have financial incentives to promote HomeBids.</p>
        <p>HomeBids does not guarantee affiliate earnings or financial results.</p>
        <p>Participation does not create employment, partnership, franchise, agency, or joint venture relationships.</p>
      </>
    ),
  },
  {
    id: "no-guarantee",
    title: "No Guarantee of Work or Revenue",
    content: (
      <>
        <p>HomeBids does not guarantee:</p>
        <ul>
          <li>project awards</li>
          <li>contractor selection</li>
          <li>lead volume</li>
          <li>revenue</li>
          <li>profits</li>
          <li>conversion rates</li>
          <li>response rates</li>
          <li>project availability</li>
          <li>homeowner engagement</li>
          <li>contractor participation</li>
        </ul>
        <p>Contractor success depends on market conditions, homeowner preferences, responsiveness, pricing, availability, location, competition, and numerous factors outside HomeBids&apos; control.</p>
      </>
    ),
  },
  {
    id: "user-content",
    title: "User Content",
    content: (
      <>
        <p>Users are solely responsible for content submitted to the Platform, including:</p>
        <ul>
          <li>project descriptions</li>
          <li>messages</li>
          <li>reviews</li>
          <li>bids</li>
          <li>images</li>
          <li>uploaded files</li>
          <li>profile information</li>
        </ul>
        <p>HomeBids does not guarantee the accuracy, legality, or reliability of user-generated content.</p>
        <p>HomeBids reserves the right to remove or restrict content at its discretion.</p>
      </>
    ),
  },
  {
    id: "fees",
    title: "Subscription Billing and Fees",
    content: (
      <>
        <p>HomeBids may charge:</p>
        <ul>
          <li>monthly subscription fees</li>
          <li>recurring membership fees</li>
          <li>promotional fees</li>
          <li>premium feature fees</li>
        </ul>
        <p>By subscribing, users authorize recurring charges to their payment method until cancellation.</p>
        <p>Fees are generally non-refundable unless required by law.</p>
        <p>HomeBids may modify pricing, subscription structures, or billing models at any time.</p>
        <p>Users are responsible for cancelling subscriptions before renewal dates.</p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: (
      <>
        <p>The Platform, including all software, branding, designs, graphics, systems, content, and technology, is owned by HomeBids or its licensors and protected by intellectual property laws.</p>
        <p>Users may not copy, scrape, reproduce, reverse engineer, distribute, exploit, resell, or commercially use any portion of the Platform without written permission.</p>
      </>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimer of Warranties",
    content: (
      <>
        <p className="font-semibold uppercase tracking-wide text-foreground">The Platform is provided &quot;as is&quot; and &quot;as available.&quot;</p>
        <p>To the maximum extent permitted by law, HomeBids disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, accuracy, reliability, and availability.</p>
        <p>HomeBids does not guarantee:</p>
        <ul>
          <li>platform uptime</li>
          <li>project results</li>
          <li>contractor performance</li>
          <li>user behavior</li>
          <li>data accuracy</li>
          <li>communication delivery</li>
          <li>platform security</li>
          <li>error-free operation</li>
        </ul>
      </>
    ),
  },
  {
    id: "limitation",
    title: "Limitation of Liability",
    content: (
      <>
        <p>To the maximum extent permitted by law, HomeBids shall not be liable for indirect, incidental, consequential, special, exemplary, or punitive damages, including lost profits, lost revenue, business interruption, data loss, property damage, or personal injury arising from:</p>
        <ul>
          <li>contractor services</li>
          <li>homeowner conduct</li>
          <li>project outcomes</li>
          <li>platform use</li>
          <li>AI-generated content</li>
          <li>communications</li>
          <li>outages</li>
          <li>third-party services</li>
          <li>contractor outreach activities</li>
        </ul>
        <p>Total liability shall not exceed the greater of $100 USD or the amount paid to HomeBids during the previous 12 months.</p>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "Indemnification",
    content: (
      <>
        <p>Users agree to defend, indemnify, and hold harmless HomeBids and its owners, officers, affiliates, employees, contractors, licensors, successors, and agents from and against any claims, liabilities, damages, losses, judgments, settlements, costs, and expenses, including reasonable attorneys&apos; fees, arising from:</p>
        <ul>
          <li>use of the Platform</li>
          <li>project disputes</li>
          <li>contractor services</li>
          <li>homeowner conduct</li>
          <li>violations of law</li>
          <li>property damage</li>
          <li>bodily injury</li>
          <li>user content</li>
          <li>communications</li>
          <li>reliance on AI-generated content</li>
          <li>misuse of the Platform</li>
          <li>submitted project information</li>
        </ul>
      </>
    ),
  },
  {
    id: "arbitration",
    title: "Arbitration and Class Action Waiver",
    content: (
      <>
        <p>Any dispute arising from or relating to the Platform or these Terms shall be resolved exclusively through binding arbitration governed by the Federal Arbitration Act.</p>
        <p>Users waive:</p>
        <ul>
          <li>the right to a jury trial</li>
          <li>the right to participate in class actions</li>
          <li>the right to participate in representative actions</li>
        </ul>
        <p>Arbitration shall occur in Maricopa County, Arizona unless otherwise required by law.</p>
        <p>Either party may seek relief in small claims court for qualifying matters.</p>
      </>
    ),
  },
  {
    id: "force-majeure",
    title: "Force Majeure",
    content: (
      <>
        <p>HomeBids shall not be liable for delays, interruptions, outages, failures, or damages caused by events beyond its reasonable control, including:</p>
        <ul>
          <li>internet failures</li>
          <li>telecommunications outages</li>
          <li>cyberattacks</li>
          <li>API failures</li>
          <li>artificial intelligence failures</li>
          <li>natural disasters</li>
          <li>labor disputes</li>
          <li>government actions</li>
          <li>software failures</li>
          <li>third-party platform outages</li>
        </ul>
      </>
    ),
  },
  {
    id: "modifications",
    title: "Platform Modifications",
    content: (
      <>
        <p>HomeBids may modify, suspend, discontinue, or update any portion of the Platform at any time without liability.</p>
        <p>This may include changes to:</p>
        <ul>
          <li>pricing</li>
          <li>subscriptions</li>
          <li>bidding systems</li>
          <li>contractor visibility</li>
          <li>communication systems</li>
          <li>referral programs</li>
          <li>platform functionality</li>
          <li>AI systems</li>
        </ul>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    content: (
      <>
        <p>Users must be at least 18 years old and legally capable of entering binding agreements.</p>
        <p>Businesses using the Platform represent they have authority to bind their organization.</p>
        <p>Users agree to use the Platform only for lawful purposes.</p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: (
      <p>These Terms are governed by the laws of the State of Arizona, without regard to conflict-of-law principles.</p>
    ),
  },
];

function AccordionSection({
  section,
  index,
  activeSection,
}: {
  section: (typeof sections)[0];
  index: number;
  activeSection: string | null;
}) {
  const [open, setOpen] = useState(false);
  const isActive = activeSection === section.id;

  return (
    <section id={section.id} className="scroll-mt-28">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`group flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors ${
          open
            ? "border-border bg-card"
            : "border-transparent bg-secondary/50 hover:bg-secondary"
        }`}
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-foreground">
            {index + 1}
          </span>
          <span className={`font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
            {section.title}
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-1 rounded-xl border border-border bg-card px-5 pb-6 pt-5">
          <div className="prose-legal">
            {section.content}
          </div>
        </div>
      )}
    </section>
  );
}

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileJump, setMobileJump] = useState("");

  function handleMobileJump(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setMobileJump(id);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setMobileJump(""), 1000);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Page header */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-2 text-muted-foreground">
              These Terms govern your use of the HomeBids platform.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">Last Updated: May 30, 2025</p>
          </div>

          {/* Intro card */}
          <div className="mb-10 space-y-3 rounded-2xl border border-border bg-card p-6 leading-relaxed text-muted-foreground">
            <p>Welcome to <strong className="text-foreground">HomeBids</strong>.</p>
            <p>These Terms of Service (&quot;Terms&quot;) govern your access to and use of the HomeBids website, mobile applications, communications systems, artificial intelligence systems, contractor discovery tools, and related services (collectively, the &quot;Platform&quot;).</p>
            <p>By accessing or using HomeBids, you agree to these Terms.</p>
            <p>If you do not agree, you may not use the Platform.</p>
          </div>

          {/* Mobile jump-to dropdown */}
          <div className="mb-8 lg:hidden">
            <label htmlFor="mobile-jump-terms" className="mb-1.5 block text-sm font-medium text-foreground">
              Jump to Section
            </label>
            <select
              id="mobile-jump-terms"
              value={mobileJump}
              onChange={handleMobileJump}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a section...</option>
              {sections.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i + 1}. {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Two-column layout: sidebar + content */}
          <div className="flex gap-10">
            {/* Sticky sidebar TOC — desktop only */}
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Table of Contents
                </p>
                <nav aria-label="Terms of Service sections">
                  <ol className="space-y-1">
                    {sections.map((s, i) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          onClick={() => setActiveSection(s.id)}
                          className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                            activeSection === s.id
                              ? "bg-primary/10 font-medium text-foreground"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/60 tabular-nums w-4">
                            {i + 1}.
                          </span>
                          <span>{s.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </aside>

            {/* Accordion sections */}
            <div className="min-w-0 flex-1 space-y-3">
              {sections.map((s, i) => (
                <AccordionSection
                  key={s.id}
                  section={s}
                  index={i}
                  activeSection={activeSection}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </main>

      <style>{`
        .prose-legal p { margin-bottom: 0.75rem; line-height: 1.7; color: var(--color-muted-foreground); }
        .prose-legal p:last-child { margin-bottom: 0; }
        .prose-legal ul { margin: 0.5rem 0 0.75rem 0; padding-left: 1.25rem; list-style: disc; }
        .prose-legal ul li { margin-bottom: 0.3rem; line-height: 1.6; color: var(--color-muted-foreground); }
      `}</style>

      <ScrollToTop />
    </div>
  );
}
