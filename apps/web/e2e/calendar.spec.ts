import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

/** Fails the test if the page breaks any WCAG 2.1 AA accessibility rule */
async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(results.violations).toEqual([]);
}

// Made-up check-ins saved in the browser before the page opens
const day = (date: string, answers: Record<string, unknown> = {}) => ({
  date,
  pain: 2,
  stiffness: 2,
  energy: 4,
  mood: 4,
  overall: 4,
  flare: false,
  note: "",
  ...answers,
});
const CHECK_INS = {
  "2026-11-09": day("2026-11-09", { flare: true }),
  "2026-11-20": day("2026-11-20", {
    pain: 4,
    stiffness: 3,
    energy: 2,
    mood: 2,
    overall: 2,
    note: "Felt better after a warm shower",
  }),
  "2026-11-21": day("2026-11-21"),
};

test.beforeEach(async ({ context, page, baseURL }) => {
  await context.addCookies([{ name: "embr-welcomed", value: "yes", url: baseURL! }]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Freeze the browser's clock at 7 pm on Sunday, November 22, 2026
  await page.clock.setFixedTime(new Date(2026, 10, 22, 19));
  await page.addInitScript((saved) => {
    localStorage.setItem("embr-check-ins", saved);
  }, JSON.stringify(CHECK_INS));
});

test("a guest looks back over their days", async ({ page }) => {
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { level: 1, name: "Calendar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "November 2026" })).toBeVisible();

  // Today isn't checked in yet, and the earlier days have their colours
  await expect(page.getByRole("heading", { name: "No check-in yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Monday, November 9: flare day" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Saturday, November 21: good day" })).toBeVisible();
  await expectAccessible(page);

  // Tapping a day shows its answers and note
  await page.getByRole("button", { name: "Friday, November 20: hard day" }).click();
  await expect(page.getByRole("heading", { name: "A harder day" })).toBeVisible();
  await expect(page.getByText("“Felt better after a warm shower”")).toBeVisible();
  await expectAccessible(page);

  // Back a month, and forward again
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(page.getByRole("heading", { name: "October 2026" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pick a day" })).toBeVisible();
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(page.getByRole("button", { name: "Next month" })).toBeDisabled();

  // Today's empty day leads to the check-in
  await page.getByRole("button", { name: /^Sunday, November 22: today/ }).click();
  await page.getByRole("link", { name: "Check in now" }).click();
  await expect(page).toHaveURL(/\/check-in$/);
});

test("on a phone, tapping a day brings its details into view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/calendar");

  const details = page.getByRole("heading", { name: "A harder day" });
  await page.getByRole("button", { name: "Friday, November 20: hard day" }).click();
  await expect(details).toBeInViewport();
});
