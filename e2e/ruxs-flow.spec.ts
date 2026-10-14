import { test, expect } from "@playwright/test";

test.describe("RUXS Public & Consumer Flow", () => {
  test("loads landing page with customer-first copy, headline, and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Everyday Essentials/i);

    // Verify main headline
    const heading = page.locator("h1");
    await expect(heading).toContainText("Your daily needs");

    // Verify key value propositions
    await expect(page.locator("text=Local businesses")).toBeVisible();
    await expect(page.locator("text=Merchant-set prices")).toBeVisible();

    // Verify FAQ items
    await expect(page.locator("text=What can I order through RUXS?")).toBeVisible();
  });

  test("navigates to pricing and displays all 3 tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveTitle(/Pricing/i);

    // Verify tiers
    await expect(page.locator("text=Free Tier")).toBeVisible();
    await expect(page.locator("text=Starter")).toBeVisible();
    await expect(page.locator("text=Pro")).toBeVisible();
    await expect(page.locator("text=₹499")).toBeVisible();
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

  test("loads consumer hub page with hyperlocal location discovery", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveTitle(/Consumer Portal/i);
    await expect(page.locator("text=Connect Your Active Household")).toBeVisible();
    await expect(page.locator("text=Stores & Suppliers Near You")).toBeVisible();
    await expect(page.locator("text=Detect My Location")).toBeVisible();
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
