"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { motion } from "framer-motion";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";

const sections = [
  {
    id: "info-collect",
    title: "Information We Collect",
    content: (
      <>
        <p>HomeBids may collect information including:</p>
        <ul>
          <li>name</li>
          <li>email address</li>
          <li>phone number</li>
          <li>property address</li>
          <li>project details</li>
          <li>contractor business information</li>
          <li>service areas</li>
        </ul>
      </>
    ),
  },
  {
    id: "public-contractor-data",
    title: "Public Contractor Information",
    content: (
      <>
        <p>HomeBids may collect contractor information from publicly available sources including:</p>
        <ul>
          <li>business directories</li>
          <li>contractor websites</li>
          <li>licensing databases</li>
          <li>public review platforms</li>
        </ul>
        <p>This information may be used to identify contractors relevant to homeowner projects.</p>
      </>
    ),
  },
  {
    id: "auto-collected",
    title: "Automatically Collected Information",
    content: (
      <>
        <p>We may automatically collect information including:</p>
        <ul>
          <li>IP address</li>
          <li>browser type</li>
          <li>device information</li>
          <li>usage patterns</li>
          <li>session activity</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-used",
    title: "How Information Is Used",
    content: (
      <>
        <p>Information may be used to:</p>
        <ul>
          <li>connect homeowners with contractors</li>
          <li>distribute project opportunities</li>
          <li>improve platform functionality</li>
          <li>analyze usage patterns</li>
          <li>detect fraud or abuse</li>
        </ul>
      </>
    ),
  },
  {
    id: "lead-distribution",
    title: "Lead Distribution",
    content: (
      <>
        <p>When a homeowner submits a project request, HomeBids may share project information with contractors.</p>
        <p>Contractors may contact homeowners directly.</p>
      </>
    ),
  },
  {
    id: "affiliate-program",
    title: "Affiliate and Referral Program",
    content: (
      <>
        <p>HomeBids operates an affiliate program allowing users to earn compensation for referrals.</p>
        <p>Participants may receive commissions or revenue shares.</p>
        <p>Affiliate participants may have financial incentives to promote the Platform.</p>
        <p>HomeBids is not responsible for statements made by affiliates.</p>
      </>
    ),
  },
  {
    id: "ai-systems",
    title: "Artificial Intelligence Systems",
    content: (
      <>
        <p>HomeBids may use automated systems and artificial intelligence to assist with contractor discovery, project categorization, and lead distribution.</p>
        <p>AI-generated results are informational only.</p>
      </>
    ),
  },
  {
    id: "aggregated-data",
    title: "Aggregated and De-Identified Data",
    content: (
      <>
        <p>HomeBids may create aggregated or de-identified datasets derived from platform activity.</p>
        <p>These datasets may be used for analytics, research, platform improvement, and development of automated systems.</p>
        <p>HomeBids retains ownership of aggregated datasets.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and Tracking",
    content: (
      <p>HomeBids may use cookies and similar technologies to analyze traffic, improve platform functionality, and enhance user experience.</p>
    ),
  },
  {
    id: "third-party",
    title: "Third-Party Services",
    content: (
      <p>HomeBids may use third-party providers for services such as hosting, analytics, communications, and authentication.</p>
    ),
  },
  {
    id: "data-security",
    title: "Data Security",
    content: (
      <>
        <p>HomeBids uses reasonable safeguards designed to protect personal information.</p>
        <p>However, no system can guarantee complete security.</p>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: (
      <p>HomeBids may retain information as long as necessary to operate the Platform, comply with legal obligations, and resolve disputes.</p>
    ),
  },
  {
    id: "user-content",
    title: "User Content",
    content: (
      <>
        <p>Users may submit reviews, project descriptions, and contractor profiles.</p>
        <p>By submitting content, users grant HomeBids permission to display and use such content in connection with the Platform.</p>
      </>
    ),
  },
  {
    id: "policy-changes",
    title: "Changes to Privacy Policy",
    content: (
      <>
        <p>HomeBids may update this policy periodically.</p>
        <p>Continued use of the Platform constitutes acceptance of updates.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        HomeBids<br />
        [Insert Address]<br />
        [Insert Support Email]<br />
        [Insert Website URL]
      </p>
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

export default function PrivacyPolicyPage() {
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
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-muted-foreground">
              How HomeBids collects and uses information.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">Last Updated: March 11, 2026</p>
          </div>

          {/* Intro card */}
          <div className="mb-10 rounded-2xl border border-border bg-card p-6 leading-relaxed text-muted-foreground">
            <p>This Privacy Policy describes how HomeBids collects, uses, and shares information in connection with the Platform. By using HomeBids, you agree to the practices described below.</p>
          </div>

          {/* Mobile jump-to dropdown */}
          <div className="mb-8 lg:hidden">
            <label htmlFor="mobile-jump-privacy" className="mb-1.5 block text-sm font-medium text-foreground">
              Jump to Section
            </label>
            <select
              id="mobile-jump-privacy"
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
                <nav aria-label="Privacy Policy sections">
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
