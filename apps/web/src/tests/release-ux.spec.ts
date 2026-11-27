import { expect, test } from "@playwright/test";
import { demoSession } from "../mocks/auth";
import { resources } from "../i18n/resources";

const settings = {
  businessName: "Kisan Machinery",
  village: "North Village",
  phone: "",
  address: "",
  timezone: "Asia/Kolkata",
  invoicePrefix: "KMM",
  nextInvoiceSequence: 3,
  ownerDisplayName: "Owner",
  ownerMobile: "",
  preferredLanguage: "hi",
  notificationsOptIn: false,
  textSize: "STANDARD",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ json: { data: demoSession } }),
  );
});

test("Hindi settings stay reachable with 200% text at 360px", async ({
  page,
}) => {
  test.skip(
    process.env.VITE_USE_MOCK_API === "true",
    "Uses intercepted API mode",
  );
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => localStorage.setItem("kisan-language", "hi"));
  await page.route("**/api/v1/settings", (route) =>
    route.fulfill({ json: { data: settings } }),
  );
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: resources.hi.translation.pages.settings.title,
    }),
  ).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
  const save = page.locator(".settings-form button[type=submit]");
  await save.scrollIntoViewIfNeeded();
  await expect(save).toBeVisible();
  const bounds = await save.boundingBox();
  expect(bounds?.height).toBeGreaterThanOrEqual(48);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
  await page.screenshot({
    path: "docs/screenshots/p90-settings-200-text.png",
    fullPage: true,
  });
});

test("failed Settings save keeps entered data and reports the error", async ({
  page,
}) => {
  test.skip(
    process.env.VITE_USE_MOCK_API === "true",
    "Uses intercepted API mode",
  );
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => localStorage.setItem("kisan-language", "en"));
  await page.route("**/api/v1/settings", async (route) => {
    if (route.request().method() === "GET")
      await route.fulfill({
        json: { data: { ...settings, preferredLanguage: "en" } },
      });
    else {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.abort("failed");
    }
  });
  await page.goto("/settings");
  const businessName = page.getByLabel("Business name");
  await expect(businessName).toHaveValue("Kisan Machinery");
  await businessName.fill("New Kisan Name");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Could not load or save settings",
  );
  await expect(businessName).toHaveValue("New Kisan Name");
  await expect(page.getByText("Settings saved")).toHaveCount(0);
});
