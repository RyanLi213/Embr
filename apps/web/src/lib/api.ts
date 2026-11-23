import { createApiClient } from "@embr/api-client";

/** Where the API lives, set NEXT_PUBLIC_API_URL in production; defaults to your laptop*/
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** The one shared client the whole web app uses to talk to the API */
export const api = createApiClient(API_URL);

/**
 * Whether this page can reach the API: always when running on your laptop,
 * and online once NEXT_PUBLIC_API_URL points at the online API. (Until then,
 * the live site must not call "localhost": that's the visitor's own computer,
 * and browsers ask them for permission.)
 */
export function canReachApi(hostname = window.location.hostname): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_URL) || hostname === "localhost";
}
