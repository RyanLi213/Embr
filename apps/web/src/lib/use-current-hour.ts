import { useSyncExternalStore } from "react";

const ONE_MINUTE = 60 * 1000;

// Look at the clock once a minute, so the greeting changes soon after the
// hour turns (morning to afternoon) without reloading the page
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, ONE_MINUTE);
  return () => clearInterval(timer);
}

// The start of the current hour in the visitor's local time. It changes only
// once an hour, so React re-renders only when the greeting or day can change.
function getSnapshot() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return now.getTime();
}

// The server prepares the page without knowing the visitor's time zone
function getServerSnapshot() {
  return null;
}

/**
 * The start of the current hour as a timestamp, or `null` while the page is
 * being prepared on the server.
 */
export function useCurrentHour(): number | null {
  return useSyncExternalStore<number | null>(subscribe, getSnapshot, getServerSnapshot);
}
