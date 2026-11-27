import { AllocationModel } from "../models/Allocation.model";
import { InvoiceModel } from "../models/Invoice.model";
import { ReceiptModel } from "../models/Receipt.model";
import { reconcileLedger } from "./reconciliation.service";

export async function reconcileBusiness(businessId: string) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(
      async () => {
        const invoices = await InvoiceModel.find({ businessId })
          .select(
            "totalPaise paidPaise duePaise lifecycle status lines.amountPaise",
          )
          .session(session)
          .lean();
        const receipts = await ReceiptModel.find({ businessId })
          .select("invoiceId amountPaise status")
          .session(session)
          .lean();
        const allocations = await AllocationModel.find({ businessId })
          .select("invoiceId receiptId amountPaise reversedAt")
          .session(session)
          .lean();
        return reconcileLedger(
          invoices.map((value) => ({
            id: value._id.toString(),
            totalPaise: value.totalPaise,
            paidPaise: value.paidPaise,
            duePaise: value.duePaise,
            lifecycle: value.lifecycle as "ISSUED" | "VOID",
            status: value.status as "UNPAID" | "PARTIAL" | "PAID" | "VOID",
            lineAmountsPaise: value.lines.map((line) => line.amountPaise ?? 0),
          })),
          receipts.map((value) => ({
            id: value._id.toString(),
            invoiceId: value.invoiceId.toString(),
            amountPaise: value.amountPaise,
            status: value.status as "POSTED" | "REVERSED",
          })),
          allocations.map((value) => ({
            id: value._id.toString(),
            invoiceId: value.invoiceId.toString(),
            receiptId: value.receiptId.toString(),
            amountPaise: value.amountPaise,
            reversed: value.reversedAt != null,
          })),
        );
      },
      { readConcern: { level: "snapshot" } },
    );
  } finally {
    await session.endSession();
  }
}
import mongoose from "mongoose";
