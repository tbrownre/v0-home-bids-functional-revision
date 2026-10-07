/**
 * JOBSUMMARY (Tim, Oct 7 - Trello "Replace Raw 'What They Told Us' Feed With Clean AI Job Summary").
 * Pure helpers shared by the leads data layer and its tests: what a contractor may see of a raw homeowner
 * message. Internal AI context, hidden blocks, setup/referral lines and Bid Builder commands never pass.
 */

/** One raw homeowner message → what a contractor may see of it (null = drop the line). */
export function cleanIntakeLine(raw: unknown): string | null {
  let c = String(raw ?? "");
  // internal AI context Guard prepends for the model - never for humans (also mid-text, also unterminated)
  c = c.replace(/\[AVA CONTEXT[\s\S]*?\]/gi, "").replace(/\[AVA CONTEXT[\s\S]*$/i, "");
  // other hidden blocks / tags that could ride along in a saved row
  c = c.replace(/<JOB>[\s\S]*?<\/JOB>/gi, "").replace(/<\/?JOB>/gi, "");
  c = c.replace(/\s+/g, " ").trim();
  if (!c) return null;
  if (/^\[photo:/i.test(c)) return null;
  // setup / referral text from the /pro page button or a share link ("Hi Demo Co! I need help … (Ref: demo-co-5dc4)", "bid JB-94C1")
  if (/\(\s*ref\s*:\s*[^)]+\)/i.test(c)) return null;
  if (/^(hi|hello|hey)\b[^.!?]{0,60}\bi need help\b/i.test(c) && /\bref\b/i.test(c)) return null;
  if (/^bid\s+JB-[A-Z0-9]+$/i.test(c)) return null;
  if (/^JB-[A-Z0-9]{3,}$/i.test(c)) return null;
  return c.length > 400 ? c.slice(0, 400) + "…" : c;
}
