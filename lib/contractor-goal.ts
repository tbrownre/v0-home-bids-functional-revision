// Monthly bid goal — a lightweight per-device UI preference (no table).
// Defaults to 30, matching the onboarding target shown in the dashboard.
const GOAL_KEY = "homebids_monthly_bid_goal";
export const DEFAULT_MONTH_GOAL = 30;

export function getMonthGoal(): number {
  if (typeof window === "undefined") return DEFAULT_MONTH_GOAL;
  const raw = window.localStorage.getItem(GOAL_KEY);
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MONTH_GOAL;
}

export function setMonthGoal(goal: number): number {
  const clamped = Math.max(1, Math.min(200, Math.round(goal)));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(GOAL_KEY, String(clamped));
    // Let other mounted components (topbar, cards) react to the change.
    window.dispatchEvent(new CustomEvent("hb:goal-changed", { detail: clamped }));
  }
  return clamped;
}
