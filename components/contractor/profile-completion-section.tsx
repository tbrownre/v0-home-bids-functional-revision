"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  PROFILE_SECTIONS,
  loadContractorProfile,
  saveContractorProfile,
  isFieldComplete,
  getProfileCompletion,
  emptyProfile,
  type ContractorOptionalProfile,
  type ContractorProfileField,
} from "@/lib/contractor-profile";

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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadContractorProfile());
    setLoaded(true);
  }, []);

  const setField = (key: ContractorProfileField, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveContractorProfile(profile);
    setSaved(true);
  };

  const completion = getProfileCompletion(profile);

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
        <Button onClick={handleSave}>Save Profile Details</Button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
