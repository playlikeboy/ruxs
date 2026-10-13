import { test, expect } from "@playwright/test";

test.describe("RUXS Public & Marketing Flow", () => {
  test("loads landing page with honest copy, headline, and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Run your whole day on one private link/i);

    // Verify main headline
    const heading = page.locator("h1");
    await expect(heading).toContainText("Run your whole day on one private link");

    // Verify Free tier callout
    await expect(page.locator("text=Free forever up to 20 households")).toBeVisible();

    // Verify FAQ items
    await expect(page.locator("text=Do my customers need to download an app?")).toBeVisible();
  });

  test("navigates to pricing and displays all 3 tiers", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page).toHaveTitle(/Pricing Plans/i);

    // Verify tiers
    await expect(page.locator("text=Free Tier")).toBeVisible();
    await expect(page.locator("text=Starter")).toBeVisible();
    await expect(page.locator("text=Pro")).toBeVisible();
    await expect(page.locator("text=₹499")).toBeVisible();
  });

  test("loads dedicated tiffin service page", async ({ page }) => {
    await page.goto("/for/tiffin-services");
    await expect(page).toHaveTitle(/Tiffin Service Software/i);
    await expect(page.locator("h1")).toContainText("Cook the exact count");
  });

  test("loads dedicated water supplier page", async ({ page }) => {
    await page.goto("/for/water-suppliers");
    await expect(page).toHaveTitle(/20L Water Delivery Software/i);
    await expect(page.locator("h1")).toContainText("Never lose another 20L empty can");
  });

  test("loads Bengaluru hyperlocal page", async ({ page }) => {
    await page.goto("/in/bengaluru");
    await expect(page).toHaveTitle(/Bengaluru/i);
    await expect(page.locator("text=HSR Layout & BTM")).toBeVisible();
    await expect(page.locator("text=Koramangala & Indiranagar")).toBeVisible();
  });

  test("loads Privacy Policy with DPDP Act notice", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/Privacy Policy/i);
    await expect(page.locator("text=Digital Personal Data Protection Act")).toBeVisible();
  });
});
