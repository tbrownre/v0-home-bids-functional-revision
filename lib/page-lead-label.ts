/**
 * Lead row label (Tim, Oct 5): "Tim's Landscaping Project" / "Tim's Plumbing Project" —
 * the homeowner's first name + the service type. Location already has its own column.
 *
 * Categories are Ava's fixed list (Build Request "Allowed Categories"); anything new falls
 * back to the category with "contractor/service/supplier" stripped and title-cased.
 */

const SERVICE_BY_CATEGORY: Record<string, string> = {
  "plumber": "Plumbing",
  "electrician": "Electrical",
  "hvac contractor": "HVAC",
  "roofing contractor": "Roofing",
  "garage door supplier": "Garage Door",
  "landscaper": "Landscaping",
  "lawn care service": "Lawn Care",
  "painter": "Painting",
  "general contractor": "Home Improvement",
  "handyman": "Handyman",
  "pest control service": "Pest Control",
  "appliance repair service": "Appliance Repair",
  "flooring contractor": "Flooring",
  "fence contractor": "Fence",
  "tree service": "Tree Service",
  "house cleaning service": "House Cleaning",
  "window installation service": "Window Installation",
  "locksmith": "Locksmith",
  "concrete contractor": "Concrete",
  "gutter cleaning service": "Gutter Cleaning",
  "water damage restoration service": "Water Damage Restoration",
  "pool cleaning service": "Pool Cleaning",
};

const titleCase = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.toUpperCase() === w && w.length <= 4 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");

/** "Plumber" → "Plumbing", "Roofing contractor" → "Roofing", unknown "Solar installer" → "Solar Installer". */
export function serviceLabel(category: string | null | undefined): string {
  const raw = String(category ?? "").trim();
  if (!raw) return "Home Service";
  const hit = SERVICE_BY_CATEGORY[raw.toLowerCase()];
  if (hit) return hit;
  return titleCase(raw.replace(/\s+(contractor|service|services|supplier|company)$/i, ""));
}

/** First name as the homeowner gave it ("Janet Lopez" → "Janet"). Empty when unknown. */
export function firstNameOf(fullName: string | null | undefined): string {
  const first = String(fullName ?? "").trim().split(/\s+/)[0] || "";
  if (!first || /^(homeowner|unknown|n\/a|null)$/i.test(first)) return "";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** "Tim's Landscaping Project" — or "New Landscaping Project" until the homeowner's name is known. */
export function leadLabel(opts: { homeownerName?: string | null; category?: string | null }): string {
  const first = firstNameOf(opts.homeownerName);
  const service = serviceLabel(opts.category);
  if (!first) return `New ${service} Project`;
  const possessive = /s$/i.test(first) ? `${first}'` : `${first}'s`;
  return `${possessive} ${service} Project`;
}
