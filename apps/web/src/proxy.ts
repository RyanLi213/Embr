import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { WELCOMED_COOKIE } from "@/lib/welcome";

/**
 * A first-time visitor opening the home page hasn't seen the welcome page yet,
 * so they go there first. Returns nothing when the page can carry on as normal.
 */
export function welcomeRedirect(request: NextRequest): NextResponse | undefined {
  if (request.nextUrl.pathname === "/" && !request.cookies.has(WELCOMED_COOKIE)) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
  return undefined;
}

/**
 * Runs on the server before each page is sent. Clerk reads who is signed in
 * (no page requires it: guests can use everything), then the welcome check.
 */
export default clerkMiddleware((_auth, request) => welcomeRedirect(request));

export const config = {
  matcher: [
    // Every page, but not Next.js internals or files such as images and fonts
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always for API routes
    "/(api|trpc)(.*)",
  ],
};
