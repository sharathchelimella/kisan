import { expect, test } from "@playwright/test";
import { demoSession } from "../mocks/auth";
const now = "2026-11-25T00:00:00.000Z";
const line = {
  lineId: "line-1",
  serviceId: "service-1",
  serviceNameSnapshot: "Tractor",
  equipmentIds: ["tractor-1"],
  unit: "ACRE",
  quantity: "1",
  pricingMode: "DEFAULT_RATE",
  defaultRateSnapshotPaise: 10000,
  totalPaise: 10000,
};
test("work history filters multiple jobs and shows cancellation audit", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ json: { data: demoSession } }),
  );
  await page.route("**/api/v1/jobs?*", (route) => {
    const url = new URL(route.request().url());
    const items = [
      {
        id: "job-new",
        farmerId: "farmer-1",
        farmerName: "Ravi",
        workDate: "2026-11-24",
        village: "North",
        state: "COMPLETED",
        totalPaise: 10000,
        invoiceId: null,
        createdAt: now,
        updatedAt: now,
        services: ["Tractor"],
      },
      {
        id: "job-old",
        farmerId: "farmer-1",
        farmerName: "Ravi",
        workDate: "2026-11-22",
        village: "South",
        state: "COMPLETED",
        totalPaise: 10000,
        invoiceId: null,
        createdAt: now,
        updatedAt: now,
        services: ["Tractor"],
      },
    ].filter(
      (job) =>
        !url.searchParams.get("village") ||
        job.village
          .toLowerCase()
          .includes(url.searchParams.get("village")!.toLowerCase()),
    );
    return route.fulfill({
      json: { data: { items, total: items.length, page: 1, pageSize: 20 } },
    });
  });
  await page.route("**/api/v1/jobs/job-new", (route) =>
    route.fulfill({
      json: {
        data: {
          id: "job-new",
          farmerId: "farmer-1",
          workDate: "2026-11-24",
          village: "North",
          state: "COMPLETED",
          lines: [line],
          totalPaise: 10000,
          invoiceId: null,
          createdAt: now,
          updatedAt: now,
          revisions: [],
        },
      },
    }),
  );
  await page.route("**/api/v1/jobs/job-new/cancel", (route) =>
    route.fulfill({
      json: {
        data: {
          id: "job-new",
          farmerId: "farmer-1",
          workDate: "2026-11-24",
          village: "North",
          state: "CANCELLED",
          lines: [line],
          totalPaise: 10000,
          invoiceId: null,
          createdAt: now,
          updatedAt: now,
          revisions: [
            {
              action: "CANCELLED",
              reason: "Wrong field",
              actorId: "owner-1",
              at: now,
            },
          ],
        },
      },
    }),
  );
  await page.addInitScript(() => localStorage.setItem("kisan-language", "en"));
  await page.goto("/jobs");
  await expect(page.getByRole("link", { name: "View details" })).toHaveCount(2);
  await page.screenshot({ path: "docs/screenshots/p05-work-records.png", fullPage: true });
  await page.getByLabel("Village", { exact: true }).fill("North");
  await expect(page.getByRole("link", { name: "View details" })).toHaveCount(1);
  await page.getByRole("link", { name: "View details" }).click();
  await expect(
    page.getByRole("heading", { name: "Work details" }),
  ).toBeVisible();
  await page.getByLabel("Reason for cancellation").fill("Wrong field");
  await page.getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(page.getByText("Wrong field")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/p05-work-detail.png", fullPage: true });
});
