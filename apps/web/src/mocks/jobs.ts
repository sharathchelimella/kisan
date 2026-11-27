import type { Job, JobInput } from "@kisan/contracts";
import { multiplyRate, sumPaise } from "@kisan/domain";
import type { JobClient } from "../models/job";
import { demoFarmers } from "./fixtures";
import { demoCatalog } from "./catalog";

const fixtureTime = "2026-11-20T08:00:00.000Z";
const fixtureLine = {
  lineId: "DEMO-line-1",
  serviceId: "DEMO-service-1",
  serviceNameSnapshot: "DEMO Field preparation",
  equipmentIds: ["DEMO-tractor", "DEMO-rotavator"],
  unit: "ACRE" as const,
  quantity: "3.5",
  pricingMode: "DEFAULT_RATE" as const,
  defaultRateSnapshotPaise: 170000,
  totalPaise: 595000,
};
export const demoJobs: Job[] = [
  {
    id: "DEMO-work-1001",
    farmerId: demoFarmers[0].id,
    workDate: "2026-11-18",
    village: "Madhapur",
    state: "BILLED",
    lines: [fixtureLine],
    totalPaise: 595000,
    invoiceId: "DEMO-invoice-1",
    completedAt: fixtureTime,
    createdAt: fixtureTime,
    updatedAt: fixtureTime,
  },
  {
    id: "DEMO-work-1002",
    farmerId: demoFarmers[0].id,
    workDate: "2026-11-20",
    village: "Madhapur",
    state: "DRAFT",
    lines: [{ ...fixtureLine, lineId: "DEMO-line-2" }],
    totalPaise: 595000,
    invoiceId: null,
    createdAt: fixtureTime,
    updatedAt: fixtureTime,
  },
  {
    id: "DEMO-work-1003",
    farmerId: demoFarmers[1].id,
    workDate: "2026-11-22",
    village: "Narsapur",
    state: "COMPLETED",
    lines: [
      {
        ...fixtureLine,
        lineId: "DEMO-line-3",
        quantity: "2",
        totalPaise: 340000,
      },
      {
        lineId: "DEMO-line-4",
        serviceId: "DEMO-service-2",
        serviceNameSnapshot: "DEMO Trolley trip",
        equipmentIds: ["DEMO-tractor", "DEMO-trolley"],
        unit: "TRIP",
        quantity: "2",
        pricingMode: "DEFAULT_RATE",
        defaultRateSnapshotPaise: 50000,
        totalPaise: 100000,
      },
    ],
    totalPaise: 440000,
    invoiceId: null,
    completedAt: fixtureTime,
    createdAt: fixtureTime,
    updatedAt: fixtureTime,
  },
];
export const demoJobClient: JobClient = {
  async farmers() {
    return demoFarmers.map(({ id, name, village }) => ({ id, name, village }));
  },
  async services() {
    const page = await demoCatalog.services({
      page: 1,
      pageSize: 100,
      active: "true",
    });
    return page.items.map(
      ({ id, name, unit, defaultRatePaise, equipmentIds }) => ({
        id,
        name,
        unit,
        defaultRatePaise,
        equipmentIds,
      }),
    );
  },
  async save(input: JobInput) {
    const services = await this.services();
    const lines = input.lines.map((line) => {
      const service = services.find((item) => item.id === line.serviceId);
      if (!service) throw new Error("Service unavailable");
      const rate =
        line.pricingMode === "CUSTOM_RATE"
          ? line.agreedRatePaise
          : service.defaultRatePaise;
      return {
        ...line,
        lineId: crypto.randomUUID(),
        serviceNameSnapshot: service.name,
        defaultRateSnapshotPaise: service.defaultRatePaise,
        totalPaise:
          line.pricingMode === "CUSTOM_TOTAL"
            ? line.agreedTotalPaise
            : multiplyRate(line.quantity, rate, line.unit),
      };
    });
    const now = new Date().toISOString();
    const job: Job = {
      ...input,
      id: "DEMO-" + crypto.randomUUID(),
      lines,
      totalPaise: sumPaise(lines.map((line) => line.totalPaise)),
      invoiceId: null,
      createdAt: now,
      updatedAt: now,
      ...(input.state === "COMPLETED" && { completedAt: now }),
    };
    demoJobs.push(job);
    return job;
  },
};
