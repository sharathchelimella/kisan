import { expect, it } from "vitest";
import {
  calculateEquipmentAnalytics,
  type Equipment,
  type Job,
} from "@kisan/contracts";

const equipment: Equipment[] = [
  { id: "tractor", name: "Tractor", kind: "TRACTOR", active: true },
  { id: "rotavator", name: "Rotavator", kind: "ROTAVATOR", active: true },
  { id: "plough", name: "Plough", kind: "PLOUGH", active: true },
];
function job(id: string, tool: string, amount: number): Job {
  return {
    id,
    farmerId: "farmer",
    workDate: "2026-11-20",
    village: "Village",
    state: "COMPLETED",
    totalPaise: amount,
    invoiceId: null,
    createdAt: "2026-11-20T00:00:00Z",
    updatedAt: "2026-11-20T00:00:00Z",
    lines: [
      {
        lineId: "line-" + id,
        serviceId: "service",
        serviceNameSnapshot: "Field work",
        equipmentIds: ["tractor", tool],
        unit: "ACRE",
        quantity: "4",
        operatingHours: "3",
        pricingMode: "DEFAULT_RATE",
        defaultRateSnapshotPaise: amount / 4,
        totalPaise: amount,
      },
    ],
  };
}
it("counts one business job while attributing its full work value to each participating asset", () => {
  const summary = calculateEquipmentAnalytics(equipment, [
    job("a", "rotavator", 600000),
    job("b", "plough", 400000),
  ]);
  expect(summary.totalCompletedJobs).toBe(2);
  expect(summary.businessWorkPaise).toBe(1000000);
  expect(summary.byId.tractor.completedJobs).toBe(2);
  expect(summary.byId.tractor.associatedWorkPaise).toBe(1000000);
  expect(summary.byId.rotavator.completedJobs).toBe(1);
  expect(summary.byId.rotavator.associatedWorkPaise).toBe(600000);
  expect(
    summary.byId.tractor.partners.find(
      (item) => item.equipmentId === "rotavator",
    )?.jobs,
  ).toBe(1);
  expect(summary.byId.plough.operatingHours).toBe(3);
});
it("excludes drafts and keeps physical machines separate", () => {
  const draft = {
    ...job("draft", "rotavator", 900000),
    state: "DRAFT" as const,
  };
  const summary = calculateEquipmentAnalytics(equipment, [
    draft,
    job("done", "plough", 100000),
  ]);
  expect(summary.totalCompletedJobs).toBe(1);
  expect(summary.byId.rotavator.completedJobs).toBe(0);
  expect(summary.byId.plough.completedJobs).toBe(1);
});
it("calculates utilization only for an exact availability period with complete recorded hours", () => {
  const tractor = {
    ...equipment[0],
    availabilityRecords: [{ from: "2026-11-01", to: "2026-11-30", hours: 6 }],
  };
  const summary = calculateEquipmentAnalytics(
    [tractor],
    [job("a", "rotavator", 600000)],
    "2026-11-01",
    "2026-11-30",
  );
  expect(summary.byId.tractor.utilizationPct).toBe(50);
  const missing = job("b", "rotavator", 100000);
  delete missing.lines[0].operatingHours;
  expect(
    calculateEquipmentAnalytics(
      [tractor],
      [missing],
      "2026-11-01",
      "2026-11-30",
    ).byId.tractor.utilizationPct,
  ).toBeUndefined();
  expect(
    calculateEquipmentAnalytics(
      [tractor],
      [job("a", "rotavator", 600000)],
      "2026-11-02",
      "2026-11-30",
    ).byId.tractor.utilizationPct,
  ).toBeUndefined();
});
