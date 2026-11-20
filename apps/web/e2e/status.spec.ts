import { expect, test } from "@playwright/test";

test("the status page shows the app is connected end to end", async ({ page }) => {
  await page.goto("/status");

  await expect(page.getByRole("heading", { name: "System status" })).toBeVisible();

  // Browser -> API -> database -> back to the page
  await expect(page.getByText("API: connected · Database: connected")).toBeVisible();
});
