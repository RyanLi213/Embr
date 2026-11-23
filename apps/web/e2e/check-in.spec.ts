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

/**
 * Clicks an answer button by its words, and checks it is picked. (Next.js keeps
 * pages you left hidden in the background, so only look at what is visible.)
 */
async function pick(page: Page, answer: string) {
  await page.getByText(answer, { exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("radio", { name: answer })).toBeChecked();
}

test.beforeEach(async ({ context, page, baseURL }) => {
  await context.addCookies([{ name: "embr-welcomed", value: "yes", url: baseURL! }]);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("a guest checks in, sees it on home, and changes an answer", async ({ page }) => {
  await page.goto("/check-in");
  const heading = page.getByRole("heading", { level: 1 });
  const continueButton = page.getByRole("button", { name: "Continue" });

  // Nothing is picked at first, so Continue is off
  await expect(heading).toHaveText("How is your pain today?");
  await expect(continueButton).toBeDisabled();

  for (const answer of ["A whisper", "A little tight", "Burning bright", "Light", "A good day"]) {
    await pick(page, answer);
    await continueButton.click();
  }

  await expect(heading).toHaveText("Is today a flare day?");
  await expectAccessible(page);
  await pick(page, "No");
  await continueButton.click();

  await expect(heading).toHaveText("Anything else you want to remember?");
  await expectAccessible(page);
  await page.getByLabel("Anything else you want to remember?").fill("Took a gentle walk");
  await page.getByRole("button", { name: "Finish check-in" }).click();

  await expect(heading).toHaveText("You did something kind for yourself.");
  await expectAccessible(page);

  // Home now shows today as done, and colours today in the week
  await page.getByRole("link", { name: "Back to home" }).click();
  await expect(page.getByRole("heading", { name: "You showed up for yourself today." })).toBeVisible();
  await expect(
    page.getByText("Pain was a whisper and your mood felt light.").filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole("list", { name: "This week" })).toContainText("today, good day");

  // Opening the check-in again shows today's answers
  await page.getByRole("link", { name: "View today’s check-in" }).click();
  await expect(heading).toHaveText("Here’s how today felt.");
  await expectAccessible(page);

  // Changing an answer starts from the saved ones
  await page.getByRole("button", { name: "Change answers" }).click();
  await expect(page.getByRole("radio", { name: "A whisper" })).toBeChecked();
  await pick(page, "Loud");
  for (let i = 0; i < 6; i++) await continueButton.click();
  await expect(page.getByLabel("Anything else you want to remember?")).toHaveValue(
    "Took a gentle walk",
  );
  await page.getByRole("button", { name: "Finish check-in" }).click();
  await expect(heading).toHaveText("You did something kind for yourself.");

  // The change is saved, and survives reloading the page
  await page.goto("/check-in");
  await expect(heading).toHaveText("Here’s how today felt.");
  await expect(
    page.getByText("Pain was loud and your mood felt light.").filter({ visible: true }),
  ).toBeVisible();
});
