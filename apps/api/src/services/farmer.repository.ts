import { isValidObjectId } from "mongoose";
import {
  farmerSchema,
  normalizeFarmerPhone,
  normalizeFarmerText,
  type Farmer,
  type FarmerInput,
  type FarmerPatch,
  type FarmerQuery,
  type FarmerMatches,
  type FarmerPage,
  type FarmerSummary,
} from "@kisan/contracts";
import { FarmerModel } from "../models/Farmer.model";
import { JobModel } from "../models/Job.model";
import { InvoiceModel } from "../models/Invoice.model";

export interface FarmerRepository {
  list(businessId: string, query: FarmerQuery): Promise<FarmerPage>;
  summary(businessId: string): Promise<FarmerSummary>;
  get(businessId: string, id: string): Promise<Farmer | null>;
  create(businessId: string, input: FarmerInput): Promise<Farmer>;
  update(
    businessId: string,
    id: string,
    input: FarmerPatch,
  ): Promise<Farmer | null>;
  archive(businessId: string, id: string): Promise<Farmer | null>;
  delete?(businessId: string, id: string): Promise<{ success: boolean }>;
  matches(businessId: string, input: FarmerMatches): Promise<Farmer[]>;
}

function literal(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function fields(input: FarmerPatch) {
  return {
    ...input,
    ...(input.name !== undefined && {
      normalizedName: normalizeFarmerText(input.name),
    }),
    ...(input.village !== undefined && {
      normalizedVillage: normalizeFarmerText(input.village),
    }),
    ...(input.mobile !== undefined && {
      normalizedMobile: normalizeFarmerPhone(input.mobile),
    }),
  };
}
type RecordDto = {
  name: string;
  village: string;
  mobile?: string | null;
  notes?: string | null;
  _id: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date | null;
};
function dto(record: RecordDto): Farmer {
  return farmerSchema.parse({
    name: record.name,
    village: record.village,
    mobile: record.mobile ?? undefined,
    notes: record.notes ?? undefined,
    id: record._id.toString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    archivedAt: record.archivedAt?.toISOString(),
  });
}

export const mongoFarmers: FarmerRepository = {
  async list(businessId, query) {
    const search = literal(normalizeFarmerText(query.q ?? ""));
    const phone = normalizeFarmerPhone(query.q);
    const filter = {
      businessId,
      archivedAt: { $exists: query.archived === "true" },
      ...(query.village && {
        normalizedVillage: normalizeFarmerText(query.village),
      }),
      ...(search && {
        $or: [
          { normalizedName: { $regex: search } },
          { normalizedVillage: { $regex: search } },
          ...(phone && /^\d+$/.test(phone)
            ? [{ normalizedMobile: { $regex: literal(phone) } }]
            : []),
        ],
      }),
    };
    const [records, total] = await Promise.all([
      FarmerModel.find(filter)
        .sort({ normalizedName: 1, _id: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      FarmerModel.countDocuments(filter),
    ]);

    const farmerIds = records.map((r) => r._id);
    const [jobs, invoices] = await Promise.all([
      JobModel.find({
        businessId,
        farmerId: { $in: farmerIds },
        state: { $ne: "CANCELLED" },
      })
        .select("farmerId")
        .lean(),
      InvoiceModel.find({
        businessId,
        farmerId: { $in: farmerIds },
        lifecycle: "ISSUED",
      })
        .select("farmerId totalPaise paidPaise duePaise")
        .lean(),
    ]);

    const jobCountMap = new Map<string, number>();
    for (const j of jobs) {
      const fid = j.farmerId.toString();
      jobCountMap.set(fid, (jobCountMap.get(fid) ?? 0) + 1);
    }

    const finMap = new Map<string, { total: number; paid: number; due: number }>();
    for (const inv of invoices) {
      const fid = inv.farmerId.toString();
      const prev = finMap.get(fid) ?? { total: 0, paid: 0, due: 0 };
      finMap.set(fid, {
        total: prev.total + (inv.totalPaise || 0),
        paid: prev.paid + (inv.paidPaise || 0),
        due: prev.due + (inv.duePaise || 0),
      });
    }

    const items = records.map((rec) => {
      const d = dto(rec);
      const fid = rec._id.toString();
      const fin = finMap.get(fid);
      d.totalWorks = jobCountMap.get(fid) ?? 0;
      d.totalAmountPaise = fin?.total ?? 0;
      d.paidAmountPaise = fin?.paid ?? 0;
      d.pendingAmountPaise = fin?.due ?? 0;
      d.status = rec.archivedAt ? "ARCHIVED" : "ACTIVE";
      return d;
    });

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async summary(businessId) {
    const [totalFarmers, jobsCount, invoices, villages] = await Promise.all([
      FarmerModel.countDocuments({
        businessId,
        archivedAt: { $exists: false },
      }),
      JobModel.countDocuments({ businessId, state: { $ne: "CANCELLED" } }),
      InvoiceModel.aggregate([
        { $match: { businessId, lifecycle: "ISSUED" } },
        {
          $group: {
            _id: null,
            totalAmountPaise: { $sum: "$totalPaise" },
            pendingAmountPaise: { $sum: "$duePaise" },
          },
        },
      ]),
      FarmerModel.distinct("village", {
        businessId,
        archivedAt: { $exists: false },
      }),
    ]);

    const agg = invoices[0] || { totalAmountPaise: 0, pendingAmountPaise: 0 };
    return {
      totalFarmers,
      totalWorkCount: jobsCount,
      totalAmountPaise: agg.totalAmountPaise,
      pendingAmountPaise: agg.pendingAmountPaise,
      villages: (villages as string[]).filter(Boolean).sort(),
    };
  },
  async delete(businessId, id) {
    if (!isValidObjectId(id)) return { success: false };
    const [hasJobs, hasInvoices] = await Promise.all([
      JobModel.exists({ businessId, farmerId: id }),
      InvoiceModel.exists({ businessId, farmerId: id }),
    ]);
    if (hasJobs || hasInvoices) {
      await FarmerModel.updateOne(
        { businessId, _id: id },
        { $set: { archivedAt: new Date() } },
      );
      return { success: true };
    }
    await FarmerModel.deleteOne({ businessId, _id: id });
    return { success: true };
  },
  async get(businessId, id) {
    if (!isValidObjectId(id)) return null;
    const record = await FarmerModel.findOne({ businessId, _id: id }).lean();
    return record && dto(record);
  },
  async create(businessId, input) {
    return dto(
      (await FarmerModel.create({ ...fields(input), businessId })).toObject(),
    );
  },
  async update(businessId, id, input) {
    if (!isValidObjectId(id)) return null;
    const record = await FarmerModel.findOneAndUpdate(
      { businessId, _id: id, archivedAt: { $exists: false } },
      { $set: fields(input) },
      { new: true, runValidators: true },
    ).lean();
    return record && dto(record);
  },
  async archive(businessId, id) {
    if (!isValidObjectId(id)) return null;
    const record = await FarmerModel.findOneAndUpdate(
      { businessId, _id: id, archivedAt: { $exists: false } },
      { $set: { archivedAt: new Date() } },
      { new: true },
    ).lean();
    return record ? dto(record) : this.get(businessId, id);
  },
  async matches(businessId, input) {
    const phone = normalizeFarmerPhone(input.mobile);
    const records = await FarmerModel.find({
      businessId,
      ...(input.excludeId &&
        isValidObjectId(input.excludeId) && { _id: { $ne: input.excludeId } }),
      $or: [
        {
          normalizedName: normalizeFarmerText(input.name),
          normalizedVillage: normalizeFarmerText(input.village),
        },
        ...(phone ? [{ normalizedMobile: phone }] : []),
      ],
    })
      .sort({ _id: 1 })
      .limit(10)
      .lean();
    return records.map(dto);
  },
};
