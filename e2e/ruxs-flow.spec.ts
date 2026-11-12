import { test, expect } from "@playwright/test";

test.describe("RUXS Public & Consumer Flow", () => {
  test("loads landing page with headline and a CTA into the app", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RUXs/);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('main a[href="/app"]').first()).toBeVisible();
  });

  test("loads the pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveTitle(/Pricing/i);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("loads dedicated tiffin service page", async ({ page }) => {
    await page.goto("/for/tiffin-services");
    await expect(page).toHaveTitle(/Tiffin & Meal Subscriptions/i);
    await expect(page.locator("h1")).toContainText("Good meals");
  });

  test("loads dedicated water supplier page", async ({ page }) => {
    await page.goto("/for/water-suppliers");
    await expect(page).toHaveTitle(/Water-Can Delivery/i);
    await expect(page.locator("h1")).toContainText("Water at home");
  });

  test("loads the household explore page", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveTitle(/Explore/i);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("redirects old in/bengaluru route to /app", async ({ page }) => {
    await page.goto("/in/bengaluru");
    await expect(page).toHaveURL(/\/app/);
  });

  test("loads Privacy Policy with DPDP Act notice", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/Privacy Policy/i);
    await expect(page.locator("text=Digital Personal Data Protection Act")).toBeVisible();
  });
});
