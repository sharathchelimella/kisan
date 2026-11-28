import { expect, test } from "@playwright/test";

for (const width of [360, 1440]) {
  test(`machinery analytics and registration at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/machinery");
    await expect(
      page.getByRole("heading", { name: "Machinery & Tools" }),
    ).toBeVisible();
    await expect(page.getByText("Unique business jobs")).toBeVisible();
    await expect(page.getByText("Not enough data").first()).toBeVisible();
    await expect(page.getByText("Representative image").first()).toBeVisible();
    await page.getByRole("button", { name: "Add Equipment" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /MB Plough/ })
      .click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Fieldking" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Model").fill("Custom 2 bottom");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Name *").fill("My plough " + width);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Confirm and add" }).click();
    await expect(
      page.getByRole("heading", { name: "My plough " + width }),
    ).toBeVisible();
    await expect(page.getByText("0", { exact: true }).first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: testInfo.outputPath(`machinery-${width}.png`),
      fullPage: true,
    });
  });
}

test("DEMO tractor, implement, and business counts stay distinct", async ({
  page,
}) => {
  test.skip(process.env.VITE_USE_MOCK_API !== "true", "Requires DEMO mode");
  await page.goto("/machinery");
  await expect(page.getByText("Unique business jobs")).toBeVisible();
  await expect(
    page.locator(".machinery-kpis").getByText("2", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "DEMO Tractor" }) })
    .click();
  await expect(
    page
      .locator(".machine-detail")
      .getByText(/10,350/)
      .first(),
  ).toBeVisible();
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "DEMO Trolley" }) })
    .click();
  await expect(
    page.locator(".machine-detail").getByText(/1,000/).first(),
  ).toBeVisible();
  await page.getByLabel("Reporting period").selectOption("today");
  await expect(
    page
      .locator(".machine-detail")
      .getByText("No completed work in this period.")
      .first(),
  ).toBeVisible();
  await page.getByLabel(/Available hours/).fill("8");
  await page.getByRole("button", { name: "Save hours" }).click();
  await expect(
    page.locator(".machine-detail").getByText("0%", { exact: true }),
  ).toBeVisible();
});
