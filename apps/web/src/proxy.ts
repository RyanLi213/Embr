import { NextResponse, type NextRequest } from "next/server";

import { WELCOMED_COOKIE } from "@/lib/welcome";

/**
 * Runs on the server before the home page is sent. A first-time visitor has
 * not seen the welcome page yet, so they go there; everyone else gets the
 * home screen. (Later, Clerk's sign-in check will live in this file too.)
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has(WELCOMED_COOKIE)) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
  return NextResponse.next();
}

// Only the home page needs this check
export const config = {
  matcher: "/",
};
