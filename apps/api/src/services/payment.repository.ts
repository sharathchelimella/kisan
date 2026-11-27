import mongoose, { isValidObjectId } from "mongoose";
import {
  invoiceBalanceSchema,
  receiptSchema,
  type Invoice,
  type Receipt,
  type InvoiceBalance,
} from "@kisan/contracts";
import { InvoiceModel } from "../models/Invoice.model";
import { ReceiptModel } from "../models/Receipt.model";
import { AllocationModel } from "../models/Allocation.model";
import { equipmentDue } from "@kisan/domain";
import {
  PaymentConflict,
  PaymentUnavailable,
  type PaymentRepository,
} from "./payment.service";

function balance(value: {
  _id: { toString(): string };
  invoiceNumber: string;
  totalPaise: number;
  paidPaise: number;
  duePaise: number;
  status: string;
}): InvoiceBalance {
  return invoiceBalanceSchema.parse({
    invoiceId: value._id.toString(),
    invoiceNumber: value.invoiceNumber,
    totalPaise: value.totalPaise,
    paidPaise: value.paidPaise,
    duePaise: value.duePaise,
    status: value.status,
  });
}
function receipt(value: {
  _id: { toString(): string };
  invoiceId: { toString(): string };
  farmerId: { toString(): string };
  amountPaise: number;
  method: string;
  paymentDate: string;
  note?: string | null;
  reference?: string | null;
  status: string;
  reversalReason?: string | null;
  reversedAt?: Date | null;
  createdAt: Date;
}): Receipt {
  return receiptSchema.parse({
    id: value._id.toString(),
    invoiceId: value.invoiceId.toString(),
    farmerId: value.farmerId.toString(),
    amountPaise: value.amountPaise,
    method: value.method,
    paymentDate: value.paymentDate,
    note: value.note ?? undefined,
    reference: value.reference ?? undefined,
    status: value.status,
    reversalReason: value.reversalReason ?? undefined,
    reversedAt: value.reversedAt?.toISOString(),
    createdAt: value.createdAt.toISOString(),
  });
}
function literal(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export const mongoPayments: PaymentRepository = {
  async existing(businessId, key) {
    const found = await ReceiptModel.findOne({
      businessId,
      idempotencyKey: key,
    }).lean();
    if (!found) return null;
    const invoice = await InvoiceModel.findOne({
      businessId,
      _id: found.invoiceId,
    }).lean();
    if (!invoice) throw new PaymentUnavailable("Invoice unavailable");
    return {
      fingerprint: found.requestFingerprint,
      result: { receipt: receipt(found), invoice: balance(invoice) },
    };
  },
  async postAtomic(businessId, actorId, key, fingerprint, input) {
    const session = await mongoose.startSession();
    try {
      let result: { receipt: Receipt; invoice: InvoiceBalance } | null = null;
      await session.withTransaction(async () => {
        const previous = await ReceiptModel.findOne({
          businessId,
          idempotencyKey: key,
        })
          .session(session)
          .lean();
        if (previous) {
          if (previous.requestFingerprint !== fingerprint)
            throw new PaymentConflict(
              "Idempotency key reused with different payment",
            );
          const invoice = await InvoiceModel.findOne({
            businessId,
            _id: previous.invoiceId,
          })
            .session(session)
            .lean();
          if (!invoice) throw new PaymentUnavailable("Invoice unavailable");
          result = { receipt: receipt(previous), invoice: balance(invoice) };
          return;
        }
        const invoice = await InvoiceModel.findOneAndUpdate(
          {
            businessId,
            _id: input.invoiceId,
            lifecycle: "ISSUED",
            duePaise: { $gte: input.amountPaise },
            farmerId: { $exists: true },
          },
          [
            {
              $set: {
                paidPaise: { $add: ["$paidPaise", input.amountPaise] },
                duePaise: { $subtract: ["$duePaise", input.amountPaise] },
                status: {
                  $cond: [
                    { $eq: ["$duePaise", input.amountPaise] },
                    "PAID",
                    "PARTIAL",
                  ],
                },
              },
            },
          ],
          { new: true, session },
        ).lean();
        if (!invoice)
          throw new PaymentConflict(
            "Invoice unavailable or amount exceeds due",
          );
        const [created] = await ReceiptModel.create(
          [
            {
              businessId,
              invoiceId: invoice._id,
              farmerId: invoice.farmerId,
              amountPaise: input.amountPaise,
              method: input.method,
              paymentDate: input.paymentDate,
              note: input.note,
              reference: input.reference,
              status: "POSTED",
              idempotencyKey: key,
              requestFingerprint: fingerprint,
              createdBy: actorId,
            },
          ],
          { session },
        );
        await AllocationModel.create(
          [
            {
              businessId,
              invoiceId: invoice._id,
              receiptId: created._id,
              amountPaise: input.amountPaise,
            },
          ],
          { session },
        );
        result = { receipt: receipt(created), invoice: balance(invoice) };
      });
      if (!result) throw new PaymentConflict("Payment not posted");
      return result;
    } catch (error) {
      const previous = await this.existing(businessId, key);
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new PaymentConflict(
            "Idempotency key reused with different payment",
          );
        return previous.result;
      }
      throw error;
    } finally {
      await session.endSession();
    }
  },
  async reverseAtomic(businessId, actorId, id, reason) {
    if (!isValidObjectId(id)) return null;
    const session = await mongoose.startSession();
    try {
      let result: { receipt: Receipt; invoice: InvoiceBalance } | null = null;
      await session.withTransaction(async () => {
        const original = await ReceiptModel.findOneAndUpdate(
          { businessId, _id: id, status: "POSTED" },
          {
            $set: {
              status: "REVERSED",
              reversalReason: reason,
              reversedAt: new Date(),
              reversedBy: actorId,
            },
          },
          { new: true, session },
        ).lean();
        if (!original) return;
        await AllocationModel.updateOne(
          { businessId, receiptId: id, reversedAt: { $exists: false } },
          { $set: { reversedAt: new Date() } },
          { session },
        );
        const invoice = await InvoiceModel.findOneAndUpdate(
          {
            businessId,
            _id: original.invoiceId,
            lifecycle: "ISSUED",
            paidPaise: { $gte: original.amountPaise },
          },
          [
            {
              $set: {
                paidPaise: { $subtract: ["$paidPaise", original.amountPaise] },
                duePaise: { $add: ["$duePaise", original.amountPaise] },
                status: {
                  $cond: [
                    { $eq: ["$paidPaise", original.amountPaise] },
                    "UNPAID",
                    "PARTIAL",
                  ],
                },
              },
            },
          ],
          { new: true, session },
        ).lean();
        if (!invoice) throw new PaymentConflict("Invoice balance unavailable");
        result = { receipt: receipt(original), invoice: balance(invoice) };
      });
      return result;
    } finally {
      await session.endSession();
    }
  },
  async receipts(businessId, query) {
    if (query.farmerId && !isValidObjectId(query.farmerId))
      return {
        items: [],
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
      };
    const filter: Record<string, unknown> = {
      businessId,
      ...(query.farmerId && { farmerId: query.farmerId }),
      ...(query.from || query.to
        ? {
            paymentDate: {
              ...(query.from && { $gte: query.from }),
              ...(query.to && { $lte: query.to }),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      ReceiptModel.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      ReceiptModel.countDocuments(filter),
    ]);
    return {
      items: items.map(receipt),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async dues(businessId, query) {
    if (
      (query.farmerId && !isValidObjectId(query.farmerId)) ||
      (query.equipmentId && !isValidObjectId(query.equipmentId))
    )
      return {
        items: [],
        total: 0,
        totalDuePaise: 0,
        page: query.page,
        pageSize: query.pageSize,
      };
    const filter: Record<string, unknown> = {
      businessId,
      lifecycle: "ISSUED",
      ...(query.status && { status: query.status }),
      ...(query.farmerId && { farmerId: query.farmerId }),
      ...(query.from || query.to
        ? {
            workDate: {
              ...(query.from && { $gte: query.from }),
              ...(query.to && { $lte: query.to }),
            },
          }
        : {}),
      ...(query.equipmentId && { "lines.equipmentIds": query.equipmentId }),
      ...(query.q && {
        $or: [
          { invoiceNumber: { $regex: literal(query.q), $options: "i" } },
          {
            "farmerSnapshot.name": { $regex: literal(query.q), $options: "i" },
          },
        ],
      }),
    };
    const all = await InvoiceModel.find(filter).sort({ sequence: -1 }).lean();
    const items = all
      .map((value) => {
        const estimatedEquipmentDuePaise = query.equipmentId
          ? equipmentDue(
              {
                lifecycle: value.lifecycle as Invoice["lifecycle"],
                duePaise: value.duePaise,
                totalPaise: value.totalPaise,
                lines: value.lines.map((line) => ({
                  lineId: line.lineId ?? "",
                  serviceId: line.serviceId?.toString() ?? "",
                  serviceName: line.serviceName ?? "",
                  unit: line.unit as Invoice["lines"][number]["unit"],
                  quantity: line.quantity ?? "1",
                  amountPaise: line.amountPaise ?? 0,
                  equipmentIds:
                    line.equipmentIds?.map((id) => id.toString()) ?? [],
                })),
              },
              query.equipmentId,
            )
          : undefined;
        return {
          ...balance(value),
          farmerId: value.farmerId?.toString() ?? "",
          farmerName: value.farmerSnapshot?.name ?? "",
          village: value.farmerSnapshot?.village ?? "",
          workDate: value.workDate,
          ...(estimatedEquipmentDuePaise !== undefined && {
            estimatedEquipmentDuePaise,
          }),
        };
      })
      .filter(
        (value) => !query.equipmentId || value.estimatedEquipmentDuePaise! > 0,
      );
    return {
      items: items.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize,
      ),
      total: items.length,
      page: query.page,
      pageSize: query.pageSize,
      totalDuePaise: items.reduce(
        (sum, item) =>
          sum +
          (query.equipmentId
            ? item.estimatedEquipmentDuePaise!
            : item.duePaise),
        0,
      ),
    };
  },
};
