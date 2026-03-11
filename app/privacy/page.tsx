"use client";

import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "Section 1 — Information We Collect",
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
    title: "Section 2 — Public Contractor Information",
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
    title: "Section 3 — Automatically Collected Information",
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
    title: "Section 4 — How Information Is Used",
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
    title: "Section 5 — Lead Distribution",
    content: (
      <>
        <p>When a homeowner submits a project request, HomeBids may share project information with contractors.</p>
        <p>Contractors may contact homeowners directly.</p>
      </>
    ),
  },
  {
    title: "Section 6 — Affiliate and Referral Program",
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
    title: "Section 7 — Artificial Intelligence Systems",
    content: (
      <>
        <p>HomeBids may use automated systems and artificial intelligence to assist with contractor discovery, project categorization, and lead distribution.</p>
        <p>AI-generated results are informational only.</p>
      </>
    ),
  },
  {
    title: "Section 8 — Aggregated and De-Identified Data",
    content: (
      <>
        <p>HomeBids may create aggregated or de-identified datasets derived from platform activity.</p>
        <p>These datasets may be used for analytics, research, platform improvement, and development of automated systems.</p>
        <p>HomeBids retains ownership of aggregated datasets.</p>
      </>
    ),
  },
  {
    title: "Section 9 — Cookies and Tracking",
    content: (
      <p>HomeBids may use cookies and similar technologies to analyze traffic, improve platform functionality, and enhance user experience.</p>
    ),
  },
  {
    title: "Section 10 — Third-Party Services",
    content: (
      <p>HomeBids may use third-party providers for services such as hosting, analytics, communications, and authentication.</p>
    ),
  },
  {
    title: "Section 11 — Data Security",
    content: (
      <>
        <p>HomeBids uses reasonable safeguards designed to protect personal information.</p>
        <p>However, no system can guarantee complete security.</p>
      </>
    ),
  },
  {
    title: "Section 12 — Data Retention",
    content: (
      <p>HomeBids may retain information as long as necessary to operate the Platform, comply with legal obligations, and resolve disputes.</p>
    ),
  },
  {
    title: "Section 13 — User Content",
    content: (
      <>
        <p>Users may submit reviews, project descriptions, and contractor profiles.</p>
        <p>By submitting content, users grant HomeBids permission to display and use such content in connection with the Platform.</p>
      </>
    ),
  },
  {
    title: "Section 14 — Changes to Privacy Policy",
    content: (
      <>
        <p>HomeBids may update this policy periodically.</p>
        <p>Continued use of the Platform constitutes acceptance of updates.</p>
      </>
    ),
  },
  {
    title: "Section 15 — Contact",
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

export default function PrivacyPolicyPage() {
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
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl text-balance">
              Privacy Policy
            </h1>
            <p className="mt-2 text-muted-foreground">
              How HomeBids collects and uses information.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Last Updated: [Insert Date]</p>
          </div>

          {/* Introduction */}
          <p className="mb-10 leading-relaxed text-muted-foreground">
            This Privacy Policy describes how HomeBids collects, uses, and shares information in connection with the Platform. By using HomeBids, you agree to the practices described below.
          </p>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title} className="border-t border-border pt-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">{section.title}</h2>
                <div className="leading-relaxed">{section.content}</div>
              </section>
            ))}
          </div>
        </motion.div>
      </main>

      <ScrollToTop />
    </div>
  );
}
