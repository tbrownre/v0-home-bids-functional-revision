// SMS configuration — placeholder number until Twilio is wired up
export const SMS_PHONE_NUMBER = "+18135551234";
export const SMS_PHONE_DISPLAY = "(813) 555-1234";
export const SMS_BODY_PREFIX = "Hey HomeBids, I need help with ";

export function getSmsLink(body?: string): string {
  const encodedBody = encodeURIComponent(body || SMS_BODY_PREFIX);
  return `sms:${SMS_PHONE_NUMBER}?&body=${encodedBody}`;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
