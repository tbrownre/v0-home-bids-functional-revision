// ── Contractor optional profile ────────────────────────────────────────────────
// Fields removed from the low-friction signup flow live here. They are entirely
// OPTIONAL — a contractor can build bids without completing any of them. This
// module tracks their values and completion state so the Account area and the
// dashboard can surface a gentle "finish your profile" nudge.
//
// IMPORTANT: no portfolio, project, gallery, or before/after photo fields are
// tracked here — those are intentionally excluded from the completion flow.

export type ContractorProfileField =
  | "businessName"
  | "logoUrl"
  | "companyDescription"
  | "website"
  | "businessAddress"
  | "licenseNumber"
  | "insuranceDetails"
  | "yearsInBusiness"
  | "googleReviewLink"
  | "servicesOffered"
  | "socialLinks";

export interface ContractorOptionalProfile {
  businessName: string;
  logoUrl: string;
  companyDescription: string;
  website: string;
  businessAddress: string;
  licenseNumber: string;
  insuranceDetails: string;
  yearsInBusiness: string;
  googleReviewLink: string;
  servicesOffered: string;
  socialLinks: string;
}

export interface ProfileFieldDef {
  key: ContractorProfileField;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

export interface ProfileSectionDef {
  id: string;
  title: string;
  fields: ProfileFieldDef[];
}

// Grouped sections shown on the Account "Complete Your Profile" area.
export const PROFILE_SECTIONS: ProfileSectionDef[] = [
  {
    id: "basics",
    title: "Business Basics",
    fields: [
      { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing" },
      { key: "logoUrl", label: "Company Logo URL", placeholder: "https://.../logo.png" },
      {
        key: "companyDescription",
        label: "Company Description",
        placeholder: "Tell customers what makes your business great…",
        multiline: true,
      },
      { key: "website", label: "Website", placeholder: "https://yourcompany.com" },
      { key: "businessAddress", label: "Business Address", placeholder: "123 Main St, Austin, TX" },
    ],
  },
  {
    id: "trust",
    title: "Trust Details",
    fields: [
      { key: "licenseNumber", label: "License Number", placeholder: "ABC-123456" },
      { key: "insuranceDetails", label: "Insurance Details", placeholder: "Provider & policy number" },
      { key: "yearsInBusiness", label: "Years in Business", placeholder: "e.g. 8" },
      { key: "googleReviewLink", label: "Google Review Link", placeholder: "https://g.page/…" },
    ],
  },
  {
    id: "services",
    title: "Services",
    fields: [
      {
        key: "servicesOffered",
        label: "Services Offered",
        placeholder: "Kitchen remodels, tile, drywall…",
        multiline: true,
      },
      { key: "socialLinks", label: "Social Links", placeholder: "Instagram, Facebook, etc." },
    ],
  },
];

export const ALL_PROFILE_FIELDS: ContractorProfileField[] = PROFILE_SECTIONS.flatMap((s) =>
  s.fields.map((f) => f.key),
);

export function emptyProfile(): ContractorOptionalProfile {
  return {
    businessName: "",
    logoUrl: "",
    companyDescription: "",
    website: "",
    businessAddress: "",
    licenseNumber: "",
    insuranceDetails: "",
    yearsInBusiness: "",
    googleReviewLink: "",
    servicesOffered: "",
    socialLinks: "",
  };
}

const LS_KEY = "hb_contractor_profile";

export function loadContractorProfile(): ContractorOptionalProfile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...emptyProfile(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return emptyProfile();
}

export function saveContractorProfile(profile: ContractorOptionalProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function isFieldComplete(profile: ContractorOptionalProfile, key: ContractorProfileField): boolean {
  return (profile[key] ?? "").trim() !== "";
}

export interface ProfileCompletion {
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
}

export function getProfileCompletion(profile: ContractorOptionalProfile): ProfileCompletion {
  const total = ALL_PROFILE_FIELDS.length;
  const completed = ALL_PROFILE_FIELDS.filter((k) => isFieldComplete(profile, k)).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
  return { completed, total, percent, isComplete: completed === total };
}
