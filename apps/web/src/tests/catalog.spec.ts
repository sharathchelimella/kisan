import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

for (const width of [360, 1440]) {
  test(`catalog equipment, package rates and archive at ${width}px`, async ({
    page,
    request,
  }, testInfo) => {
    const email = `catalog-${width}@example.test`;
    const password = "DEMO-password-123";
    const expires = Math.floor(Date.now() / 1000) + 600;
    const verificationCode =
      expires +
      "." +
      createHmac("sha256", "DEMO-playwright-secret-for-verified-registration")
        .update(JSON.stringify([email, expires]))
        .digest("hex");
    expect(
      (
        await request.post("/api/v1/auth/register", {
          headers: { "X-Kisan-Request": "1" },
          data: {
            email,
            password,
            verificationCode,
            displayName: "DEMO",
            businessName: "DEMO",
            village: "DEMO",
            preferredLanguage: "en",
          },
        })
      ).status(),
    ).toBe(201);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.goto("/machinery");
    for (const [name, kind] of [
      ["DEMO Tractor", "TRACTOR"],
      ["DEMO Rotavator", "ROTAVATOR"],
    ]) {
      await page
        .getByRole("button", { name: "Add Equipment", exact: true })
        .click();
      await page.getByLabel("Name", { exact: true }).fill(name);
      await page.getByLabel("Equipment type").selectOption(kind);
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: testInfo.outputPath(`equipment-${width}.png`),
    });
    await page.getByRole("button", { name: "Services", exact: true }).click();
    await page
      .getByRole("button", { name: "Add Service", exact: true })
      .click();
    await page
      .getByLabel("Name", { exact: true })
      .fill("DEMO Field preparation");
    await page.getByLabel("Pricing unit").selectOption("ACRE");
    await page.getByLabel("Default rate (₹)").fill("1700.001");
    await page.getByLabel("DEMO Tractor", { exact: true }).check();
    await page.getByLabel("DEMO Rotavator", { exact: true }).check();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("two decimal places");
    await page.getByLabel("Default rate (₹)").fill("1700.25");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Equipment linked: 2")).toBeVisible();
    await expect(page.getByText(/1,700.25/)).toBeVisible();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByLabel("Default rate (₹)").fill("1900");
    await page.route("**/api/v1/services/*", (route) =>
      route.fulfill({ status: 500, json: {} }),
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Default rate (₹)")).toHaveValue("1900");
    await page.unroute("**/api/v1/services/*");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(/1,900.00/)).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`services-${width}.png`),
    });
    for (const language of ["te", "hi", "en"]) {
      await page
        .getByRole("combobox", { name: /Language|భాష|भाषा/ })
        .selectOption(language);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await page.getByRole("button", { name: "Archive", exact: true }).click();
    await page
      .getByRole("button", { name: "Archive", exact: true })
      .first()
      .click();
    await expect(
      page.getByText("No catalog records in this view."),
    ).toBeVisible();
    await page.getByLabel("Archived", { exact: true }).click();
    await expect(page.getByLabel("Archived", { exact: true })).toBeChecked();
    await expect(
      page.getByRole("heading", { name: "DEMO Field preparation" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "DEMO Field preparation" }),
    ).toBeVisible();
  });
}
