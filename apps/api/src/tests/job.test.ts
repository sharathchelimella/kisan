import { expect, it } from "vitest";
import {
  createJobService,
  JobReferenceError,
  JobPricingError,
} from "../services/job.service";
import { memoryJobPorts } from "./memory-jobs";

const farmerId = "DEMO-farmer";
const serviceId = "DEMO-service";
const equipmentIds = ["DEMO-tractor", "DEMO-rotavator"];
const ports = memoryJobPorts(
  [{ id: farmerId, name: "DEMO Farmer", village: "DEMO Village" }],
  [
    {
      id: serviceId,
      name: "DEMO Field preparation",
      unit: "ACRE",
      defaultRatePaise: 150000,
      equipmentIds,
    },
  ],
);
const save = createJobService(ports);
const base = {
  farmerId,
  workDate: "2026-11-24",
  village: "DEMO Village",
  state: "COMPLETED",
  lines: [
    {
      serviceId,
      equipmentIds,
      unit: "ACRE",
      quantity: "3.5",
      pricingMode: "CUSTOM_RATE",
      agreedRatePaise: 170000,
    },
  ],
};
it("recalculates exact amounts from service snapshots and saves a job ID", async () => {
  const job = await save("DEMO-business", "DEMO-owner", base);
  expect(job.id).toBeTruthy();
  expect(job.totalPaise).toBe(595000);
  expect(job.lines[0].defaultRateSnapshotPaise).toBe(150000);
  expect(job.lines[0].totalPaise).toBe(595000);
  expect(job.completedAt).toBeTruthy();
  expect(ports.jobs).toHaveLength(1);
});
it("rejects forged service references and invalid pricing", async () => {
  await expect(
    save("DEMO-business", "DEMO-owner", {
      ...base,
      lines: [{ ...base.lines[0], serviceId: "foreign" }],
    }),
  ).rejects.toBeInstanceOf(JobReferenceError);
  await expect(
    save("DEMO-business", "DEMO-owner", {
      ...base,
      lines: [{ ...base.lines[0], equipmentIds: ["foreign"] }],
    }),
  ).rejects.toBeInstanceOf(JobReferenceError);
  await expect(
    save("DEMO-business", "DEMO-owner", {
      ...base,
      lines: [{ ...base.lines[0], quantity: "0" }],
    }),
  ).rejects.toThrow();
  const fixed = memoryJobPorts(
    [{ id: farmerId, name: "DEMO", village: "DEMO" }],
    [
      {
        id: serviceId,
        name: "DEMO fixed",
        unit: "FIXED",
        defaultRatePaise: 10000,
        equipmentIds,
      },
    ],
  );
  await expect(
    createJobService(fixed)("DEMO-business", "DEMO-owner", {
      ...base,
      lines: [
        {
          serviceId,
          equipmentIds,
          unit: "FIXED",
          quantity: "2",
          pricingMode: "DEFAULT_RATE",
        },
      ],
    }),
  ).rejects.toBeInstanceOf(JobPricingError);
});
