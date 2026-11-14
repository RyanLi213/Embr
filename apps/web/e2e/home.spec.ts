import { expect, test } from "@playwright/test";

test("the home page shows the app is connected end to end", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Embr" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check in" })).toBeVisible();

  // Browser -> API -> database -> back to the page
  await expect(page.getByText("API: connected · Database: connected")).toBeVisible();
});
