"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, Loader2, Upload } from "lucide-react";
import {
  PROFILE_SECTIONS,
  emptyProfile,
  type ContractorOptionalProfile,
  type ContractorProfileField,
} from "@/lib/contractor-profile";

function isFieldComplete(profile: ContractorOptionalProfile, key: ContractorProfileField): boolean {
  return (profile[key] ?? "").trim() !== "";
}

/** Small yellow "Needs attention" pill, or a subtle "Completed" marker. */
function FieldBadge({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
      <AlertCircle className="h-3 w-3" />
      Needs attention
    </span>
  );
}

export function ProfileCompletionSection() {
  const [profile, setProfile] = useState<ContractorOptionalProfile>(emptyProfile());
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { getContractorProfile } = await import("@/lib/supabase/actions");
        const { profile: dbProfile } = await getContractorProfile();
        if (dbProfile) {
          setProfile({
            businessName: dbProfile.business_name || "",
            logoUrl: dbProfile.logo_url || "",
            companyDescription: dbProfile.bio || "",
            website: dbProfile.website || "",
            businessAddress: dbProfile.business_address || "",
            licenseNumber: dbProfile.license_number || "",
            insuranceDetails: dbProfile.insurance_details || "",
            yearsInBusiness: dbProfile.years_experience?.toString() || "",
            googleReviewLink: dbProfile.google_review_link || "",
            servicesOffered: (dbProfile.specialties || []).join(", ") || "",
            socialLinks: JSON.stringify(dbProfile.social_links || {}),
          });
        }
      } catch (e) {
        console.error("[ProfileCompletionSection] Failed to load profile:", e);
      } finally {
        setLoaded(true);
      }
    }
    loadProfile();
  }, []);

  const setField = (key: ContractorProfileField, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image must be smaller than 5MB");
      return;
    }

    setLogoUploading(true);
    setSaveError(null);
    try {
      const { uploadContractorLogo } = await import("@/lib/supabase/actions");
      const { url, error } = await uploadContractorLogo(file);
      if (error) {
        setSaveError(error);
      } else if (url) {
        setField("logoUrl", url);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      setSaveError((e as Error).message || "Failed to upload logo");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const { updateContractorProfile } = await import("@/lib/supabase/actions");
      const { error } = await updateContractorProfile({
        business_name: profile.businessName || null,
        logo_url: profile.logoUrl || null,
        bio: profile.companyDescription || null,
        website: profile.website || null,
        business_address: profile.businessAddress || null,
        license_number: profile.licenseNumber || null,
        insurance_details: profile.insuranceDetails || null,
        years_experience: profile.yearsInBusiness ? parseInt(profile.yearsInBusiness) : null,
        google_review_link: profile.googleReviewLink || null,
        specialties: profile.servicesOffered ? profile.servicesOffered.split(",").map((s) => s.trim()).filter(Boolean) : [],
        social_links: profile.socialLinks ? JSON.parse(profile.socialLinks) : {},
      });
      if (error) {
        setSaveError(error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      setSaveError((e as Error).message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Compute completion from current profile values
  const ALL_FIELDS = Object.keys(emptyProfile()) as ContractorProfileField[];
  const completed = ALL_FIELDS.filter((k) => (profile[k] ?? "").trim() !== "").length;
  const total = ALL_FIELDS.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
  const completion = { completed, total, percent, isComplete: completed === total };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      {/* Header + progress */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Complete Your Profile</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Add these details when you&apos;re ready. Your account is already active.
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-foreground">
          {completion.completed} of {completion.total} complete
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${completion.percent}%` }}
        />
      </div>

      {/* Grouped sections */}
      <div className="mt-6 space-y-6">
        {PROFILE_SECTIONS.map((section) => (
          <div key={section.id}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => {
                const complete = loaded && isFieldComplete(profile, field.key);
                // Special handling for logo upload
                if (field.key === "logoUrl") {
                  return (
                    <div key={field.key}>
                      <div className="flex items-center justify-between gap-2">
                        <Label>Company Logo</Label>
                        <FieldBadge complete={complete} />
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={logoUploading}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={logoUploading}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          {logoUploading ? "Uploading…" : "Upload Logo"}
                        </Button>
                        {profile.logoUrl && (
                          <img
                            src={profile.logoUrl}
                            alt="Logo preview"
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}
                      </div>
                      {profile.logoUrl && (
                        <p className="mt-1.5 text-xs text-muted-foreground truncate">
                          {profile.logoUrl}
                        </p>
                      )}
                    </div>
                  );
                }
                return (
                  <div
                    key={field.key}
                    className={field.multiline ? "sm:col-span-2" : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`cp-${field.key}`}>{field.label}</Label>
                      <FieldBadge complete={complete} />
                    </div>
                    {field.multiline ? (
                      <Textarea
                        id={`cp-${field.key}`}
                        value={profile[field.key]}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="mt-1.5 min-h-[80px]"
                      />
                    ) : (
                      <Input
                        id={`cp-${field.key}`}
                        value={profile[field.key]}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="mt-1.5"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile Details"
          )}
        </Button>
        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
        {saveError && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4" />
            Error: {saveError}
          </span>
        )}
      </div>
    </div>
  );
}
