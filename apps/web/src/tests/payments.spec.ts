import { expect, test } from "@playwright/test";

test("DEMO partial and final payments update due and reversal restores it", async ({
  page,
}) => {
  test.skip(process.env.VITE_USE_MOCK_API !== "true", "Requires DEMO mode");
  await page.addInitScript(() => localStorage.setItem("kisan-language", "en"));
  await page.goto("/payments");
  await expect(page.getByText("KMM-000001")).toBeVisible();
  await page.getByRole("button", { name: "Collect payment" }).click();
  await page.getByLabel("Amount (₹)").fill("3000");
  await page.getByRole("button", { name: "Review payment" }).click();
  await page.getByRole("button", { name: "Confirm payment" }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: "PARTIAL" })).toBeVisible();
  await expect(page.getByText(/2,950/)).toBeVisible();
  await page.getByRole("button", { name: "Collect payment" }).click();
  await page.getByRole("button", { name: "Review payment" }).click();
  await page.getByRole("button", { name: "Confirm payment" }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: "PAID" })).toBeVisible();
  await page.getByRole("button", { name: "Reverse" }).first().click();
  await page.getByLabel("Reason for reversal").fill("Duplicate payment");
  await page.getByRole("button", { name: "Confirm reversal" }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: "PARTIAL" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/p07-payments.png",
    fullPage: true,
  });
});
