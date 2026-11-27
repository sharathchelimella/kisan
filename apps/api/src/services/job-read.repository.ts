import { isValidObjectId } from "mongoose";
import {
  jobRecordSchema,
  jobSummarySchema,
  type JobPage,
  type JobQuery,
  type JobRecord,
} from "@kisan/contracts";
import { JobModel } from "../models/Job.model";
import { FarmerModel } from "../models/Farmer.model";

export interface JobReadRepository {
  list(businessId: string, query: JobQuery): Promise<JobPage>;
  get(businessId: string, id: string): Promise<JobRecord | null>;
  cancel(
    businessId: string,
    id: string,
    actorId: string,
    reason: string,
  ): Promise<JobRecord | null>;
}
function escape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
type DatabaseJob = {
  _id: { toString(): string };
  farmerId: { toString(): string };
  invoiceId?: { toString(): string } | null;
  lines: {
    serviceId: { toString(): string };
    equipmentIds: { toString(): string }[];
    serviceNameSnapshot: string;
  }[];
  revisions?: { actorId: { toString(): string }; at: Date }[];
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
function recordDto(value: DatabaseJob): JobRecord {
  return jobRecordSchema.parse({
    ...value,
    id: value._id.toString(),
    farmerId: value.farmerId.toString(),
    invoiceId: value.invoiceId?.toString() ?? null,
    lines: value.lines.map((line) => ({
      ...line,
      serviceId: line.serviceId.toString(),
      equipmentIds: line.equipmentIds.map((id) => id.toString()),
    })),
    revisions: (value.revisions ?? []).map((entry) => ({
      ...entry,
      actorId: entry.actorId.toString(),
      at: entry.at.toISOString(),
    })),
    completedAt: value.completedAt?.toISOString(),
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  });
}
export const mongoJobReads: JobReadRepository = {
  async list(businessId, query) {
    const search = query.q?.trim();
    const farmerIds = search
      ? await FarmerModel.find({
          businessId,
          name: { $regex: escape(search), $options: "i" },
        }).distinct("_id")
      : [];
    const filter: Record<string, unknown> = {
      businessId,
      ...(query.farmerId && { farmerId: query.farmerId }),
      ...(query.from || query.to
        ? {
            workDate: {
              ...(query.from && { $gte: query.from }),
              ...(query.to && { $lte: query.to }),
            },
          }
        : {}),
      ...(query.village && {
        village: { $regex: escape(query.village), $options: "i" },
      }),
      ...(query.serviceId && { "lines.serviceId": query.serviceId }),
      ...(query.equipmentId && { "lines.equipmentIds": query.equipmentId }),
      ...(query.state && { state: query.state }),
      ...(search && {
        $or: [
          { village: { $regex: escape(search), $options: "i" } },
          { farmerId: { $in: farmerIds } },
          ...(isValidObjectId(search) ? [{ _id: search }] : []),
        ],
      }),
    };
    const [jobs, total] = await Promise.all([
      JobModel.find(filter)
        .sort({
          workDate: query.sort === "oldest" ? 1 : -1,
          _id: query.sort === "oldest" ? 1 : -1,
        })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      JobModel.countDocuments(filter),
    ]);
    const names = await FarmerModel.find({
      businessId,
      _id: { $in: jobs.map((job) => job.farmerId) },
    })
      .select("name")
      .lean();
    const farmerNames = new Map(
      names.map((value) => [value._id.toString(), value.name]),
    );
    return {
      items: jobs.map((value) =>
        jobSummarySchema.parse({
          ...recordDto(value),
          farmerName: farmerNames.get(value.farmerId.toString()) ?? "—",
          services: value.lines.map((line) => line.serviceNameSnapshot),
        }),
      ),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async get(businessId, id) {
    if (!isValidObjectId(id)) return null;
    const value = await JobModel.findOne({ businessId, _id: id }).lean();
    return value ? recordDto(value) : null;
  },
  async cancel(businessId, id, actorId, reason) {
    if (!isValidObjectId(id)) return null;
    const value = await JobModel.findOneAndUpdate(
      {
        businessId,
        _id: id,
        state: { $in: ["DRAFT", "COMPLETED"] },
        invoiceId: null,
      },
      {
        $set: { state: "CANCELLED" },
        $push: {
          revisions: { action: "CANCELLED", reason, actorId, at: new Date() },
        },
      },
      { new: true },
    ).lean();
    return value ? recordDto(value) : null;
  },
};
