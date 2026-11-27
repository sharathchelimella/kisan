import { API_PREFIX, reportSchema } from "@kisan/contracts";
import type { ReportClient } from "../models/report";
import { demoReports } from "../mocks/reports";

const http: ReportClient = {
  async get(query) {
    const res = await fetch(
      `${API_PREFIX}/reports?${new URLSearchParams(query)}`,
    );
    if (!res.ok) throw new Error("Report unavailable");
    return reportSchema.parse((await res.json()).data);
  },
  async exportCsv(query) {
    const res = await fetch(
      `${API_PREFIX}/reports/export.csv?${new URLSearchParams(query)}`,
    );
    if (!res.ok) throw new Error("Export unavailable");
    return res.blob();
  },
};
export const reportClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demoReports
    : http;
