import { describe, expect, it } from "vitest";
import { jobQuerySchema, type Job } from "@kisan/contracts";
import { memoryJobReads } from "./memory-job-reads";
const now = "2026-11-25T00:00:00.000Z";
function job(id: string, farmerId: string, workDate: string): Job {
  return {
    id,
    farmerId,
    workDate,
    village: "Village",
    state: "COMPLETED",
    lines: [
      {
        lineId: id + "-line",
        serviceId: "service",
        serviceNameSnapshot: "Tractor",
        equipmentIds: ["tractor"],
        unit: "ACRE",
        quantity: "1",
        pricingMode: "DEFAULT_RATE",
        defaultRateSnapshotPaise: 10000,
        totalPaise: 10000,
      },
    ],
    totalPaise: 10000,
    invoiceId: null,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}
const query = (value: object = {}) => jobQuerySchema.parse(value);
describe("job history", () => {
  const reads = memoryJobReads([
    {
      businessId: "a",
      farmerName: "Ravi",
      job: job("one", "farmer", "2026-11-22"),
    },
    {
      businessId: "a",
      farmerName: "Ravi",
      job: job("two", "farmer", "2026-11-24"),
    },
    {
      businessId: "b",
      farmerName: "Ravi",
      job: job("foreign", "farmer", "2026-11-25"),
    },
  ]);
  it("filters, sorts and paginates multiple jobs for one farmer within a tenant", async () => {
    const page = await reads.list(
      "a",
      query({ farmerId: "farmer", pageSize: 1 }),
    );
    expect(page.total).toBe(2);
    expect(page.items[0].id).toBe("two");
    expect(
      (
        await reads.list(
          "a",
          query({ farmerId: "farmer", page: 2, pageSize: 1 }),
        )
      ).items[0].id,
    ).toBe("one");
    expect((await reads.list("a", query({ from: "2026-11-23" }))).total).toBe(
      1,
    );
  });
  it("keeps other tenants hidden and records cancellation once", async () => {
    expect(await reads.get("a", "foreign")).toBeNull();
    expect(
      await reads.cancel("a", "foreign", "owner", "Wrong entry"),
    ).toBeNull();
    const cancelled = await reads.cancel("a", "two", "owner", "Wrong entry");
    expect(cancelled?.state).toBe("CANCELLED");
    expect(cancelled?.revisions).toMatchObject([
      { reason: "Wrong entry", actorId: "owner" },
    ]);
    expect(await reads.cancel("a", "two", "owner", "Again")).toBeNull();
  });
});
