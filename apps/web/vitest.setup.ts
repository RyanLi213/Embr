// Adds readable checks such as expect(element).toBeInTheDocument()
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./src/test/server";

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
