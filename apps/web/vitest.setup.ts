// Adds readable checks such as expect(element).toBeInTheDocument()
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

import { resetFakeClerk } from "./src/test/clerk";
import { server } from "./src/test/server";

// Every test uses the fake Clerk instead of the real one, starting signed out
vi.mock("@clerk/nextjs", async () => (await import("./src/test/clerk")).fakeClerkModule);

beforeEach(() => {
  resetFakeClerk();
});

// Start the fake network. Any request without a fake answer fails the test,
// so a test can never accidentally call a real server.
beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  cleanup(); // remove whatever the test rendered
  server.resetHandlers(); // undo any per-test fake answers
});

afterAll(() => {
  server.close();
});
