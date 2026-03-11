"use client";

import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const sections = [
  {
    id: "platform-overview",
    title: "Section 1 — Platform Overview",
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
    title: "Section 2 — Authorization to Seek Bids",
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
    title: "Section 3 — Independent Contractors",
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
    title: "Section 4 — Platform Safe Harbor",
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
    title: "Section 5 — No Project Management or Payment Handling",
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
    title: "Section 6 — AI and Algorithmic Matching",
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
    title: "Section 7 — Affiliate and Referral Program",
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
    title: "Section 8 — Contractor Referral Incentives",
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
    title: "Section 9 — Marketplace Neutrality",
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
    title: "Section 10 — No Guarantee of Work",
    content: (
      <>
        <p>HomeBids does not guarantee contractors will receive project opportunities, leads, or revenue.</p>
        <p>Contractor success depends on market demand, homeowner preferences, responsiveness, and pricing competitiveness.</p>
      </>
    ),
  },
  {
    id: "communications",
    title: "Section 11 — Platform Communications",
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
    title: "Section 12 — Fees",
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
    title: "Section 13 — Information Accuracy Disclaimer",
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
    title: "Section 14 — Limitation of Liability",
    content: (
      <>
        <p>To the maximum extent permitted by law, HomeBids is not liable for damages arising from contractor services, project outcomes, or user interactions.</p>
        <p>Total liability shall not exceed $100 or the amount paid to HomeBids within the previous 12 months.</p>
      </>
    ),
  },
  {
    id: "arbitration",
    title: "Section 15 — Arbitration and Class Action Waiver",
    content: (
      <>
        <p>Disputes related to the Platform will be resolved through binding arbitration.</p>
        <p>Users waive the right to participate in class-action lawsuits.</p>
      </>
    ),
  },
  {
    id: "modifications",
    title: "Section 16 — Platform Modifications",
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
    title: "Section 17 — Governing Law",
    content: <p>These Terms are governed by the laws of the State of Arizona.</p>,
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page header */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Terms of Service</h1>
            <p className="mt-2 text-sm text-muted-foreground">These Terms govern your use of the HomeBids platform.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Last Updated: [Insert Date]</p>
          </div>

          {/* Intro */}
          <div className="mb-10 space-y-4 rounded-2xl border border-border bg-card p-6">
            <p className="text-muted-foreground">
              Welcome to <strong className="text-foreground">HomeBids</strong>.
            </p>
            <p className="text-muted-foreground">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the HomeBids website, mobile applications, and related services (the &quot;Platform&quot;).
            </p>
            <p className="text-muted-foreground">
              By accessing or using the Platform you agree to these Terms.
            </p>
            <p className="text-muted-foreground">
              If you do not agree, you may not use HomeBids.
            </p>
          </div>

          {/* Anchor nav */}
          <nav className="mb-12 rounded-2xl border border-border bg-card p-6" aria-label="Table of contents">
            <p className="mb-4 text-sm font-semibold text-foreground">Table of Contents</p>
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="mb-4 text-lg font-semibold text-foreground">{s.title}</h2>
                <div className="space-y-3 text-muted-foreground [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:list-disc [&_p]:leading-relaxed">
                  {s.content}
                </div>
                <div className="mt-10 border-b border-border" />
              </section>
            ))}
          </div>
        </motion.div>
      </main>

      <ScrollToTop />
    </div>
  );
}
