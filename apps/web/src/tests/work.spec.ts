import { expect, test } from "@playwright/test";
import { demoSession } from "../mocks/auth";

test("guided work pricing retains inputs and saves the reviewed total", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ json: { data: demoSession } }),
  );
  await page.route("**/api/v1/farmers?*", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "DEMO-farmer",
              name: "DEMO Farmer",
              village: "DEMO Village",
              createdAt: "2026-11-24T00:00:00Z",
              updatedAt: "2026-11-24T00:00:00Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 100,
        },
      },
    }),
  );
  await page.route("**/api/v1/services?*", (route) =>
    route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "DEMO-service",
              name: "DEMO Field preparation",
              unit: "ACRE",
              defaultRatePaise: 170000,
              equipmentIds: ["DEMO-tractor"],
              active: true,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 100,
        },
      },
    }),
  );
  await page.route("**/api/v1/jobs", (route) =>
    route.fulfill({
      status: 201,
      json: {
        data: {
          id: "DEMO-job",
          farmerId: "DEMO-farmer",
          workDate: "2026-11-24",
          village: "DEMO Village",
          state: "COMPLETED",
          lines: [
            {
              lineId: "DEMO-line",
              serviceId: "DEMO-service",
              serviceNameSnapshot: "DEMO Field preparation",
              equipmentIds: ["DEMO-tractor"],
              unit: "ACRE",
              quantity: "3.5",
              pricingMode: "CUSTOM_RATE",
              defaultRateSnapshotPaise: 170000,
              agreedRatePaise: 170000,
              totalPaise: 595000,
            },
          ],
          totalPaise: 595000,
          invoiceId: null,
          createdAt: "2026-11-24T00:00:00Z",
          updatedAt: "2026-11-24T00:00:00Z",
          completedAt: "2026-11-24T00:00:00Z",
        },
      },
    }),
  );
  await page.addInitScript(() => localStorage.setItem("kisan-language", "en"));
  await page.goto("/jobs/new");
  await page.getByLabel("Choose a farmer").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Choose a service").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Work date").fill("2026-11-24");
  await page.getByLabel("Quantity").fill("3.5");
  await page.getByLabel("Price option").selectOption("CUSTOM_RATE");
  await page.getByLabel("Rate (₹)").fill("1700");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/5,950/)).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Quantity")).toHaveValue("3.5");
  await expect(page.getByLabel("Rate (₹)")).toHaveValue("1700");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Save Work" }).click();
  await expect(page.getByRole("heading", { name: "Work saved" })).toBeVisible();
  await expect(page.getByText(/5,950/)).toBeVisible();
});
