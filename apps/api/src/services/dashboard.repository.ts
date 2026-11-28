import { JobModel } from "../models/Job.model";
import { ReceiptModel } from "../models/Receipt.model";
import { InvoiceModel } from "../models/Invoice.model";
import { FarmerModel } from "../models/Farmer.model";
import type { DashboardReadRepository } from "./dashboard.service";

const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);

export const mongoDashboard: DashboardReadRepository = {
  async summary(businessId, { from, to, asOf }) {
    const asOfEnd = new Date(`${asOf}T18:29:59.999Z`);
    const [
      jobs,
      receipts,
      invoices,
      farmerCount,
      todayJobs,
      todayReceipts,
      recentJobs,
      recentReceipts,
      recentInvoices,
    ] = await Promise.all([
      JobModel.find({
        businessId,
        state: { $in: ["COMPLETED", "BILLED"] },
        workDate: { $gte: from, $lte: to },
      })
        .select("totalPaise farmerId lines workDate")
        .lean(),
      ReceiptModel.find({
        businessId,
        status: "POSTED",
        paymentDate: { $gte: from, $lte: to },
      })
        .select("amountPaise paymentDate invoiceId")
        .lean(),
      InvoiceModel.find({
        businessId,
        lifecycle: "ISSUED",
        issuedAt: { $lte: asOfEnd },
      })
        .select("totalPaise _id lines issuedAt")
        .lean(),
      FarmerModel.countDocuments({
        businessId,
        archivedAt: { $exists: false },
      }),
      JobModel.find({
        businessId,
        state: { $in: ["COMPLETED", "BILLED"] },
        workDate: asOf,
      })
        .select("totalPaise")
        .lean(),
      ReceiptModel.find({ businessId, status: "POSTED", paymentDate: asOf })
        .select("amountPaise")
        .lean(),
      JobModel.find({ businessId, state: { $in: ["COMPLETED", "BILLED"] } })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("farmerId", "name village")
        .select("workDate totalPaise farmerId lines")
        .lean(),
      ReceiptModel.find({ businessId, status: "POSTED" })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("farmerId", "name")
        .select("paymentDate amountPaise reference farmerId")
        .lean(),
      InvoiceModel.find({ businessId, lifecycle: "ISSUED" })
        .sort({ issuedAt: -1 })
        .limit(6)
        .select("issuedAt invoiceNumber totalPaise farmerSnapshot")
        .lean(),
    ]);

    const invoiceIds = invoices.map((invoice) => invoice._id);
    const paid = await ReceiptModel.find({
      businessId,
      invoiceId: { $in: invoiceIds },
      paymentDate: { $lte: asOf },
      createdAt: { $lte: asOfEnd },
      $or: [
        { status: "POSTED" },
        { status: "REVERSED", reversedAt: { $gt: asOfEnd } },
      ],
    })
      .select("amountPaise")
      .lean();

    const activity = [
      ...recentJobs.map((value: any) => ({
        id: value._id.toString(),
        kind: "WORK" as const,
        date: value.workDate,
        timestamp: `${value.workDate} 10:00`,
        label: value.lines?.[0]?.serviceNameSnapshot || "Work completed",
        amountPaise: value.totalPaise,
        farmerName: value.farmerId?.name || "Farmer",
        reference: `WRK-${value._id.toString().slice(-4)}`,
        status: value.state || "COMPLETED",
        entityId: value._id.toString(),
        entityType: "JOB",
      })),
      ...recentReceipts.map((value: any) => ({
        id: value._id.toString(),
        kind: "PAYMENT" as const,
        date: value.paymentDate,
        timestamp: `${value.paymentDate} 14:30`,
        label: "Payment received",
        amountPaise: value.amountPaise,
        farmerName: value.farmerId?.name || "Farmer",
        reference: value.reference || "REC",
        status: value.status || "COMPLETED",
        entityId: value._id.toString(),
        entityType: "PAYMENT",
      })),
      ...recentInvoices.map((value: any) => ({
        id: value._id.toString(),
        kind: "INVOICE" as const,
        date: value.issuedAt.toISOString().slice(0, 10),
        timestamp: `${value.issuedAt.toISOString().slice(0, 10)} 11:20`,
        label: value.invoiceNumber,
        amountPaise: value.totalPaise,
        farmerName: value.farmerSnapshot?.name || "Farmer",
        reference: value.invoiceNumber,
        status: value.status || "ISSUED",
        entityId: value._id.toString(),
        entityType: "INVOICE",
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);

    const workValuePaise = sum(jobs.map((job) => job.totalPaise));
    const collectionsPaise = sum(receipts.map((receipt) => receipt.amountPaise));
    const outstandingPaise = Math.max(
      0,
      sum(invoices.map((invoice) => invoice.totalPaise)) -
        sum(paid.map((receipt) => receipt.amountPaise)),
    );

    const activeFarmerIds = new Set(jobs.map((j) => j.farmerId?.toString()).filter(Boolean));
    const activeFarmerCount = activeFarmerIds.size;

    // Calculate collection percentages
    const totalBilled = sum(invoices.map((invoice) => invoice.totalPaise));
    const collectedPct = totalBilled > 0 ? Number(((collectionsPaise / totalBilled) * 100).toFixed(1)) : 0;
    const pendingPct = totalBilled > 0 ? Number((100 - collectedPct).toFixed(1)) : 0;

    // Machinery revenue aggregation from jobs
    const machineryMap = new Map<string, number>();
    for (const job of jobs) {
      for (const line of job.lines || []) {
        const name = line.serviceNameSnapshot?.replace("[DEMO] ", "") || "Others";
        let category = "Others";
        if (name.includes("Plough")) category = "Tractor (Plough)";
        else if (name.includes("Rotavator")) category = "Rotavator";
        else if (name.includes("Trailer") || name.includes("Transport")) category = "Trailer (Mud)";
        else if (name.includes("Cultivator")) category = "Cultivator";

        machineryMap.set(category, (machineryMap.get(category) || 0) + line.totalPaise);
      }
    }

    const revenueByMachinery = [...machineryMap].map(([name, revenuePaise]) => ({ name, revenuePaise, pct: workValuePaise ? Number((100 * revenuePaise / workValuePaise).toFixed(1)) : 0 }));

    // Works by Type breakdown
    const worksTypeMap = new Map<string, number>();
    for (const job of jobs) {
      for (const line of job.lines || []) {
        const name = line.serviceNameSnapshot?.replace("[DEMO] ", "") || "Others";
        let cat = "Others";
        if (name.includes("Plough")) cat = "Plough";
        else if (name.includes("Rotavator")) cat = "Rotavator";
        else if (name.includes("Transport") || name.includes("Trailer")) cat = "Mud Trip";
        else if (name.includes("Cultivator")) cat = "Cultivator";
        worksTypeMap.set(cat, (worksTypeMap.get(cat) || 0) + 1);
      }
    }

    const worksByType = [...worksTypeMap].map(([name, count]) => ({ name, count }));

    // Standard 6-month historical trend
    const trend = new Map<string, { month: string; revenuePaise: number; collectedPaise: number }>();
    for (const job of jobs) { const month = job.workDate.slice(0, 7); const row = trend.get(month) ?? { month, revenuePaise: 0, collectedPaise: 0 }; row.revenuePaise += job.totalPaise; trend.set(month, row); }
    for (const receipt of receipts) { const month = receipt.paymentDate.slice(0, 7); const row = trend.get(month) ?? { month, revenuePaise: 0, collectedPaise: 0 }; row.collectedPaise += receipt.amountPaise; trend.set(month, row); }
    const monthlyTrend = [...trend.values()].sort((a, b) => a.month.localeCompare(b.month));

    return {
      workValuePaise,
      collectionsPaise,
      outstandingPaise,
      farmerCount,
      completedJobCount: jobs.length,
      todayWorkPaise: sum(todayJobs.map((job) => job.totalPaise)),
      todayCollectionsPaise: sum(todayReceipts.map((receipt) => receipt.amountPaise)),
      recentActivity: activity,

      // Rich analytics
      collectedPct,
      pendingPct,
      activeFarmerCount,
      monthlyTrend,
      revenueByMachinery,
      equipmentUtilization: [],
      paymentBreakdown: {
        collectedPaise: collectionsPaise,
        pendingPaise: outstandingPaise,
        collectedPct,
        avgPaymentDays: 0,
      },
      worksByType,
      todayOverview: {
        todayWorkPaise: sum(todayJobs.map((job) => job.totalPaise)),
        todayCollectionsPaise: sum(todayReceipts.map((receipt) => receipt.amountPaise)),
        scheduledJobs: 0,
        pendingJobs: 0,
      },
    };
  },
};
