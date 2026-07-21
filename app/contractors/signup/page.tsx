"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Eye, EyeOff, Loader2, Shield, User, Wrench, Zap } from "lucide-react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getContractorOnboardingState, signUpContractor, updateContractorOnboardingInfo } from "@/lib/supabase/actions";

type Step = "info" | "trial";
type FormState = { fullName: string; phone: string; companyName: string; trade: string; serviceArea: string; email: string; password: string; confirmPassword: string; agreeToTerms: boolean; communicationsConsent: boolean };
const emptyForm: FormState = { fullName: "", phone: "", companyName: "", trade: "", serviceArea: "", email: "", password: "", confirmPassword: "", agreeToTerms: false, communicationsConsent: false };
const trades = ["Roofing", "Electrical", "Plumbing", "HVAC", "Garage Door", "Landscaping", "Painting", "Flooring", "Windows & Doors", "Kitchen & Bath", "Concrete & Masonry", "Siding", "Pest Control", "Appliance Repair", "Cleaning", "Home Security", "Pool & Spa", "Handyman", "Insulation", "Solar", "General Contractor", "Other"];

export default function ContractorSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");
  const [checking, setChecking] = useState(true);
  const [signedInEmail, setSignedInEmail] = useState("");
  const [showAccountChoice, setShowAccountChoice] = useState(false);
  const [homeownerError, setHomeownerError] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (field: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));
  const requiredValid = Boolean(form.fullName.trim() && form.phone.trim() && form.companyName.trim() && form.trade && form.serviceArea.trim() && /^\S+@\S+\.\S+$/.test(form.email) && form.password.length >= 8 && form.password === form.confirmPassword && form.agreeToTerms);

  const applyState = (state: NonNullable<Awaited<ReturnType<typeof getContractorOnboardingState>>["state"]>) => {
    setSignedInEmail(state.email);
    setForm((current) => ({ ...current, fullName: state.fullName, phone: state.phone, companyName: state.companyName, trade: state.trade, serviceArea: state.serviceArea, email: state.email }));
    if (state.userType === "homeowner") { setHomeownerError(true); return; }
    const status = state.subscription?.status;
    const retainedAccess = status === "canceled" && state.subscription?.current_period_end && new Date(state.subscription.current_period_end) > new Date();
    if (status === "trialing" || status === "active" || retainedAccess) { router.replace("/contractors/dashboard"); return; }
    setShowAccountChoice(true);
  };

  useEffect(() => {
    getContractorOnboardingState().then((result) => {
      if (result.state) applyState(result.state);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  const continueExisting = () => { setShowAccountChoice(false); setStep("trial"); };
  const signOutAndReset = async () => {
    setSubmitting(true);
    await createClient().auth.signOut();
    setForm(emptyForm); setSignedInEmail(""); setShowAccountChoice(false); setHomeownerError(false); setStep("info"); setError(""); setSubmitting(false);
    router.refresh();
  };

  const continueToTrial = async () => {
    setError("");
    if (!requiredValid && !signedInEmail) { setError("Please complete all required fields and accept the Terms before continuing."); return; }
    setSubmitting(true);
    if (signedInEmail) {
      const result = await updateContractorOnboardingInfo({ fullName: form.fullName, phone: form.phone, companyName: form.companyName, trade: form.trade, serviceArea: form.serviceArea });
      if (result.error) { setError(result.error); setSubmitting(false); return; }
    } else {
      const result = await signUpContractor({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone, companyName: form.companyName, trade: form.trade, serviceArea: form.serviceArea, termsAccepted: form.agreeToTerms, communicationsConsent: form.communicationsConsent });
      if (result.error) { setError(result.error === "already_registered" ? "An account with this email already exists. Sign in to continue." : result.error); setSubmitting(false); return; }
      if (!result.signedIn) { router.replace("/auth/sign-in?redirect=/contractors/signup"); return; }
      setSignedInEmail(form.email.trim().toLowerCase());
    }
    setStep("trial"); setSubmitting(false); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="ml-2 text-muted-foreground">Checking account status...</span></div>;
  if (homeownerError) return <div className="flex min-h-screen items-center justify-center bg-background px-4"><Card className="max-w-md"><CardContent className="p-8 text-center"><h1 className="text-2xl font-bold">Already Signed In</h1><p className="mt-2 text-muted-foreground">You&apos;re signed in as a homeowner. Sign out to create a contractor account.</p><Button className="mt-6" onClick={signOutAndReset} disabled={submitting}>Sign Out</Button></CardContent></Card></div>;
  if (showAccountChoice) return <div className="min-h-screen bg-background"><Header /><main className="px-4 py-16"><Card className="mx-auto max-w-lg"><CardContent className="p-8 text-center"><User className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-2xl font-bold">You&apos;re already signed in</h1><p className="mt-2 text-muted-foreground">Continue onboarding with <strong className="text-foreground">{signedInEmail}</strong>?</p><div className="mt-6 flex flex-col gap-3"><Button onClick={continueExisting}>Continue With This Account</Button><Button variant="outline" onClick={signOutAndReset} disabled={submitting}>Sign Out and Create a New Account</Button></div></CardContent></Card></main></div>;

  return <div className="min-h-screen bg-background"><Header /><main className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-xl">
    <div className="mb-8 text-center"><h1 className="text-balance text-3xl font-bold sm:text-4xl">Start Your Free Trial</h1><p className="mt-3 text-pretty text-muted-foreground">Create your account in under a minute. You can build your first bid right after.</p></div>
    <div className="mb-8 flex items-center justify-center gap-3">{([{ key: "info", label: "Your Info", icon: User }, { key: "trial", label: "Start Trial", icon: Zap }] as const).map((item, index) => { const active = step === item.key; const done = step === "trial" && item.key === "info"; return <div key={item.key} className="flex items-center gap-3"><div className="flex items-center gap-2"><div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${active || done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{done ? <CheckCircle2 className="h-5 w-5" /> : <item.icon className="h-4 w-4" />}</div><span className={`text-sm font-medium ${active || done ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span></div>{index === 0 && <div className="h-0.5 w-8 bg-border" />}</div>; })}</div>
    <Card><CardContent className="p-6 sm:p-8">
      {step === "info" ? <div className="space-y-5"><div><h2 className="text-xl font-semibold">Your Info</h2><p className="mt-1 text-sm text-muted-foreground">Just the essentials to create your account.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Full Name *" id="fullName" value={form.fullName} onChange={(v) => update("fullName", v)} autoComplete="name" wide /><Field label="Phone Number *" id="phone" value={form.phone} onChange={(v) => update("phone", v)} autoComplete="tel" type="tel" /><Field label="Company Name *" id="companyName" value={form.companyName} onChange={(v) => update("companyName", v)} autoComplete="organization" /><div><Label htmlFor="trade">Primary Trade *</Label><select id="trade" value={form.trade} onChange={(e) => update("trade", e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select your trade...</option>{trades.map((trade) => <option key={trade}>{trade}</option>)}</select></div><Field label="Service Area *" id="serviceArea" value={form.serviceArea} onChange={(v) => update("serviceArea", v)} /></div>
        {!signedInEmail && <div className="space-y-4 border-t border-border pt-5"><Field label="Email Address *" id="email" value={form.email} onChange={(v) => update("email", v)} type="email" autoComplete="email" /><div className="grid gap-4 sm:grid-cols-2"><PasswordField label="Password *" id="password" value={form.password} onChange={(v) => update("password", v)} visible={showPassword} toggle={() => setShowPassword(!showPassword)} /><PasswordField label="Confirm Password *" id="confirmPassword" value={form.confirmPassword} onChange={(v) => update("confirmPassword", v)} visible={showConfirm} toggle={() => setShowConfirm(!showConfirm)} /></div><label className="flex items-start gap-3"><Checkbox checked={form.agreeToTerms} onCheckedChange={(v) => update("agreeToTerms", Boolean(v))} className="mt-0.5" /><span className="text-sm text-muted-foreground">I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. *</span></label><label className="flex items-start gap-3"><Checkbox checked={form.communicationsConsent} onCheckedChange={(v) => update("communicationsConsent", Boolean(v))} className="mt-0.5" /><span className="text-sm text-muted-foreground">I agree to receive email and text messages from HomeBids about my account, free trial, and related services. Message and data rates may apply. Reply STOP to unsubscribe.</span></label></div>}
      </div> : <div className="space-y-6"><div><h2 className="text-xl font-semibold">Start Your Free Trial</h2><p className="mt-1 text-sm text-muted-foreground">Try HomeBids free for 3 days. Cancel anytime before it ends and you won&apos;t be charged.</p></div><div className="rounded-xl border border-primary/30 bg-primary/5 p-5"><div className="flex items-baseline justify-between"><p className="text-2xl font-bold">$99 / month</p><span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"><Clock className="h-3 w-3" />3-day free trial</span></div><ul className="mt-4 grid gap-2">{["Unlimited AI-generated bids", "Build professional proposals by text", "Shareable proposal link + PDF included", "No bid fees — ever"].map((text) => <li key={text} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{text}</li>)}</ul></div><div className="rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">Account Summary</h3><div className="mt-2 grid gap-1 text-sm">{[["Name", form.fullName], ["Company", form.companyName], ["Trade", form.trade], ["Service Area", form.serviceArea], ["Email", signedInEmail || form.email]].map(([label, value]) => <p key={label}><span className="text-muted-foreground">{label}:</span> {value}</p>)}</div></div></div>}
      {error && <div role="alert" className="mt-6 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">{step === "trial" ? <Button variant="outline" onClick={() => setStep("info")}><ArrowLeft className="mr-2 h-4 w-4" />Edit Information</Button> : <Button variant="outline" asChild><Link href="/contractors"><ArrowLeft className="mr-2 h-4 w-4" />Cancel</Link></Button>}{step === "info" ? <Button onClick={continueToTrial} disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : <>Continue to Free Trial<ArrowRight className="ml-2 h-4 w-4" /></>}</Button> : <Button onClick={() => router.push("/subscribe?type=contractor")}>Continue to Secure Checkout<ArrowRight className="ml-2 h-4 w-4" /></Button>}</div>
    </CardContent></Card>
    <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Shield className="h-4 w-4" />SSL Encrypted</span><span className="flex items-center gap-2"><Clock className="h-4 w-4" />Cancel Anytime</span><span className="flex items-center gap-2"><Wrench className="h-4 w-4" />Build Bids Instantly</span></div>
  </div></main><ScrollToTop /></div>;
}

function Field({ label, id, value, onChange, type = "text", autoComplete, wide = false }: { label: string; id: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; wide?: boolean }) { return <div className={wide ? "sm:col-span-2" : ""}><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(e) => onChange(e.target.value)} type={type} autoComplete={autoComplete} className="mt-1.5" /></div>; }
function PasswordField({ label, id, value, onChange, visible, toggle }: { label: string; id: string; value: string; onChange: (value: string) => void; visible: boolean; toggle: () => void }) { return <div><Label htmlFor={id}>{label}</Label><div className="relative mt-1.5"><Input id={id} value={value} onChange={(e) => onChange(e.target.value)} type={visible ? "text" : "password"} autoComplete="new-password" className="pr-10" /><button type="button" onClick={toggle} className="absolute inset-y-0 right-0 px-3 text-muted-foreground" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>; }
