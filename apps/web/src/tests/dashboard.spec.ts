import { expect, test } from "@playwright/test";

test("DEMO dashboard reconciles completed work and avoids invented utilization", async ({
  page,
}) => {
  test.skip(process.env.VITE_USE_MOCK_API !== "true", "Requires DEMO mode");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(/10,350/).first()).toBeVisible();
  await expect(page.getByText("Not enough data").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /View Machinery/ }),
  ).toBeVisible();
});
