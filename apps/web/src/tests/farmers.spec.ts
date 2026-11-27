import { createHmac } from "node:crypto";
import { test, expect } from "@playwright/test";

for (const width of [360, 1440]) {
  test(`farmer create, duplicate review, edit and archive at ${width}px`, async ({
    page,
    request,
  }, testInfo) => {
    const email = `farmer-owner-${width}@example.test`;
    const expires = Math.floor(Date.now() / 1000) + 600;
    const verificationCode =
      expires +
      "." +
      createHmac("sha256", "DEMO-playwright-secret-for-verified-registration")
        .update(JSON.stringify([email, expires]))
        .digest("hex");
    const password = "DEMO-strong-password!";
    const registered = await request.post("/api/v1/auth/register", {
      headers: { "X-Kisan-Request": "1" },
      data: {
        email,
        password,
        displayName: "DEMO",
        businessName: "DEMO",
        village: "DEMO",
        preferredLanguage: "en",
        verificationCode,
      },
    });
    expect(registered.status()).toBe(201);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.goto("/farmers");
    await page.getByRole("link", { name: "Add Farmer", exact: true }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(2);
    await page.getByLabel("Name", { exact: true }).fill("DEMO Farmer");
    await page.getByLabel("Village", { exact: true }).fill("DEMO Village");
    await page.screenshot({
      path: testInfo.outputPath(`farmer-form-${width}.png`),
    });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "DEMO Farmer" }),
    ).toBeVisible();
    const profile = page.url();
    await page.getByRole("button", { name: "Edit details" }).click();
    await page.getByLabel("Phone (optional)").fill("98765 43210");
    await page.route("**/api/v1/farmers/*", async (route) => {
      if (route.request().method() === "PATCH")
        await route.fulfill({ status: 500, json: {} });
      else await route.continue();
    });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Could not complete");
    await expect(page.getByLabel("Phone (optional)")).toHaveValue(
      "98765 43210",
    );
    await page.unroute("**/api/v1/farmers/*");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("98765 43210", { exact: true })).toBeVisible();
    await page.goto("/farmers/new");
    await page.getByLabel("Name", { exact: true }).fill("DEMO Farmer");
    await page.getByLabel("Village", { exact: true }).fill("DEMO Village");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Similar farmers");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page
      .getByLabel("Search name, phone or village")
      .fill("demo   farmer");
    await expect(page.getByRole("link", { name: /DEMO Farmer/ })).toBeVisible();
    await expect(page).toHaveURL(/q=demo/);
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /DEMO Farmer/ })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`farmers-${width}.png`),
    });
    for (const language of ["te", "hi", "en"]) {
      await page.getByRole("combobox").selectOption(language);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await page.goto(profile);
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await expect(page.getByText("Archived", { exact: true })).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "DEMO Farmer" }),
    ).toBeVisible();
    await page.goto("/farmers");
    await expect(page.getByText("No farmers match this view.")).toBeVisible();
    await page.getByLabel("Archived", { exact: true }).click();
    await expect(page.getByLabel("Archived", { exact: true })).toBeChecked();
    await expect(page.getByRole("link", { name: /DEMO Farmer/ })).toBeVisible();
  });
}
