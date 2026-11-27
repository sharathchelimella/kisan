import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("DEMO report chart, filters and CSV use the same figures", async ({
  page,
}) => {
  test.skip(process.env.VITE_USE_MOCK_API !== "true", "Requires DEMO mode");
  await page.addInitScript(() => localStorage.setItem("kisan-language", "en"));
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Reports & Analytics" }),
  ).toBeVisible();
  await page.getByLabel("From").fill("2026-11-01");
  await page.getByLabel("To").fill("2026-11-25");
  await expect(page.getByText(/10,350/).first()).toBeVisible();
  await page.getByRole("button", { name: "Machinery" }).click();
  await expect(page.getByRole("cell", { name: "DEMO Tractor" })).toBeVisible();
  await page.getByLabel("Equipment ID").fill("DEMO-tractor");
  await expect(page.getByText(/5,175/).first()).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const download = await downloadPromise;
  const csv = await readFile(await download.path(), "utf8");
  expect(csv).toContain(
    '"summary","2026-11-01 to 2026-11-25","517500","0","297500","2"',
  );
  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  await page.screenshot({
    path: "docs/screenshots/p09-reports.png",
    fullPage: true,
  });
});
