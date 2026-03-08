"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Home, Building2, Send, CheckCircle2, ChevronUp } from "lucide-react";

// Flyout group — keeps open while hovering trigger or panel
function FlyoutGroup({ label, items }: { label: string; items: { href?: string; label: string; onClick?: () => void }[] }) {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        {label}
        <ChevronUp
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-1/2 z-[100] mb-2 -translate-x-1/2 rounded-xl border border-border bg-background shadow-lg"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <ul className="min-w-[140px] py-1.5">
            {items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => { item.onClick?.(); setOpen(false); }}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Footer() {
  const pathname = usePathname();
  // Don't render footer on admin routes — admin has its own layout
  if (pathname?.startsWith("/admin")) return null;

  const [showContact, setShowContact] = useState(false);
  const [contactType, setContactType] = useState<"homeowner" | "contractor">("homeowner");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const resetForm = () => {
    setContactName(""); setContactEmail(""); setContactPhone("");
    setContactMessage(""); setContactType("homeowner"); setSubmitted(false);
  };

  return (
    <>
      <footer className="relative z-50 border-t border-border bg-background overflow-visible">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Mobile: stacked centered layout */}
          <div className="flex flex-col items-center gap-4 py-6 sm:hidden">
            <nav className="flex flex-row items-center justify-center gap-5" aria-label="Footer navigation">
              <FlyoutGroup
                label="Platform"
                items={[
                  { href: "/how-it-works", label: "How It Works" },
                  { href: "/homeowners", label: "For Homeowners" },
                  { href: "/contractors", label: "For Contractors" },
                  { href: "/subscribe", label: "Pricing" },
                ]}
              />
              <FlyoutGroup
                label="Company"
                items={[
                  { href: "/about", label: "About Us" },
                  { href: "/affiliates", label: "Affiliates" },
                  { label: "Contact", onClick: () => setShowContact(true) },
                ]}
              />
              <FlyoutGroup
                label="Legal"
                items={[
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/terms", label: "Terms of Service" },
                ]}
              />
            </nav>
            <div className="border-t border-border w-full pt-4 text-center">
              <Link href="/" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                HomeBids.io
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} HomeBids.io. All rights reserved.
              </p>
            </div>
          </div>

          {/* Desktop: single-line layout */}
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-y-2 py-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                HomeBids.io
              </Link>
              <span className="text-muted-foreground/40">|</span>
              <span className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} HomeBids.io. All rights reserved.
              </span>
            </div>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Footer navigation">
              <FlyoutGroup
                label="Platform"
                items={[
                  { href: "/how-it-works", label: "How It Works" },
                  { href: "/homeowners", label: "For Homeowners" },
                  { href: "/contractors", label: "For Contractors" },
                  { href: "/subscribe", label: "Pricing" },
                ]}
              />
              <FlyoutGroup
                label="Company"
                items={[
                  { href: "/about", label: "About Us" },
                  { href: "/affiliates", label: "Affiliates" },
                  { label: "Contact", onClick: () => setShowContact(true) },
                ]}
              />
              <FlyoutGroup
                label="Legal"
                items={[
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/terms", label: "Terms of Service" },
                ]}
              />
            </nav>
          </div>

        </div>
      </footer>

      {/* Contact Modal */}
      <Dialog open={showContact} onOpenChange={(open) => { setShowContact(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md overflow-hidden p-0">
          {!submitted ? (
            <>
              <DialogHeader className="px-6 pb-4 pt-6">
                <DialogTitle className="text-xl font-semibold">Get in Touch</DialogTitle>
                <DialogDescription>Have a question? We&apos;d love to hear from you.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">I am a</Label>
                  <div className="flex rounded-xl bg-muted p-1">
                    {(["homeowner", "contractor"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContactType(type)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                          contactType === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {type === "homeowner" ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        {type === "homeowner" ? "Property Owner" : "Contractor"}
                      </button>
                    ))}
                  </div>
                </div>
                {[
                  { id: "contact-name", label: "Name", type: "text", placeholder: "Your name", value: contactName, onChange: setContactName },
                  { id: "contact-email", label: "Email", type: "email", placeholder: "you@example.com", value: contactEmail, onChange: setContactEmail },
                  { id: "contact-phone", label: "Phone", type: "tel", placeholder: "(555) 123-4567", value: contactPhone, onChange: setContactPhone },
                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-sm font-medium">{field.label}</Label>
                    <Input id={field.id} type={field.type} placeholder={field.placeholder} value={field.value}
                      onChange={(e) => field.onChange(e.target.value)} className="h-11" required />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="contact-message" className="text-sm font-medium">Message</Label>
                  <Textarea id="contact-message" placeholder="How can we help?" value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)} className="min-h-[100px] resize-none" required />
                </div>
                <Button type="submit" className="h-11 w-full gap-2"
                  disabled={!contactName.trim() || !contactEmail.trim() || !contactPhone.trim() || !contactMessage.trim()}>
                  <Send className="h-4 w-4" />Send Message
                </Button>
              </form>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">Message Sent!</h3>
              <p className="mt-2 text-muted-foreground">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
              <Button className="mt-6" onClick={() => setShowContact(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
