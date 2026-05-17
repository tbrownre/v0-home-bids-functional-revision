"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMockUser, USE_MOCK_DATA } from "@/lib/mock-auth";
import {
  MessageCircle,
  Zap,
  Clock,
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";

const HOMEBIDS_PHONE = "555-867-5309";
const SMS_BODY = "Hi, I'd like to start a project with HomeBids.";
const SMS_HREF = `sms:${HOMEBIDS_PHONE.replace(/\D/g, "")}?body=${encodeURIComponent(SMS_BODY)}`;

const PROJECT_TYPES = [
  "Roofing",
  "HVAC / Heating & Cooling",
  "Plumbing",
  "Electrical",
  "Kitchen Remodel",
  "Bathroom Remodel",
  "Painting",
  "Flooring",
  "Landscaping",
  "Fencing",
  "Deck / Patio",
  "Windows & Doors",
  "General Contractor",
  "Other",
];

const TRUST_BULLETS = [
  { icon: Zap, text: "Fastest way to get bids" },
  { icon: Clock, text: "Takes less than 30 seconds" },
  { icon: CheckCircle2, text: "Our AI does all the work for you" },
];

const CHAT_MESSAGES = [
  { role: "user",  text: "I need help replacing my AC unit" },
  { role: "ai",    text: "Got it — what's your zip code?" },
  { role: "user",  text: "90210" },
  { role: "ai",    text: "Do you have a preferred budget?" },
  { role: "user",  text: "Flexible, but under $5,000 ideally" },
  { role: "ai",    text: "Perfect. We're notifying top contractors near you now." },
];

// ── typing animation hook ──────────────────────────────────────────────────────

function useTypingChat(messages: typeof CHAT_MESSAGES) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visibleCount >= messages.length) return;
    const delay = visibleCount === 0 ? 600 : 900;
    const showTyping = setTimeout(() => {
      if (messages[visibleCount].role === "ai") {
        setTypingIndex(visibleCount);
        const reveal = setTimeout(() => {
          setTypingIndex(null);
          setVisibleCount((c) => c + 1);
        }, 1200);
        return () => clearTimeout(reveal);
      } else {
        setVisibleCount((c) => c + 1);
      }
    }, delay);
    return () => clearTimeout(showTyping);
  }, [visibleCount, messages]);

  return { visibleCount, typingIndex };
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function NewJobPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // SMS CTA state
  const [copied, setCopied] = useState(false);

  // Form fallback state
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  // ── auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!USE_MOCK_DATA) {
      setAuthReady(true);
      return;
    }
    const user = getMockUser();
    if (!user) {
      router.replace("/?signIn=true");
      return;
    }
    if (user.role === "contractor") {
      router.replace("/contractors/dashboard");
      return;
    }
    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }
    setIsSignedIn(true);
    setAuthReady(true);
  }, [router]);

  // ── SMS CTA handler ──────────────────────────────────────────────────────────
  const handleTextUs = useCallback(() => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = SMS_HREF;
    } else {
      navigator.clipboard.writeText(HOMEBIDS_PHONE).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, []);

  // ── form submit ──────────────────────────────────────────────────────────────
  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!description.trim() || !name.trim() || !phone.trim() || !email.trim() || !projectType) {
        setFormError("Please fill in all fields.");
        return;
      }
      setFormError("");
      setFormSubmitted(true);
    },
    [description, name, phone, email, projectType]
  );

  const { visibleCount, typingIndex } = useTypingChat(CHAT_MESSAGES);

  if (!authReady) return null;

  if (formSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary">
              <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-foreground">Job Submitted</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We&apos;ve received your project details. Our team will reach out to qualified contractors and you&apos;ll start receiving bids shortly.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/?showJobs=true">View Your Jobs</Link>
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setFormSubmitted(false)}>
                Submit Another Job
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="text-center">
          <h1 className="text-balance text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            Start Your Project<br />in 30 Seconds
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Text us your project and our AI will instantly start finding the best contractors for you.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll reach out to 100+ qualified contractors so you don&apos;t have to.
          </p>
        </section>

        {/* ── Primary CTA — iMessage-style card ────────────────────────────── */}
        <section className="mt-10">
          <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {/* Pulse ring */}
            <span className="absolute -inset-px rounded-2xl animate-pulse ring-2 ring-primary/10 pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#29CC4A]">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Most homeowners choose this option
                </p>
                <p className="text-sm font-semibold text-foreground">Text Us to Start</p>
              </div>
            </div>

            {/* iPhone chat mockup */}
            <div className="mt-6 rounded-xl bg-secondary px-4 py-4">
              <div className="space-y-2.5">
                {CHAT_MESSAGES.slice(0, visibleCount).map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "rounded-br-sm bg-[#29CC4A] text-white"
                          : "rounded-bl-sm bg-card text-foreground shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {typingIndex !== null && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-3.5 py-2.5 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trust bullets */}
            <ul className="mt-5 space-y-2">
              {TRUST_BULLETS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 shrink-0 text-foreground" />
                  {text}
                </li>
              ))}
            </ul>

            {/* CTA button */}
            <Button
              size="lg"
              className="relative mt-6 w-full gap-2 text-base"
              onClick={handleTextUs}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Number copied — text us to begin
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Text Us to Start
                </>
              )}
            </Button>

            {copied && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {HOMEBIDS_PHONE}
              </p>
            )}
          </div>
        </section>

        {/* ── Value reinforcement ───────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Why homeowners choose HomeBids
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { title: "100+ contractors notified", body: "We do the outreach so you never have to cold-call anyone." },
              { title: "Multiple competitive bids", body: "Compare real quotes side-by-side and choose with confidence." },
              { title: "No chasing or follow-ups", body: "Our AI manages the entire process start to finish." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ───────────────────────────────────────────────────────── */}
        <div className="relative mt-12 flex items-center gap-4" ref={formRef}>
          <div className="flex-1 border-t border-border" />
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            Prefer not to text? Post your job manually
            <ChevronDown className="h-3 w-3" />
          </button>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* ── Form fallback ─────────────────────────────────────────────────── */}
        <section className="mt-8">
          <form onSubmit={handleFormSubmit} noValidate>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-base font-semibold text-foreground">Post Your Job Manually</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill in the details below and we&apos;ll start finding contractors for you.
              </p>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Project Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project in as much detail as possible..."
                    className="min-h-[100px] resize-none"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Your Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 867-5309"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="project-type" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Project Type
                  </Label>
                  <Select value={projectType} onValueChange={setProjectType} required>
                    <SelectTrigger id="project-type">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formError && (
                <p className="mt-3 text-sm text-destructive">{formError}</p>
              )}

              <Button
                type="submit"
                variant="outline"
                className="mt-6 w-full"
                disabled={!description.trim() || !name.trim() || !phone.trim() || !email.trim() || !projectType}
              >
                Submit Job
              </Button>
            </div>
          </form>
        </section>

      </main>
    </div>
  );
}
