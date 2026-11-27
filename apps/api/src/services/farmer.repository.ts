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
} from "@kisan/contracts";
import { FarmerModel } from "../models/Farmer.model";

export interface FarmerRepository {
  list(businessId: string, query: FarmerQuery): Promise<FarmerPage>;
  get(businessId: string, id: string): Promise<Farmer | null>;
  create(businessId: string, input: FarmerInput): Promise<Farmer>;
  update(
    businessId: string,
    id: string,
    input: FarmerPatch,
  ): Promise<Farmer | null>;
  archive(businessId: string, id: string): Promise<Farmer | null>;
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
    return {
      items: records.map(dto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
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
