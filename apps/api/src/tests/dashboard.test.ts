import { expect, it } from "vitest";
import { createDashboardService } from "../services/dashboard.service";
import { memoryDashboard } from "./memory-dashboard";

it("keeps work value, collections and as-of outstanding independent", async () => {
  const read = createDashboardService(
    memoryDashboard({
      workValuePaise: 750000,
      collectionsPaise: 300000,
      outstandingPaise: 1000000,
      farmerCount: 2,
      completedJobCount: 3,
      todayWorkPaise: 0,
      todayCollectionsPaise: 300000,
      recentActivity: [],
    }),
  );
  const result = await read("business-a", {
    from: "2026-11-01",
    to: "2026-11-25",
    asOf: "2026-11-25",
  });
  expect(result.outstandingPaise).toBe(1000000);
  expect(result.outstandingPaise).not.toBe(
    result.workValuePaise - result.collectionsPaise,
  );
  expect(result.completedJobCount).toBe(3);
});
