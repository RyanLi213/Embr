import { expect, test } from "@playwright/test";

test("a new guest is welcomed once, then sees the home screen", async ({ page }) => {
  // A brand-new visitor (no cookies) opening the app lands on the welcome page
  await page.goto("/");
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Meet each day with a little more ease." }),
  ).toBeVisible();

  // No account needed: starting a check-in works straight away
  await page.getByRole("button", { name: "Check in now" }).click();
  // Extra time: the dev server compiles each page on its first visit
  await expect(page).toHaveURL(/\/check-in$/, { timeout: 15_000 });

  // From now on, opening the app shows the home screen with a greeting
  await page.goto("/");
  expect(new URL(page.url()).pathname).toBe("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /^Good (morning|afternoon|evening), friend\.$/,
    }),
  ).toBeVisible();
});

test("the menu reaches every page", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "embr-welcomed", value: "yes", url: baseURL! }]);
  await page.goto("/");

  const menu = page.getByRole("navigation", { name: "Main" });
  await menu.getByRole("link", { name: "Calendar" }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Calendar");

  await menu.getByRole("link", { name: /^Community/ }).click();
  await expect(page).toHaveURL(/\/community$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "You shouldn’t have to do this alone.",
  );
});
