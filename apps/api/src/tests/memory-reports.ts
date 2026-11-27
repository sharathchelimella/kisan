import type { ReportSource } from "@kisan/domain";
import type { ReportReadRepository } from "../services/report.service";

export function memoryReports(
  source: ReportSource = { jobs: [], invoices: [], receipts: [] },
): ReportReadRepository {
  return {
    async read() {
      return source;
    },
  };
}
