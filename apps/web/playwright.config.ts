import { defineConfig, devices } from "@playwright/test";

const WEB_URL = "http://localhost:3000";
const API_URL = "http://localhost:8000";

/**
 * End-to-end tests: a real browser loads the real web app, which calls the
 * real API, which talks to the real database. The database must already be
 * running (`pnpm db:up`); Playwright starts the API and the web app itself.
 */
export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // In CI, also write an HTML report; ci.yml saves it when a test fails
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "uv run uvicorn embr_api.main:app --port 8000",
      cwd: "../api",
      url: `${API_URL}/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // CI tests a production build, so every page is built before the tests
      // start; locally the dev server builds each page on its first visit
      command: process.env.CI ? "pnpm build && pnpm start" : "pnpm dev",
      // Make crashes in the CI log point to our source files, not built ones
      env: process.env.CI ? { NODE_OPTIONS: "--enable-source-maps" } : undefined,
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
