import type { RequestHandler } from "express";
import { dashboardQuerySchema } from "@kisan/contracts";
import type { DashboardReadRepository } from "../services/dashboard.service";
import { createDashboardService } from "../services/dashboard.service";

function localDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function createDashboardController(
  repository: DashboardReadRepository,
): RequestHandler {
  const summary = createDashboardService(repository);
  return async (req, res) => {
    const now = new Date();
    const today = localDate(now);
    const monthStart = `${today.slice(0, 7)}-01`;
    const query = dashboardQuerySchema.parse({
      from: req.query.from ?? monthStart,
      to: req.query.to ?? today,
      asOf: req.query.asOf ?? today,
    });
    res.json({
      data: await summary(res.locals.businessId, query),
      meta: { requestId: res.locals.requestId },
    });
  };
}
