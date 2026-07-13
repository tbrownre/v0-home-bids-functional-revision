// ── Homeowner SMS number ──────────────────────────────────────────────────────
export const SMS_PHONE_NUMBER = "+14043952879";
export const SMS_PHONE_DISPLAY = "(404) 395-2879";
export const SMS_BODY_PREFIX = "Hi HomeBids! I need help with";

/** Canonical homeowner starter message used by the desktop text modal and /text route. */
export const HOMEOWNER_STARTER_MESSAGE = "Hi HomeBids, I need help with a home project!";

// ── Contractor SMS number ─────────────────────────────────────────────────────
export const CONTRACTOR_SMS_PHONE_NUMBER = "+12832291348";
export const CONTRACTOR_SMS_PHONE_DISPLAY = "(283) 229-1348";
export const CONTRACTOR_SMS_BODY_PREFIX = "Let's create a new bid";

/**
 * Canonical SMS href constants — import these instead of hardcoding numbers.
 */
export const HOMEBIDS_SMS = {
  homeowner: {
    phone: SMS_PHONE_NUMBER,
    display: SMS_PHONE_DISPLAY,
    href: `sms:${SMS_PHONE_NUMBER}?&body=${encodeURIComponent(HOMEOWNER_STARTER_MESSAGE)}`,
  },
  contractor: {
    phone: CONTRACTOR_SMS_PHONE_NUMBER,
    display: CONTRACTOR_SMS_PHONE_DISPLAY,
    href: `sms:${CONTRACTOR_SMS_PHONE_NUMBER}?&body=${encodeURIComponent("Let's create a new bid")}`,
  },
} as const;

export function getSmsLink(body?: string): string {
  const encodedBody = encodeURIComponent(body || SMS_BODY_PREFIX);
  return `sms:${SMS_PHONE_NUMBER}?&body=${encodedBody}`;
}

export function getContractorSmsLink(body?: string): string {
  const encodedBody = encodeURIComponent(body || CONTRACTOR_SMS_BODY_PREFIX);
  return `sms:${CONTRACTOR_SMS_PHONE_NUMBER}?&body=${encodedBody}`;
}

/**
 * Generic SMS href builder for any phone number and optional body.
 * Normalizes phone to E.164 format to match n8n workflow normalization.
 * Handles formatted numbers like "(480) 555-0192" → "+14805550192".
 * Uses the project's standard "?&" convention for cross-platform reliability.
 * Returns empty string if phone cannot be normalized.
 */
export function getSmsHref(phone: string, body?: string): string {
  const digits = String(phone).replace(/\D/g, "");
  const normalized = digits ? "+" + (digits.length === 10 ? "1" + digits : digits) : "";
  
  if (!normalized) {
    return "";
  }
  
  if (!body) {
    return `sms:${normalized}`;
  }
  
  const encodedBody = encodeURIComponent(body);
  return `sms:${normalized}?&body=${encodedBody}`;
}

/**
 * Returns true for any device that has a native SMS/iMessage handler:
 * - iPhone, iPod, Android — UA string match
 * - iPad running iPadOS 13+ which fakes a Mac Safari UA — detected via
 *   navigator.maxTouchPoints > 1 on a "Mac" platform
 * - Classic iPad — UA string match
 */
export function isSmsCapableDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Standard mobile UA
  if (/iPhone|iPod|Android/i.test(ua)) return true;
  // Classic iPad UA (pre-iPadOS 13)
  if (/iPad/i.test(ua)) return true;
  // iPadOS 13+ reports as "MacIntel" but has touch points
  if (/Mac/i.test(ua) && navigator.maxTouchPoints > 1) return true;
  // macOS — Messages app can handle sms: on most Macs
  if (/Mac/i.test(ua)) return true;
  return false;
}

/** @deprecated use isSmsCapableDevice */
export function isMobileDevice(): boolean {
  return isSmsCapableDevice();
}
