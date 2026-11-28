import { aggregateReport, reportCsv, type ReportSource } from "@kisan/domain";
import type { ReportClient } from "../models/report";
import { demoJobs } from "./jobs";
import { demoCatalog } from "./catalog";

async function source(): Promise<ReportSource> {
  const equipment = await demoCatalog.equipment({
    active: "all",
    page: 1,
    pageSize: 100,
  });
  const ids: Record<string, string | undefined> = {
    "DEMO-tractor": equipment.items.find((item) => item.kind === "TRACTOR")?.id,
    "DEMO-rotavator": equipment.items.find((item) => item.kind === "ROTAVATOR")
      ?.id,
    "DEMO-trolley": equipment.items.find((item) => item.kind === "TROLLEY")?.id,
  };
  return {
    jobs: demoJobs
      .filter((job) => job.state === "COMPLETED" || job.state === "BILLED")
      .map((job) => ({
        id: job.id,
        farmerId: job.farmerId,
        workDate: job.workDate,
        lines: job.lines.map((line) => ({
          serviceId: line.serviceId,
          serviceName: line.serviceNameSnapshot,
          amountPaise: line.totalPaise,
          equipmentIds: line.equipmentIds.map((id) => ids[id] ?? id),
        })),
      })),
    invoices: [],
    receipts: [],
    equipmentNames: Object.fromEntries(
      equipment.items.map((item) => [item.id, item.name]),
    ),
  };
}
export const demoReportOptions = { farmers: [], equipment: [], services: [] };
export const demoReports: ReportClient = {
  async get(query) {
    return aggregateReport(query, await source());
  },
  async exportCsv(query) {
    return new Blob([reportCsv(aggregateReport(query, await source()))], {
      type: "text/csv;charset=utf-8",
    });
  },
};
