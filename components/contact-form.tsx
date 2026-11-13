"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Home, Building2, Send, CheckCircle2 } from "lucide-react";
import { submitContactMessage } from "@/lib/supabase/contact";

/**
 * The "Get in Touch" form — moved out of the footer popup (Nov 13 2026) so the same form serves the /contact page.
 * Storage + owner alert happen in the `submit_contact_message` RPC (see lib/supabase/contact.ts); nothing changed there.
 */
export function ContactForm({ onDone }: { onDone?: () => void }) {
  const [contactType, setContactType] = useState<"homeowner" | "contractor">("homeowner");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setSendError(false);
    const { ok } = await submitContactMessage({
      type: contactType,
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      message: contactMessage,
    });
    setSending(false);
    if (ok) {
      setSubmitted(true);
    } else {
      setSendError(true);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 text-center" data-hb-contact-sent>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-foreground">Message Sent!</h3>
        <p className="mt-2 text-muted-foreground">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
        {onDone && (
          <Button className="mt-6" onClick={onDone}>Done</Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-hb-contact-form>
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
        disabled={sending || !contactName.trim() || !contactEmail.trim() || !contactPhone.trim() || !contactMessage.trim()}>
        <Send className="h-4 w-4" />{sending ? "Sending…" : "Send Message"}
      </Button>
      {sendError && (
        <p className="text-center text-sm text-red-600">
          Couldn&apos;t send your message — please try again.
        </p>
      )}
    </form>
  );
}
