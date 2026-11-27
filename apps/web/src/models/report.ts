import type { Report, ReportQuery } from "@kisan/contracts";
export interface ReportClient {
  get(query: ReportQuery): Promise<Report>;
  exportCsv(query: ReportQuery): Promise<Blob>;
}
