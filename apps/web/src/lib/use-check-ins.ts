import { useSyncExternalStore } from "react";

import {
  type CheckIns,
  loadCheckIns,
  STORAGE_KEY,
  subscribeToCheckIns,
} from "./store-load-check-in";

// React asks for the check-ins on every render, and needs the very same object
// back while nothing has changed. So remember the last saved text and its result.
let lastSaved: string | null | undefined;
let lastCheckIns: CheckIns = {};

function getSnapshot(): CheckIns {
  let saved: string | null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    saved = null;
  }
  if (saved !== lastSaved) {
    lastSaved = saved;
    lastCheckIns = loadCheckIns();
  }
  return lastCheckIns;
}

function getServerSnapshot(): null {
  // The server can't see this browser's storage
  return null;
}

/**
 * Every check-in saved in this browser, by day. `null` until the page is
 * running in the browser, so screens can wait instead of flashing wrong content.
 */
export function useCheckIns(): CheckIns | null {
  return useSyncExternalStore<CheckIns | null>(
    subscribeToCheckIns,
    getSnapshot,
    getServerSnapshot,
  );
}
