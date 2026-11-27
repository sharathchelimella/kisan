import { expect, test } from "@playwright/test";

test("DEMO data includes a bill and an unbilled multi-service job", async ({
  page,
}) => {
  test.skip(process.env.VITE_USE_MOCK_API !== "true", "Requires DEMO mode");
  await page.addInitScript(() => localStorage.setItem("kisan-language", "en"));
  await page.goto("/jobs");
  await expect(page.getByText("3 work records")).toBeVisible();
  await expect(page.getByText("Lakshmi Devi")).toBeVisible();
  await page.goto("/invoices");
  await expect(page.getByText("KMM-000001")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/demo-invoices.png", fullPage: true });
  await page.goto("/jobs/DEMO-work-1003");
  await expect(page.getByText("DEMO Trolley trip")).toBeVisible();
  await page.getByRole("button", { name: "Issue bill" }).click();
  await page.getByRole("link", { name: "View invoice" }).click();
  await expect(page.getByText("KMM-000002")).toBeVisible();
  await expect(page.getByText(/4,400/)).toHaveCount(2);
});
