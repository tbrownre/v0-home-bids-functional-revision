import Link from "next/link";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { Header } from "@/components/header";
import { ContactForm } from "@/components/contact-form";
import { COMPANY, COMPANY_MAILING_ONE_LINE } from "@/lib/company";
import { pageMeta } from "@/lib/seo";

/**
 * /contact — A2P/10DLC review (Tim, Nov 13 2026): a contact page linked from the header and footer with the full
 * company details — legal name, phone, email and the mailing address (registered agent address) — plus the same
 * "Get in Touch" form the footer popup used to open.
 */
export const metadata = pageMeta({
  title: "Contact HomeBids",
  description: `Contact ${COMPANY.legalName}: ${COMPANY.phoneDisplay}, ${COMPANY.email}, ${COMPANY_MAILING_ONE_LINE}.`,
  path: "/contact",
});

export default function ContactPage() {
  const rows = [
    { Icon: Building2, label: "Company", value: COMPANY.legalName },
    { Icon: Phone, label: "Phone", value: COMPANY.phoneDisplay, href: `tel:${COMPANY.phoneE164}` },
    { Icon: Mail, label: "Email", value: COMPANY.email, href: `mailto:${COMPANY.email}` },
    { Icon: MapPin, label: "Mailing address", value: COMPANY_MAILING_ONE_LINE },
  ];

  return (
    <div className="min-h-screen bg-background" data-hb-contact>
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Contact</p>
          <h1 className="text-balance text-4xl font-bold text-foreground sm:text-5xl">Get in touch with {COMPANY.brand}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Questions about your account, a bid, a lead or our text messages — call, email or send a message below.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Company details */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="contact-details-heading" data-hb-contact-details>
            <h2 id="contact-details-heading" className="text-lg font-semibold text-foreground">{COMPANY.legalName}</h2>
            <dl className="mt-5 space-y-5">
              {rows.map(({ Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-base font-medium text-foreground">
                      {href ? (
                        <a href={href} className="hover:underline">{value}</a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Text messages from {COMPANY.brand}: reply STOP to opt out at any time, HELP for help. Message frequency varies. Message &amp; data rates may apply. See our{" "}
              <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link> and{" "}
              <Link href="/terms" className="underline underline-offset-2">Terms of Service</Link>.
            </p>
          </section>

          {/* Message form */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading" className="text-lg font-semibold text-foreground">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">We reply within 24 hours.</p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
