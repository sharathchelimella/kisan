import mongoose, { isValidObjectId } from "mongoose";
import { invoiceSchema, type Invoice } from "@kisan/contracts";
import { Business } from "../models/Business.model";
import { FarmerModel } from "../models/Farmer.model";
import { User } from "../models/User.model";
import { JobModel } from "../models/Job.model";
import { InvoiceModel } from "../models/Invoice.model";
import { InvoiceConflict, type InvoiceRepository } from "./invoice.service";

function dto(value: unknown): Invoice {
  const record = value as Record<string, unknown> & {
    _id: { toString(): string };
    jobId: { toString(): string };
    farmerId?: { toString(): string };
    issuedAt: Date;
    lines: {
      serviceId: { toString(): string };
      equipmentIds?: { toString(): string }[];
    }[];
  };
  return invoiceSchema.parse({
    ...record,
    id: record._id.toString(),
    jobId: record.jobId.toString(),
    farmerId: record.farmerId?.toString(),
    issuedAt: record.issuedAt.toISOString(),
    lines: record.lines.map((line) => ({
      ...line,
      serviceId: line.serviceId.toString(),
      equipmentIds: line.equipmentIds?.map((id) => id.toString()) ?? [],
    })),
  });
}
function literal(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export const mongoInvoices: InvoiceRepository = {
  async existing(businessId, jobId) {
    if (!isValidObjectId(jobId)) return null;
    const value = await InvoiceModel.findOne({ businessId, jobId }).lean();
    return value ? dto(value) : null;
  },
  async acceptedJob(businessId, jobId) {
    if (!isValidObjectId(jobId)) return null;
    const job = await JobModel.findOne({
      businessId,
      _id: jobId,
      state: "COMPLETED",
      invoiceId: null,
    }).lean();
    if (!job) return null;
    const [farmer, business] = await Promise.all([
      FarmerModel.findOne({ businessId, _id: job.farmerId }).lean(),
      Business.findById(businessId).lean(),
    ]);
    if (!farmer || !business) return null;
    const owner = await User.findOne({
      businessId,
      _id: business.ownerUserId,
    }).lean();
    if (!owner) return null;
    return {
      id: job._id.toString(),
      farmerId: job.farmerId.toString(),
      workDate: job.workDate,
      state: "COMPLETED",
      invoiceId: null,
      totalPaise: job.totalPaise,
      farmer: {
        name: farmer.name,
        ...(farmer.mobile && { mobile: farmer.mobile }),
        village: farmer.village,
      },
      owner: {
        name: business.name,
        address: business.address ?? business.village,
        ...(business.phone && { phone: business.phone }),
      },
      lines: job.lines.map((line) => ({
        lineId: line.lineId,
        serviceId: line.serviceId.toString(),
        equipmentIds: line.equipmentIds.map((id) => id.toString()),
        serviceNameSnapshot: line.serviceNameSnapshot,
        unit: line.unit as Invoice["lines"][number]["unit"],
        quantity: line.quantity,
        defaultRateSnapshotPaise: line.defaultRateSnapshotPaise,
        ...(line.agreedRatePaise != null && {
          agreedRatePaise: line.agreedRatePaise,
        }),
        totalPaise: line.totalPaise,
      })),
    };
  },
  async issueAtomic(businessId, job) {
    const session = await mongoose.startSession();
    try {
      let result: Invoice | null = null;
      await session.withTransaction(async () => {
        const existing = await InvoiceModel.findOne({
          businessId,
          jobId: job.id,
        })
          .session(session)
          .lean();
        if (existing) {
          result = dto(existing);
          return;
        }
        const work = await JobModel.findOne({
          businessId,
          _id: job.id,
          state: "COMPLETED",
          invoiceId: null,
        })
          .session(session)
          .lean();
        if (!work || work.totalPaise !== job.totalPaise)
          throw new InvoiceConflict("Work changed before issuance");
        const business = await Business.findOneAndUpdate(
          { _id: businessId },
          { $inc: { nextInvoiceSequence: 1 } },
          { new: false, session },
        ).lean();
        if (!business) throw new InvoiceConflict("Business unavailable");
        const sequence = business.nextInvoiceSequence;
        const invoiceNumber = `${business.invoicePrefix}-${String(sequence).padStart(6, "0")}`;
        const [created] = await InvoiceModel.create(
          [
            {
              businessId,
              jobId: job.id,
              farmerId: job.farmerId,
              invoiceNumber,
              sequence,
              lifecycle: "ISSUED",
              issuedAt: new Date(),
              workDate: job.workDate,
              farmerSnapshot: job.farmer,
              ownerSnapshot: job.owner,
              lines: job.lines.map((line) => ({
                lineId: line.lineId,
                serviceId: line.serviceId,
                equipmentIds: line.equipmentIds,
                serviceName: line.serviceNameSnapshot,
                unit: line.unit,
                quantity: line.quantity,
                ratePaise:
                  line.agreedRatePaise ?? line.defaultRateSnapshotPaise,
                amountPaise: line.totalPaise,
              })),
              totalPaise: job.totalPaise,
              paidPaise: 0,
              duePaise: job.totalPaise,
              status: "UNPAID",
              version: 1,
            },
          ],
          { session },
        );
        const updated = await JobModel.updateOne(
          { businessId, _id: job.id, state: "COMPLETED", invoiceId: null },
          { $set: { state: "BILLED", invoiceId: created._id } },
          { session },
        );
        if (updated.modifiedCount !== 1)
          throw new InvoiceConflict("Work changed before issuance");
        result = dto(created.toObject());
      });
      if (!result) throw new InvoiceConflict("Invoice was not created");
      return result;
    } catch (error) {
      const existing = await this.existing(businessId, job.id);
      if (existing) return existing;
      throw error;
    } finally {
      await session.endSession();
    }
  },
  async list(businessId, query) {
    const filter: Record<string, unknown> = {
      businessId,
      ...(query.status && { status: query.status }),
      ...(query.from || query.to
        ? {
            workDate: {
              ...(query.from && { $gte: query.from }),
              ...(query.to && { $lte: query.to }),
            },
          }
        : {}),
      ...(query.q && {
        $or: [
          { invoiceNumber: { $regex: literal(query.q), $options: "i" } },
          {
            "farmerSnapshot.name": { $regex: literal(query.q), $options: "i" },
          },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      InvoiceModel.find(filter)
        .sort({ sequence: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      InvoiceModel.countDocuments(filter),
    ]);
    return {
      items: items.map(dto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async get(businessId, id) {
    if (!isValidObjectId(id)) return null;
    const value = await InvoiceModel.findOne({ businessId, _id: id }).lean();
    return value ? dto(value) : null;
  },
  async void(businessId, id, reason) {
    if (!isValidObjectId(id)) return null;
    const value = await InvoiceModel.findOneAndUpdate(
      { businessId, _id: id, lifecycle: "ISSUED", paidPaise: 0 },
      {
        $set: { lifecycle: "VOID", status: "VOID", voidReason: reason },
        $inc: { version: 1 },
      },
      { new: true },
    ).lean();
    return value ? dto(value) : null;
  },
};
