import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

for (const width of [360, 1440]) {
  test(`registers, signs in and protects the profile at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 360 ? 800 : 900 });
    await page.goto("/profile");
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    for (const language of ["te", "hi", "en"]) {
      await page.getByRole("combobox").selectOption(language);
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await page.screenshot({ path: testInfo.outputPath(`login-${width}.png`) });
    await page.getByRole("link", { name: "Create an owner account" }).click();
    const email = `demo-${width}@example.test`;
    const expires = Math.floor(Date.now() / 1000) + 600;
    const signature = createHmac(
      "sha256",
      "DEMO-playwright-secret-for-verified-registration",
    )
      .update(JSON.stringify([email, expires]))
      .digest("hex");
    await page.screenshot({
      path: testInfo.outputPath(`register-${width}.png`),
      fullPage: true,
    });
    await page.getByLabel("Your name").fill("DEMO Owner");
    await page.getByLabel("Business name").fill("DEMO Machinery");
    await page.getByLabel("Village").fill("DEMO Village");
    await page.getByLabel("Email").fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("DEMO-strong-password!");
    await page.getByLabel("Registration code").fill(`${expires}.${signature}`);
    await page.getByRole("button", { name: "Create an owner account" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Account created. You can now sign in.",
    );
    await page.getByRole("link", { name: "Sign in" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "Email or password is incorrect.",
    );
    await page
      .getByLabel("Password", { exact: true })
      .fill("DEMO-strong-password!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.getByRole("link", { name: "Owner profile" }).click();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Owner profile" }),
    ).toBeVisible();
    await expect(page.getByText("DEMO Machinery")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`profile-${width}.png`),
    });
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");
    await page.goto("/jobs");
    await expect(page).toHaveURL("/login");
  });
}
