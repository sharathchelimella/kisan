import type { Dashboard } from "@kisan/contracts";
import type { DashboardClient } from "../models/dashboard";
import { demoJobs } from "./jobs";
import { all124DemoFarmers } from "./farmer-dataset";
import { demoReports } from "./reports";

export const demoDashboard: DashboardClient = {
  async summary(query): Promise<Dashboard> {
    const report = await demoReports.get({ ...query, groupBy: "month" });
    const complete = demoJobs.filter(
      (job) =>
        (job.state === "COMPLETED" || job.state === "BILLED") &&
        job.workDate >= query.from &&
        job.workDate <= query.to,
    );
    return {
      ...query,
      workValuePaise: report.summary.workValuePaise,
      collectionsPaise: report.summary.collectionsPaise,
      outstandingPaise: report.summary.outstandingPaise,
      farmerCount: all124DemoFarmers.length,
      completedJobCount: report.summary.workCount,
      todayWorkPaise: complete
        .filter((job) => job.workDate === query.asOf)
        .reduce((sum, job) => sum + job.totalPaise, 0),
      todayCollectionsPaise: 0,
      recentActivity: complete
        .slice()
        .sort((a, b) => b.workDate.localeCompare(a.workDate))
        .slice(0, 8)
        .map((job) => ({
          id: job.id,
          kind: "WORK",
          date: job.workDate,
          label: job.lines[0]?.serviceNameSnapshot ?? "Completed work",
          amountPaise: job.totalPaise,
          reference: job.id,
          entityId: job.id,
          entityType: "JOB",
          status: job.state,
        })),
      monthlyTrend: report.series.map((point) => ({
        month: point.date.slice(0, 7),
        revenuePaise: point.workValuePaise,
        collectedPaise: point.collectionsPaise,
      })),
      monthlyTrend12: report.series.map((point) => ({
        month: point.date.slice(0, 7),
        revenuePaise: point.workValuePaise,
        collectedPaise: point.collectionsPaise,
      })),
      machineryStats: [],
      pendingPaymentsTopFarmers: [],
    };
  },
};
