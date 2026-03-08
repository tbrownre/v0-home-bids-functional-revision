"use client";

import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    content: (
      <>
        <p className="text-muted-foreground mb-4">
          HomeBids may collect several types of information when users interact with the Platform.
        </p>
        <h3 className="text-base font-semibold text-foreground mb-2">Personal Information</h3>
        <p className="text-muted-foreground mb-2">Information users may provide includes:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Property address</li>
          <li>Account login credentials</li>
          <li>Project details submitted by homeowners</li>
          <li>Contractor business information</li>
          <li>Contractor service areas</li>
          <li>Profile information</li>
        </ul>
        <p className="text-muted-foreground">
          Homeowners may also submit project details such as descriptions of requested work, photos, budgets, or timelines.
        </p>
      </>
    ),
  },
  {
    title: "2. Contractor Business Information",
    content: (
      <>
        <p className="text-muted-foreground mb-2">Contractors may provide business-related information including:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Business name</li>
          <li>Contact details</li>
          <li>Licensing information</li>
          <li>Insurance details</li>
          <li>Service categories</li>
          <li>Service areas</li>
          <li>Bid pricing</li>
        </ul>
        <p className="text-muted-foreground">
          Contractors are responsible for ensuring the accuracy of the information they provide.
        </p>
      </>
    ),
  },
  {
    title: "3. Publicly Available Information",
    content: (
      <>
        <p className="text-muted-foreground mb-2">
          HomeBids may collect and organize publicly available business information about contractors from third-party sources including:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Business directories</li>
          <li>Public websites</li>
          <li>Publicly listed contact details</li>
          <li>Publicly available online reviews</li>
          <li>Licensing databases</li>
        </ul>
        <p className="text-muted-foreground mb-2">
          This information may be used to identify contractors relevant to homeowner project requests.
        </p>
        <p className="text-muted-foreground">
          HomeBids does not guarantee the accuracy or completeness of publicly sourced data.
        </p>
      </>
    ),
  },
  {
    title: "4. Automatically Collected Information",
    content: (
      <>
        <p className="text-muted-foreground mb-2">
          When users interact with the Platform, HomeBids may automatically collect certain technical information including:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>IP address</li>
          <li>Device type</li>
          <li>Browser type</li>
          <li>Operating system</li>
          <li>Usage activity</li>
          <li>Pages viewed</li>
          <li>Session duration</li>
          <li>Referral sources</li>
        </ul>
        <p className="text-muted-foreground">
          This information helps improve platform performance and security.
        </p>
      </>
    ),
  },
  {
    title: "5. How We Use Information",
    content: (
      <>
        <p className="text-muted-foreground mb-2">HomeBids may use collected information to:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Create and manage accounts</li>
          <li>Connect homeowners with contractors</li>
          <li>Distribute project requests to contractors</li>
          <li>Allow messaging between users</li>
          <li>Improve platform functionality</li>
          <li>Analyze platform usage</li>
          <li>Detect fraud or abuse</li>
          <li>Provide customer support</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p className="text-muted-foreground">
          HomeBids may also use information to develop and improve automated contractor matching systems.
        </p>
      </>
    ),
  },
  {
    title: "6. Lead Distribution and Contractor Outreach",
    content: (
      <>
        <p className="text-muted-foreground mb-2">
          When a homeowner submits a project request, HomeBids may distribute project details to contractors who may wish to bid on the work.
        </p>
        <p className="text-muted-foreground mb-2">This may include sharing:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Homeowner name</li>
          <li>Property location</li>
          <li>Project description</li>
          <li>Photos or attachments</li>
        </ul>
        <p className="text-muted-foreground mb-2">
          Contractors may contact homeowners directly regarding project opportunities.
        </p>
        <p className="text-muted-foreground">
          HomeBids does not guarantee contractor responses or bids.
        </p>
      </>
    ),
  },
  {
    title: "7. Communications",
    content: (
      <>
        <p className="text-muted-foreground mb-2">Users may receive communications from HomeBids including:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Project alerts</li>
          <li>Contractor bid notifications</li>
          <li>Account notifications</li>
          <li>Service announcements</li>
          <li>Platform updates</li>
          <li>Marketing communications</li>
        </ul>
        <p className="text-muted-foreground mb-2">These communications may be sent using automated systems.</p>
        <p className="text-muted-foreground">Users may opt out of non-essential communications.</p>
      </>
    ),
  },
  {
    title: "8. Cookies and Tracking Technologies",
    content: (
      <>
        <p className="text-muted-foreground mb-2">HomeBids may use cookies and similar tracking technologies to:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Remember user preferences</li>
          <li>Analyze traffic patterns</li>
          <li>Improve platform functionality</li>
          <li>Detect security issues</li>
          <li>Personalize user experiences</li>
        </ul>
        <p className="text-muted-foreground">Users may adjust cookie settings through their browser preferences.</p>
      </>
    ),
  },
  {
    title: "9. Third-Party Services",
    content: (
      <>
        <p className="text-muted-foreground mb-2">HomeBids may use third-party providers for services including:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Cloud hosting</li>
          <li>Payment processing</li>
          <li>Analytics</li>
          <li>Authentication</li>
          <li>Communications services</li>
          <li>Fraud prevention</li>
        </ul>
        <p className="text-muted-foreground">These providers only access information necessary to perform their services.</p>
      </>
    ),
  },
  {
    title: "10. Artificial Intelligence and Automated Systems",
    content: (
      <>
        <p className="text-muted-foreground mb-2">
          HomeBids may use automated systems, artificial intelligence, and machine learning tools to assist with:
        </p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Contractor discovery</li>
          <li>Contractor matching</li>
          <li>Project categorization</li>
          <li>Lead distribution</li>
          <li>Fraud detection</li>
        </ul>
        <p className="text-muted-foreground mb-2">
          Automated recommendations generated by these systems are informational only.
        </p>
        <p className="text-muted-foreground">
          Users should independently evaluate contractors before making hiring decisions.
        </p>
      </>
    ),
  },
  {
    title: "11. Data Security",
    content: (
      <p className="text-muted-foreground">
        HomeBids uses commercially reasonable safeguards designed to protect personal information from unauthorized access, disclosure, or misuse. However, no internet transmission or electronic storage method can be guaranteed completely secure.
      </p>
    ),
  },
  {
    title: "12. Data Retention",
    content: (
      <>
        <p className="text-muted-foreground mb-2">HomeBids may retain personal information as long as necessary to:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Provide services</li>
          <li>Comply with legal obligations</li>
          <li>Resolve disputes</li>
          <li>Enforce agreements</li>
        </ul>
        <p className="text-muted-foreground">
          Information may be retained after account closure when necessary for legitimate business purposes.
        </p>
      </>
    ),
  },
  {
    title: "13. User Content",
    content: (
      <>
        <p className="text-muted-foreground mb-2">Users may submit content including:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Reviews</li>
          <li>Ratings</li>
          <li>Project descriptions</li>
          <li>Contractor profiles</li>
          <li>Messages</li>
        </ul>
        <p className="text-muted-foreground">
          By submitting content, users grant HomeBids a worldwide license to display and use such content in connection with the Platform.
        </p>
      </>
    ),
  },
  {
    title: "14. Children's Privacy",
    content: (
      <>
        <p className="text-muted-foreground mb-2">The Platform is not intended for individuals under the age of 18.</p>
        <p className="text-muted-foreground mb-2">HomeBids does not knowingly collect personal information from children.</p>
        <p className="text-muted-foreground">If such information is discovered, it will be removed.</p>
      </>
    ),
  },
  {
    title: "15. User Rights",
    content: (
      <>
        <p className="text-muted-foreground mb-2">Depending on applicable law, users may have the right to:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1 mb-4">
          <li>Access their personal data</li>
          <li>Request corrections</li>
          <li>Request deletion of personal data</li>
          <li>Opt out of certain communications</li>
        </ul>
        <p className="text-muted-foreground">Requests may be submitted through the contact information below.</p>
      </>
    ),
  },
  {
    title: "16. California Privacy Rights",
    content: (
      <>
        <p className="text-muted-foreground mb-2">
          California residents may have rights under the California Consumer Privacy Act (CCPA).
        </p>
        <p className="text-muted-foreground">
          HomeBids does not sell personal information in exchange for monetary compensation.
        </p>
      </>
    ),
  },
  {
    title: "17. International Users",
    content: (
      <>
        <p className="text-muted-foreground mb-2">The Platform is operated in the United States.</p>
        <p className="text-muted-foreground">
          Users accessing the Platform from outside the United States acknowledge that information may be transferred and processed in the United States.
        </p>
      </>
    ),
  },
  {
    title: "18. Changes to This Privacy Policy",
    content: (
      <>
        <p className="text-muted-foreground mb-2">HomeBids may update this Privacy Policy periodically.</p>
        <p className="text-muted-foreground mb-2">Updates will be posted on this page with an updated revision date.</p>
        <p className="text-muted-foreground">Continued use of the Platform constitutes acceptance of the revised policy.</p>
      </>
    ),
  },
  {
    title: "19. Contact Information",
    content: (
      <p className="text-muted-foreground">
        HomeBids<br />
        [Insert Company Address]<br />
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
              How HomeBids collects, uses, and protects your information.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Last Updated: March 6, 2026</p>
          </div>

          {/* Introduction */}
          <p className="mb-10 leading-relaxed text-muted-foreground">
            HomeBids (&quot;HomeBids&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how HomeBids collects, uses, discloses, and safeguards information when you use our website, mobile applications, and related services (collectively, the &quot;Platform&quot;). By accessing or using the Platform, you agree to the practices described in this Privacy Policy.
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
