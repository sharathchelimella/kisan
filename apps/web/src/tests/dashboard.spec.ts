import { expect, test } from "@playwright/test";

test("DEMO dashboard shows the five summary cards and quick links", async ({
  page,
}) => {
  test.skip(process.env.VITE_USE_MOCK_API !== "true", "Requires DEMO mode");
  await page.addInitScript(() => localStorage.setItem("kisan-language", "en"));
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Business Overview" }),
  ).toBeVisible();
  await expect(page.getByText("Completed work value")).toBeVisible();
  await expect(page.getByText("Outstanding", { exact: true })).toBeVisible();
  await expect(page.getByText(/10,350/)).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Quick links" }).getByRole("link"),
  ).toHaveCount(3);
  await page.screenshot({
    path: "docs/screenshots/p08-dashboard.png",
    fullPage: true,
  });
});
