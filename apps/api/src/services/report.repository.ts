import { JobModel } from "../models/Job.model";
import { InvoiceModel } from "../models/Invoice.model";
import { ReceiptModel } from "../models/Receipt.model";
import { EquipmentModel } from "../models/Equipment.model";
import type { ReportReadRepository } from "./report.service";

export const mongoReports: ReportReadRepository = {
  async read(businessId, query) {
    const [jobs, invoices, receipts, equipment] = await Promise.all([
      JobModel.find({
        businessId,
        state: { $in: ["COMPLETED", "BILLED"] },
        workDate: { $gte: query.from, $lte: query.to },
        ...(query.farmerId && { farmerId: query.farmerId }),
      }).lean(),
      InvoiceModel.find({
        businessId,
        issuedAt: { $lte: new Date(`${query.asOf}T18:29:59.999Z`) },
        ...(query.farmerId && { farmerId: query.farmerId }),
      }).lean(),
      ReceiptModel.find({
        businessId,
        $or: [
          { paymentDate: { $gte: query.from, $lte: query.to } },
          { paymentDate: { $lte: query.asOf } },
        ],
        ...(query.farmerId && { farmerId: query.farmerId }),
      }).lean(),
      EquipmentModel.find({ businessId }).select("name").lean(),
    ]);
    return {
      jobs: jobs.map((job) => ({
        id: job._id.toString(),
        farmerId: job.farmerId.toString(),
        workDate: job.workDate,
        lines: job.lines.map((line) => ({
          serviceId: line.serviceId.toString(),
          serviceName: line.serviceNameSnapshot,
          amountPaise: line.totalPaise,
          equipmentIds: line.equipmentIds.map((id) => id.toString()),
        })),
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice._id.toString(),
        farmerId: invoice.farmerId?.toString() ?? "",
        issuedDate: invoice.issuedAt.toISOString().slice(0, 10),
        lifecycle: invoice.lifecycle as "ISSUED" | "VOID",
        totalPaise: invoice.totalPaise,
        lines: invoice.lines.map((line) => ({
          serviceId: line.serviceId?.toString() ?? "",
          serviceName: line.serviceName ?? "",
          amountPaise: line.amountPaise ?? 0,
          equipmentIds: line.equipmentIds?.map((id) => id.toString()) ?? [],
        })),
      })),
      receipts: receipts.map((receipt) => ({
        id: receipt._id.toString(),
        invoiceId: receipt.invoiceId.toString(),
        farmerId: receipt.farmerId.toString(),
        paymentDate: receipt.paymentDate,
        createdDate: receipt.createdAt.toISOString().slice(0, 10),
        amountPaise: receipt.amountPaise,
        method: receipt.method as "CASH" | "UPI" | "BANK" | "OTHER",
        status: receipt.status as "POSTED" | "REVERSED",
        reversedDate: receipt.reversedAt?.toISOString().slice(0, 10),
      })),
      equipmentNames: Object.fromEntries(
        equipment.map((value) => [value._id.toString(), value.name]),
      ),
    };
  },
};
