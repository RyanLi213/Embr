import AxeBuilder from "@axe-core/playwright";
import { clerk } from "@clerk/testing/playwright";
import { expect, type Page, test } from "@playwright/test";

// A test account in our Clerk development app. Clerk never emails
// "+clerk_test" addresses, so it's safe to use in tests.
const TEST_EMAIL = "embr-e2e+clerk_test@example.com";
const TEST_NAME = "Embr Test";

/** Fails the test if the page breaks any WCAG 2.1 AA accessibility rule */
async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(results.violations).toEqual([]);
}

test.beforeEach(async ({ context, page, baseURL }) => {
  await context.addCookies([{ name: "embr-welcomed", value: "yes", url: baseURL! }]);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("a person signs in, is saved by our API, sees their account, and signs out", async ({
  page,
}) => {
  await page.goto("/");
  const sidebar = page.getByRole("complementary");
  await expect(sidebar.getByText("Guest")).toBeVisible();

  // Sign in, and catch the app telling our API who signed in
  const saved = page.waitForResponse((response) => response.url().endsWith("/v1/me"));
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });

  // Our API checked Clerk's token and saved the person in the database
  const me = await saved;
  expect(me.status()).toBe(200);
  expect(await me.json()).toMatchObject({ email: TEST_EMAIL, name: TEST_NAME });

  // The app now shows who is signed in, and Community is unlocked
  await expect(sidebar.getByText(TEST_NAME)).toBeVisible();
  await expect(sidebar.getByText("Signed in")).toBeVisible();
  await sidebar.getByRole("link", { name: "Community", exact: true }).click();
  await expect(page.getByText(/You’re signed in, so you’ll be ready/)).toBeVisible();

  // Profile shows the account, and signing out turns the visitor back into a guest
  await sidebar.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: TEST_NAME })).toBeVisible();
  await expect(page.getByText(TEST_EMAIL)).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(sidebar.getByText("Guest")).toBeVisible();
});
