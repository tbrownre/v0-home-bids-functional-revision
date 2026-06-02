// SMS configuration — placeholder number until Twilio is wired up
export const SMS_PHONE_NUMBER = "+18135551234";
export const SMS_PHONE_DISPLAY = "(813) 555-1234";
export const SMS_BODY_PREFIX = "Hey HomeBids, I need help with ";

export function getSmsLink(body?: string): string {
  const encodedBody = encodeURIComponent(body || SMS_BODY_PREFIX);
  return `sms:${SMS_PHONE_NUMBER}?&body=${encodedBody}`;
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
