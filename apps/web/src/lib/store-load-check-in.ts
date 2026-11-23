import { type CheckIn, checkInSchema } from "./check-in";

/** Where a guest's check-ins live in this browser */
export const STORAGE_KEY = "embr-check-ins";

/** Check-ins by day (YYYY-MM-DD), so each day has at most one */
export type CheckIns = Record<string, CheckIn>;

/** Everything that wants to hear when check-ins change (see subscribeToCheckIns) */
const listeners = new Set<() => void>();

/**
 * Every check-in saved in this browser. Anything damaged is skipped, and a
 * browser that blocks storage simply has none, so the app never crashes here.
 */
export function loadCheckIns(): CheckIns {
  let saved: unknown;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
  if (typeof saved !== "object" || saved === null) return {};

  const checkIns: CheckIns = {};
  for (const entry of Object.values(saved)) {
    const result = checkInSchema.safeParse(entry);
    if (result.success) checkIns[result.data.date] = result.data;
  }
  return checkIns;
}

/**
 * Saves a check-in, replacing any earlier one for the same day. Throws if the
 * check-in breaks the rules or the browser will not save it, so the screen
 * can tell the person instead of losing their answers silently.
 */
export function saveCheckIn(checkIn: CheckIn): void {
  const valid = checkInSchema.parse(checkIn);
  const checkIns = { ...loadCheckIns(), [valid.date]: valid };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
  listeners.forEach((onChange) => onChange());
}

/**
 * Calls `onChange` whenever check-ins change: after a save on this page, or
 * in another tab of the same browser. Returns a function that stops it.
 */
export function subscribeToCheckIns(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    // key is null when another tab clears all of this site's storage
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  listeners.add(onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}
