import { clerkSetup } from "@clerk/testing/playwright";

/**
 * Runs once before all end-to-end tests. Gets a testing token from Clerk, so
 * tests can sign in without Clerk's bot protection stopping them. Reads the
 * Clerk keys from .env.local on your laptop, or from the GitHub secrets in CI.
 */
export default async function globalSetup() {
  await clerkSetup();
}
