import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("DEMO report uses the registered equipment and completed job source", async ({
  page,
}) => {
  test.skip(process.env.VITE_USE_MOCK_API !== "true", "Requires DEMO mode");
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Reports & Analytics" }),
  ).toBeVisible();
  await expect(page.getByText(/10,350/).first()).toBeVisible();
  await page.getByRole("button", { name: /machinery/i }).click();
  await expect(page.getByRole("cell", { name: /DEMO Tractor/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: /5,175/ })).toBeVisible();
  const tractor = await page
    .getByRole("combobox", { name: "Equipment filter" })
    .locator("option", { hasText: "DEMO Tractor" })
    .getAttribute("value");
  await page
    .getByRole("combobox", { name: "Equipment filter" })
    .selectOption(tractor!);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csv = await readFile(await (await downloadPromise).path(), "utf8");
  expect(csv).toMatch(/"summary","[^"]+","517500"/);
});
