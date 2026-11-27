import type { RequestHandler } from "express";
import type { ReportReadRepository } from "../services/report.service";
import { createReportService, reportCsv } from "../services/report.service";

function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function createReportController(
  repository: ReportReadRepository,
): Record<"get" | "csv", RequestHandler> {
  const report = createReportService(repository);
  const query = (raw: Record<string, unknown>) => {
    const date = today();
    return {
      from: raw.from ?? `${date.slice(0, 7)}-01`,
      to: raw.to ?? date,
      asOf: raw.asOf ?? date,
      groupBy: raw.groupBy ?? "day",
      farmerId: raw.farmerId,
      equipmentId: raw.equipmentId,
      serviceId: raw.serviceId,
    };
  };
  return {
    get: async (req, res) =>
      res.json({
        data: await report(res.locals.businessId, query(req.query)),
        meta: { requestId: res.locals.requestId },
      }),
    csv: async (req, res) => {
      const data = await report(res.locals.businessId, query(req.query));
      res
        .type("text/csv")
        .setHeader("Content-Disposition", "attachment; filename=report.csv");
      res.send(reportCsv(data));
    },
  };
}
