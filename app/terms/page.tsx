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
        <p>HomeBids operates a technology platform that connects homeowners seeking home services with independent contractors willing to submit bids for those services.</p>
        <p>When a homeowner submits a project request, the homeowner authorizes HomeBids to distribute the project to contractors who may wish to bid.</p>
        <p>HomeBids may use automated systems, artificial intelligence, and outreach tools to identify contractors relevant to a project.</p>
        <p>HomeBids does not perform construction services. The Platform only facilitates introductions between homeowners and contractors.</p>
      </>
    ),
  },
  {
    id: "authorization",
    title: "Authorization to Seek Bids",
    content: (
      <>
        <p>By submitting a project request, homeowners authorize HomeBids to:</p>
        <ul>
          <li>distribute project information to contractors</li>
          <li>invite contractors to submit bids</li>
          <li>allow contractors to contact homeowners</li>
        </ul>
        <p>HomeBids does not guarantee contractor responses or bids.</p>
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
        </ul>
        <p>Contractors are responsible for licensing, insurance, permits, and compliance with applicable laws.</p>
      </>
    ),
  },
  {
    id: "safe-harbor",
    title: "Platform Safe Harbor",
    content: (
      <>
        <p>HomeBids operates solely as a neutral technology platform facilitating introductions between homeowners and contractors.</p>
        <p>HomeBids is not responsible for contractor services, project outcomes, or agreements between users.</p>
        <p>Any service agreement exists solely between the homeowner and contractor.</p>
      </>
    ),
  },
  {
    id: "no-project-management",
    title: "No Project Management or Payment Handling",
    content: (
      <>
        <p>HomeBids does not manage construction projects and does not process payments between homeowners and contractors.</p>
        <p>HomeBids does not provide:</p>
        <ul>
          <li>escrow services</li>
          <li>project supervision</li>
          <li>contractor warranties</li>
          <li>dispute mediation</li>
        </ul>
        <p>All agreements are negotiated directly between users.</p>
      </>
    ),
  },
  {
    id: "ai-matching",
    title: "AI and Algorithmic Matching",
    content: (
      <>
        <p>HomeBids may use automated systems, machine learning, and artificial intelligence to identify contractors relevant to homeowner projects.</p>
        <p>These systems may analyze factors including:</p>
        <ul>
          <li>contractor service categories</li>
          <li>geographic proximity</li>
          <li>responsiveness</li>
          <li>profile completeness</li>
          <li>platform activity</li>
        </ul>
        <p>Algorithmic results are informational only and do not represent endorsements.</p>
      </>
    ),
  },
  {
    id: "affiliate-program",
    title: "Affiliate and Referral Program",
    content: (
      <>
        <p>HomeBids operates an affiliate and referral program.</p>
        <p>Participants may receive compensation for referring homeowners or contractors to the Platform.</p>
        <p>Compensation may include:</p>
        <ul>
          <li>referral commissions</li>
          <li>recurring subscription revenue shares</li>
          <li>promotional bonuses</li>
        </ul>
        <p>Affiliate participants may have financial incentives to promote HomeBids.</p>
        <p>HomeBids does not guarantee earnings through the affiliate program.</p>
        <p>Affiliate participation does not create employment, partnership, or agency relationships.</p>
      </>
    ),
  },
  {
    id: "contractor-referral",
    title: "Contractor Referral Incentives",
    content: (
      <>
        <p>Contractors may receive compensation for referring homeowners to the Platform.</p>
        <p>As a result, contractors referring homeowners may have financial incentives to promote HomeBids.</p>
        <p>HomeBids does not influence homeowner hiring decisions.</p>
        <p>Contractors compete independently for projects.</p>
      </>
    ),
  },
  {
    id: "marketplace-neutrality",
    title: "Marketplace Neutrality",
    content: (
      <>
        <p>HomeBids operates as a neutral technology platform.</p>
        <p>HomeBids does not recommend specific contractors.</p>
        <p>Contractor visibility may depend on factors including:</p>
        <ul>
          <li>geographic relevance</li>
          <li>responsiveness</li>
          <li>subscription status</li>
          <li>algorithmic systems</li>
        </ul>
        <p>These factors do not represent endorsements.</p>
      </>
    ),
  },
  {
    id: "no-guarantee",
    title: "No Guarantee of Work",
    content: (
      <>
        <p>HomeBids does not guarantee contractors will receive project opportunities, leads, or revenue.</p>
        <p>Contractor success depends on market demand, homeowner preferences, responsiveness, and pricing competitiveness.</p>
      </>
    ),
  },
  {
    id: "communications",
    title: "Platform Communications",
    content: (
      <>
        <p>The Platform may enable communication between homeowners and contractors.</p>
        <p>HomeBids does not verify or guarantee the accuracy of statements exchanged between users.</p>
        <p>Users are solely responsible for communications conducted through the Platform.</p>
      </>
    ),
  },
  {
    id: "fees",
    title: "Fees",
    content: (
      <>
        <p>HomeBids may charge subscription fees or bid placement fees.</p>
        <p>Fees are generally non-refundable unless required by law.</p>
        <p>HomeBids may modify pricing at any time.</p>
      </>
    ),
  },
  {
    id: "information-accuracy",
    title: "Information Accuracy Disclaimer",
    content: (
      <>
        <p>Information on the Platform may originate from user submissions, publicly available sources, automated systems, or third-party databases.</p>
        <p>HomeBids does not guarantee accuracy or completeness.</p>
        <p>Users should verify information before entering agreements.</p>
      </>
    ),
  },
  {
    id: "limitation",
    title: "Limitation of Liability",
    content: (
      <>
        <p>To the maximum extent permitted by law, HomeBids is not liable for damages arising from contractor services, project outcomes, or user interactions.</p>
        <p>Total liability shall not exceed $100 or the amount paid to HomeBids within the previous 12 months.</p>
      </>
    ),
  },
  {
    id: "arbitration",
    title: "Arbitration and Class Action Waiver",
    content: (
      <>
        <p>Disputes related to the Platform will be resolved through binding arbitration.</p>
        <p>Users waive the right to participate in class-action lawsuits.</p>
      </>
    ),
  },
  {
    id: "modifications",
    title: "Platform Modifications",
    content: (
      <>
        <p>HomeBids may modify or discontinue Platform features at any time.</p>
        <p>This may include changes to pricing, subscriptions, bidding systems, referral programs, or contractor visibility.</p>
        <p>HomeBids is not liable for losses resulting from platform changes.</p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: <p>These Terms are governed by the laws of the State of Arizona.</p>,
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
            <p className="mt-1 text-xs text-muted-foreground/60">Last Updated: March 11, 2026</p>
          </div>

          {/* Intro card */}
          <div className="mb-10 space-y-3 rounded-2xl border border-border bg-card p-6 leading-relaxed text-muted-foreground">
            <p>Welcome to <strong className="text-foreground">HomeBids</strong>.</p>
            <p>These Terms of Service (&quot;Terms&quot;) govern your access to and use of the HomeBids website, mobile applications, and related services (the &quot;Platform&quot;).</p>
            <p>By accessing or using the Platform you agree to these Terms.</p>
            <p>If you do not agree, you may not use HomeBids.</p>
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
