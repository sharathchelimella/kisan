import { expect, test } from "@playwright/test";
import { demoSession } from "../mocks/auth";

test("issues a bill from completed work and displays frozen lines", async ({
  page,
}) => {
  const now = "2026-11-25T00:00:00.000Z";
  const line = {
    lineId: "line-1",
    serviceId: "service-1",
    serviceNameSnapshot: "Ploughing",
    equipmentIds: ["tractor-1"],
    unit: "ACRE",
    quantity: "3.5",
    pricingMode: "DEFAULT_RATE",
    defaultRateSnapshotPaise: 170000,
    totalPaise: 595000,
  };
  const invoice = {
    id: "invoice-1",
    jobId: "job-1",
    invoiceNumber: "KMM-000001",
    sequence: 1,
    lifecycle: "ISSUED",
    issuedAt: now,
    workDate: "2026-11-25",
    farmerSnapshot: { name: "Ravi", village: "North" },
    ownerSnapshot: { name: "Kisan Machinery" },
    lines: [
      {
        lineId: "line-1",
        serviceId: "service-1",
        serviceName: "Ploughing",
        unit: "ACRE",
        quantity: "3.5",
        ratePaise: 170000,
        amountPaise: 595000,
      },
    ],
    totalPaise: 595000,
    paidPaise: 0,
    duePaise: 595000,
    status: "UNPAID",
    version: 1,
  };
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ json: { data: demoSession } }),
  );
  await page.route("**/api/v1/jobs/job-1", (route) =>
    route.fulfill({
      json: {
        data: {
          id: "job-1",
          farmerId: "farmer-1",
          workDate: "2026-11-25",
          village: "North",
          state: "COMPLETED",
          lines: [line],
          totalPaise: 595000,
          invoiceId: null,
          createdAt: now,
          updatedAt: now,
          revisions: [],
        },
      },
    }),
  );
  await page.route("**/api/v1/invoices", (route) =>
    route.fulfill({ status: 201, json: { data: invoice } }),
  );
  await page.route("**/api/v1/invoices/invoice-1", (route) =>
    route.fulfill({ json: { data: invoice } }),
  );
  await page.addInitScript(() => localStorage.setItem("kisan-language", "en"));
  await page.goto("/jobs/job-1");
  await page.getByRole("button", { name: "Issue bill" }).click();
  await page.getByRole("link", { name: "View invoice" }).click();
  await expect(page.getByText("KMM-000001")).toBeVisible();
  await expect(page.getByText("Ploughing")).toBeVisible();
  await expect(page.getByText(/5,950/)).toHaveCount(3);
  await page.screenshot({ path: "docs/screenshots/p06-invoice-detail.png", fullPage: true });
});
