"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { api, canReachApi } from "@/lib/api";

/**
 * Once per sign-in session, tells our API who is signed in (GET /v1/me), so
 * they're saved in our own `users` table and their last visit is kept up to
 * date. Shows nothing. If the API can't be reached, the app works as before.
 */
export function SaveAccount() {
  const { isSignedIn, sessionId, getToken } = useAuth();
  // The session we've already saved, so moving between pages doesn't repeat it
  const savedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !sessionId || savedFor.current === sessionId || !canReachApi()) return;
    savedFor.current = sessionId;

    void (async () => {
      try {
        // Clerk's short-lived token proves to the API who this is
        const token = await getToken();
        if (token) await api.GET("/v1/me", { headers: { Authorization: `Bearer ${token}` } });
      } catch {
        // Not saved this time (for example, the API is off); the next visit tries again
      }
    })();
  }, [isSignedIn, sessionId, getToken]);

  return null;
}
