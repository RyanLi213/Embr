"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WELCOMED_COOKIE } from "@/lib/welcome";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Runs on the server when "Check in now" is pressed: remembers that this
 * browser has been welcomed, then opens the check-in.
 */
export async function startCheckIn() {
  const cookieStore = await cookies();
  cookieStore.set(WELCOMED_COOKIE, "yes", {
    maxAge: ONE_YEAR_IN_SECONDS,
    path: "/",
    sameSite: "lax",
    httpOnly: true, // the page's scripts can't read it; only the server needs it
    secure: process.env.NODE_ENV === "production", // HTTPS only once deployed
  });
  redirect("/check-in");
}
