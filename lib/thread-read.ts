"use client";

/**
 * Per-device read stamps for contractor message threads (Tim, Oct 6: opening a conversation
 * must clear its unread state and decrease the Messages badge — the needs-reply dot alone
 * kept counting until the contractor answered).
 *
 * A thread is UNREAD when the homeowner sent the last message AND this device has not opened
 * the thread since that message arrived. Stored in localStorage; the `hb_seen_threads` key
 * participates in the `hb_seen_*` storage events the badge hook already listens to.
 */

const KEY = "hb_seen_threads";

type SeenMap = Record<string, number>;

export function getThreadSeenMap(): SeenMap {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SeenMap) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function markThreadSeen(cToken: string | null | undefined): void {
  if (!cToken) return;
  try {
    const map = getThreadSeenMap();
    map[cToken] = Date.now();
    // keep the map small — newest 200 threads
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 200);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* private mode — unread styling just persists */
  }
}

export function isThreadUnread(
  t: { c_token?: string | null; last_sender?: string | null; last_at?: string | null },
  seen: SeenMap,
): boolean {
  if ((t.last_sender ?? "") !== "homeowner") return false;
  const at = t.last_at ? new Date(t.last_at).getTime() : 0;
  if (!Number.isFinite(at) || at <= 0) return true;
  const stamp = t.c_token ? seen[t.c_token] ?? 0 : 0;
  return at > stamp;
}
