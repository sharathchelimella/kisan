import { expect, test } from "@playwright/test";

for (const width of [360, 1440]) {
  for (const language of ["en", "te", "hi"] as const) {
    test(`shared controls ${language} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 900 });
      await page.goto("/quality.html");
      await page.getByLabel("Language").selectOption(language);
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      await expect(page.locator(".status")).toHaveCount(4);
      await expect(page.locator(".money-text")).toContainText("5,950");
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      for (const control of await page
        .locator("button:visible, input:visible, select:visible")
        .all()) {
        const box = await control.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(48);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      if (process.platform === "win32")
        await expect(page).toHaveScreenshot(`shared-${language}-${width}.png`, {
          fullPage: true,
          animations: "disabled",
        });
      else
        await page.screenshot({ path: testInfo.outputPath(`shared-${language}-${width}.png`), fullPage: true, animations: "disabled" });
    });
  }
}

test("keyboard dialog, filter clearing and failed save keep input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/quality.html");
  const search = page.getByRole("searchbox");
  await search.fill("Ramesh");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(search).toHaveValue("");
  const name = page.getByRole("textbox", { name: "Farmer name" });
  await name.fill("Ramesh");
  await page.getByRole("button", { name: "Save sample" }).click();
  await expect(page.locator(".field-error")).toContainText("Could not save");
  await expect(name).toHaveValue("Ramesh");
  const trigger = page.getByRole("button", { name: "Open confirmation" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Confirm action" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await trigger.click();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(page.locator(".common-toast")).toContainText("Action confirmed");
  await page.getByRole("button", { name: "Dismiss message" }).click();
  await expect(page.locator(".common-toast")).toHaveCount(0);
});
