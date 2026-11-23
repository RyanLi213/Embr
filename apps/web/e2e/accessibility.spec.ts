import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Every page, with the main heading to wait for before checking it
const PAGES: { path: string; heading: string | RegExp }[] = [
  { path: "/welcome", heading: "Meet each day with a little more ease." },
  { path: "/", heading: /^Good (morning|afternoon|evening), friend\.$/ },
  { path: "/check-in", heading: "How is your pain today?" },
  { path: "/calendar", heading: "Calendar" },
  { path: "/community", heading: "You shouldn’t have to do this alone." },
  { path: "/profile", heading: "Take Embr with you." },
  { path: "/sign-in", heading: "Accounts are on their way." },
];

// The layout changes between computers and phones, so check both
const SCREENS = [
  { name: "computer", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

test.beforeEach(async ({ context, page, baseURL }) => {
  // Skip the welcome page, so "/" shows the home screen
  await context.addCookies([{ name: "embr-welcomed", value: "yes", url: baseURL! }]);
  // Finish fades instantly, so colours are measured at their final look
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const screen of SCREENS) {
  for (const { path, heading } of PAGES) {
    test(`${path} meets accessibility rules on a ${screen.name}`, async ({ page }) => {
      await page.setViewportSize(screen);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();

      // axe checks the page against the WCAG 2.1 AA accessibility rules:
      // contrast, labels, headings, keyboard access and more
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("nextjs-portal") // Next.js's own developer tools, only shown in development
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
