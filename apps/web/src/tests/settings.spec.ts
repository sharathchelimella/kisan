import { expect, test } from "@playwright/test";

test("DEMO settings save language and large text across reload at 360px", async ({
  page,
}) => {
  test.skip(process.env.VITE_USE_MOCK_API !== "true", "Requires DEMO mode");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => {
    if (!localStorage.getItem("kisan-language"))
      localStorage.setItem("kisan-language", "en");
  });
  await page.goto("/settings");
  await expect(page.getByLabel("Business name")).toHaveValue("DEMO Business");
  await page.getByLabel("Business phone (optional)").fill("9876543210");
  await page.getByLabel("Preferred language").selectOption("te");
  await page.getByLabel("Text size").selectOption("LARGE");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "te");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "te");
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
  await expect(page.getByLabel("వ్యాపార ఫోన్ (ఐచ్ఛికం)")).toHaveValue("9876543210");
  await expect(page.getByLabel("ఇష్టమైన భాష")).toHaveValue("te");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({
    path: "docs/screenshots/p10-settings-360.png",
    fullPage: true,
  });
});
