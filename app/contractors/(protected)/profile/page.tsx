"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Phone, Upload, LogOut, Check } from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getMockUser, mockSignOut, syncMirrorFromSupabase } from "@/lib/mock-auth";
import {
  profileCompletion,
  isProfileFieldFilled,
  type ContractorProfile,
} from "@/lib/use-contractor-signals";

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";

interface FormState {
  business_name: string;
  logo_url: string;
  bio: string;
  website: string;
  business_address: string;
  license_number: string;
  insurance_details: string;
  years_experience: string;
  google_review_link: string;
  specialties: string; // comma/newline separated
  social_links: string; // comma separated URLs
}

const EMPTY_FORM: FormState = {
  business_name: "",
  logo_url: "",
  bio: "",
  website: "",
  business_address: "",
  license_number: "",
  insurance_details: "",
  years_experience: "",
  google_review_link: "",
  specialties: "",
  social_links: "",
};

const PLAN_FEATURES = [
  "Unlimited AI-generated bids",
  "No bid fees — ever",
  "HomeBids AI lead matching",
  "Direct homeowner contact after approval",
  "Bid Builder — shareable link + PDF included",
];

function CompletionPill({ done }: { done: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
        done ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {done ? "Completed" : "Needs attention"}
    </span>
  );
}

export default function ContractorProfilePage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [account, setAccount] = useState<{ name: string; email: string; phone: string }>({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [leadAlerts, setLeadAlerts] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (cancelled) return;
      if (!user) {
        window.location.replace("/auth/sign-in");
        return;
      }
      if (user.role !== "contractor" && user.role !== "admin") {
        window.location.replace("/");
        return;
      }
      setAccount({
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Contractor",
        email: user.email || "",
        phone: user.phone || "",
      });

      if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
        setLoading(false);
        return;
      }
      try {
        const { getContractorProfile } = await import("@/lib/supabase/actions");
        const { profile } = await getContractorProfile();
        if (!cancelled && profile) {
          const p = profile as ContractorProfile;
          setForm({
            business_name: p.business_name ?? "",
            logo_url: p.logo_url ?? "",
            bio: p.bio ?? "",
            website: p.website ?? "",
            business_address: p.business_address ?? "",
            license_number: p.license_number ?? "",
            insurance_details: p.insurance_details ?? "",
            years_experience: p.years_experience != null ? String(p.years_experience) : "",
            google_review_link: p.google_review_link ?? "",
            specialties: Array.isArray(p.specialties) ? p.specialties.join(", ") : "",
            social_links: p.social_links ? Object.values(p.social_links).join(", ") : "",
          });
        }
      } catch { /* non-fatal */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  // Live completion — derive a profile-shaped object from the current form.
  const liveProfile: ContractorProfile = useMemo(
    () => ({
      business_name: form.business_name,
      logo_url: form.logo_url,
      bio: form.bio,
      website: form.website,
      business_address: form.business_address,
      license_number: form.license_number,
      insurance_details: form.insurance_details,
      years_experience: form.years_experience ? Number(form.years_experience) : null,
      google_review_link: form.google_review_link,
      specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
      social_links: Object.fromEntries(
        form.social_links.split(",").map((s) => s.trim()).filter(Boolean).map((v, i) => [String(i), v]),
      ),
    }),
    [form],
  );
  const { completed, total, percent } = profileCompletion(liveProfile);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadContractorLogo } = await import("@/lib/supabase/actions");
      const { url } = await uploadContractorLogo(file);
      if (url) set("logo_url", url);
    } catch { /* non-fatal */ } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const { updateContractorProfile } = await import("@/lib/supabase/actions");
      await updateContractorProfile({
        business_name: form.business_name || null,
        logo_url: form.logo_url || null,
        bio: form.bio || null,
        website: form.website || null,
        business_address: form.business_address || null,
        license_number: form.license_number || null,
        insurance_details: form.insurance_details || null,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        google_review_link: form.google_review_link || null,
        specialties: liveProfile.specialties ?? [],
        social_links: liveProfile.social_links ?? {},
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("[Profile] save failed:", e);
    } finally {
      setSaving(false);
    }
  }

  const initial = (account.name.charAt(0) || "C").toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      <ContractorTopbar />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-6">
        <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-foreground">Account</h1>

        {/* Summary + Plan */}
        <div className="mb-5 grid gap-5 md:grid-cols-2">
          <section className={`${CARD} p-6`}>
            <p className="mb-4 text-sm font-bold text-foreground">Profile</p>
            <div className="flex items-start gap-4">
              {form.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logo_url || "/placeholder.svg"} alt="Business logo" className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-extrabold text-primary">
                  {initial}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-foreground">{account.name}</p>
                {form.business_name && <p className="truncate text-sm text-foreground">{form.business_name}</p>}
                <p className="text-sm text-muted-foreground">Contractor</p>
              </div>
            </div>
            <div className="mt-5 grid gap-2.5">
              {account.email && (
                <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" /> {account.email}
                </p>
              )}
              {account.phone && (
                <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" /> {account.phone}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[22px] border border-primary/30 bg-primary/5 p-6">
            <p className="mb-2.5 font-bold text-primary">Your Plan</p>
            <p className="mb-3 text-2xl font-extrabold tracking-tight text-foreground">$99 / month</p>
            <ul className="grid gap-2.5">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Notification toggles */}
        <section className={`${CARD} mb-5 p-6`}>
          <p className="mb-4 text-sm font-bold text-foreground">Notifications</p>
          <div className="grid gap-1">
            <label className="flex items-center justify-between gap-3 py-2">
              <span className="text-[15px] text-foreground">New lead alerts</span>
              <input type="checkbox" checked={leadAlerts} onChange={(e) => setLeadAlerts(e.target.checked)} className="h-[18px] w-[18px] accent-[var(--primary)]" />
            </label>
            <label className="flex items-center justify-between gap-3 border-t border-border py-2 pt-3">
              <span className="text-[15px] text-foreground">Homeowner approval alerts</span>
              <input type="checkbox" checked={approvalAlerts} onChange={(e) => setApprovalAlerts(e.target.checked)} className="h-[18px] w-[18px] accent-[var(--primary)]" />
            </label>
          </div>
        </section>

        {/* Profile details */}
        <section className={`${CARD} p-6 sm:p-7`}>
          <div className="mb-2.5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-extrabold text-foreground">Complete Your Profile</p>
              <p className="text-sm text-muted-foreground">Add these details when you&apos;re ready. Your account is already active.</p>
            </div>
            <p className="whitespace-nowrap text-sm font-extrabold text-foreground">
              {completed} of {total} complete
            </p>
          </div>
          <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading profile…</p>
          ) : (
            <>
              <SectionLabel>Business Basics</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business Name" done={isProfileFieldFilled(liveProfile, "business_name")}>
                  <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="ABC HVAC" />
                </Field>

                <Field label="Company Logo" done={isProfileFieldFilled(liveProfile, "logo_url")}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted text-xs font-bold text-muted-foreground">
                      {form.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.logo_url || "/placeholder.svg"} alt="Logo preview" className="h-full w-full object-cover" />
                      ) : (
                        "Logo"
                      )}
                    </span>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-lg font-semibold" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading…" : "Upload Logo"}
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                  </div>
                </Field>

                <Field label="Company Description" full done={isProfileFieldFilled(liveProfile, "bio")}>
                  <Textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="What makes your business the best choice?" />
                </Field>

                <Field label="Website" done={isProfileFieldFilled(liveProfile, "website")}>
                  <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="abchvac.com" />
                </Field>

                <Field label="Business Address" done={isProfileFieldFilled(liveProfile, "business_address")}>
                  <Input value={form.business_address} onChange={(e) => set("business_address", e.target.value)} placeholder="123 Main Street" />
                </Field>
              </div>

              <SectionLabel>Trust Details</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="License Number" done={isProfileFieldFilled(liveProfile, "license_number")}>
                  <Input value={form.license_number} onChange={(e) => set("license_number", e.target.value)} placeholder="ABS-123543" />
                </Field>
                <Field label="Insurance Details" done={isProfileFieldFilled(liveProfile, "insurance_details")}>
                  <Input value={form.insurance_details} onChange={(e) => set("insurance_details", e.target.value)} placeholder="State Farm" />
                </Field>
                <Field label="Years in Business" done={isProfileFieldFilled(liveProfile, "years_experience")}>
                  <Input type="number" min={0} value={form.years_experience} onChange={(e) => set("years_experience", e.target.value)} placeholder="25" />
                </Field>
                <Field label="Google Review Link" done={isProfileFieldFilled(liveProfile, "google_review_link")}>
                  <Input value={form.google_review_link} onChange={(e) => set("google_review_link", e.target.value)} placeholder="https://g.page/..." />
                </Field>
              </div>

              <SectionLabel>Services</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Services Offered" full done={isProfileFieldFilled(liveProfile, "specialties")}>
                  <Textarea value={form.specialties} onChange={(e) => set("specialties", e.target.value)} placeholder="HVAC, Plumbing, Electrical" />
                </Field>
                <Field label="Social Links" done={isProfileFieldFilled(liveProfile, "social_links")}>
                  <Input value={form.social_links} onChange={(e) => set("social_links", e.target.value)} placeholder="https://facebook.com/…, https://instagram.com/…" />
                </Field>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Button onClick={save} disabled={saving} className="gap-2 rounded-xl font-semibold">
                  {saved ? <><Check className="h-4 w-4" /> Saved</> : saving ? "Saving…" : "Save Profile Details"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => mockSignOut()}
                  className="gap-2 rounded-xl border-red-200 font-semibold text-red-600 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 mt-6 text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground first:mt-0">{children}</p>;
}

function Field({
  label,
  done,
  full,
  children,
}: {
  label: string;
  done: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 ${full ? "sm:col-span-2" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
        <CompletionPill done={done} />
      </div>
      {children}
    </div>
  );
}
