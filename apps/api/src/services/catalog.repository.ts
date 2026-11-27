import { isValidObjectId, Types } from "mongoose";
import type {
  CatalogQuery,
  Equipment,
  EquipmentInput,
  EquipmentPatch,
  Service,
  ServiceInput,
  ServicePatch,
  PageResult,
} from "@kisan/contracts";
import { EquipmentModel } from "../models/Equipment.model";
import { ServiceModel } from "../models/Service.model";

export interface CatalogRepository {
  equipmentList(
    businessId: string,
    query: CatalogQuery,
  ): Promise<PageResult<Equipment>>;
  serviceList(
    businessId: string,
    query: CatalogQuery,
  ): Promise<PageResult<Service>>;
  equipmentCreate(
    businessId: string,
    input: EquipmentInput,
  ): Promise<Equipment>;
  equipmentUpdate(
    businessId: string,
    id: string,
    input: EquipmentPatch,
  ): Promise<Equipment | null>;
  equipmentExist(businessId: string, ids: string[]): Promise<boolean>;
  serviceCreate(businessId: string, input: ServiceInput): Promise<Service>;
  serviceUpdate(
    businessId: string,
    id: string,
    input: ServicePatch,
    actorId: string,
  ): Promise<Service | null>;
}
function filter(businessId: string, query: CatalogQuery) {
  return {
    businessId,
    ...(query.active !== "all" && { active: query.active === "true" }),
  };
}
function equipmentDto(record: {
  _id: Types.ObjectId;
  name: string;
  kind: string;
  active: boolean;
  displayIcon?: string | null;
  serialOrRegistration?: string | null;
}): Equipment {
  return {
    id: record._id.toHexString(),
    name: record.name,
    kind: record.kind,
    active: record.active,
    displayIcon: record.displayIcon ?? undefined,
    serialOrRegistration: record.serialOrRegistration ?? undefined,
  };
}
function serviceDto(record: {
  _id: Types.ObjectId;
  name: string;
  unit: Service["unit"];
  active: boolean;
  defaultRatePaise: number;
  equipmentIds: Types.ObjectId[];
}): Service {
  return {
    id: record._id.toHexString(),
    name: record.name,
    unit: record.unit,
    active: record.active,
    defaultRatePaise: record.defaultRatePaise,
    equipmentIds: record.equipmentIds.map((id) => id.toHexString()),
  };
}
export const mongoCatalog: CatalogRepository = {
  async equipmentList(businessId, query) {
    const match = filter(businessId, query);
    const [items, total] = await Promise.all([
      EquipmentModel.find(match)
        .sort({ name: 1, _id: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      EquipmentModel.countDocuments(match),
    ]);
    return {
      items: items.map(equipmentDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async serviceList(businessId, query) {
    const match = filter(businessId, query);
    const [items, total] = await Promise.all([
      ServiceModel.find(match)
        .sort({ name: 1, _id: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      ServiceModel.countDocuments(match),
    ]);
    return {
      items: items.map(serviceDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async equipmentCreate(businessId, input) {
    return equipmentDto(await EquipmentModel.create({ ...input, businessId }));
  },
  async equipmentUpdate(businessId, id, input) {
    if (!isValidObjectId(id)) return null;
    const record = await EquipmentModel.findOneAndUpdate(
      { businessId, _id: id },
      { $set: input },
      { new: true, runValidators: true },
    ).lean();
    return record && equipmentDto(record);
  },
  async equipmentExist(businessId, ids) {
    if (!ids.every(isValidObjectId)) return false;
    return (
      (await EquipmentModel.countDocuments({
        businessId,
        _id: { $in: ids },
      })) === ids.length
    );
  },
  async serviceCreate(businessId, input) {
    return serviceDto(await ServiceModel.create({ ...input, businessId }));
  },
  async serviceUpdate(businessId, id, input, actorId) {
    if (!isValidObjectId(id)) return null;
    const updates = Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        {
          $literal:
            key === "equipmentIds"
              ? (value as string[]).map((id) => new Types.ObjectId(id))
              : value,
        },
      ]),
    );
    const record = await ServiceModel.findOneAndUpdate(
      { businessId, _id: id },
      [
        {
          $set: {
            rateHistory: {
              $cond: [
                {
                  $or: [
                    {
                      $ne: [
                        "$defaultRatePaise",
                        input.defaultRatePaise ?? "$defaultRatePaise",
                      ],
                    },
                    { $ne: ["$unit", input.unit ?? "$unit"] },
                  ],
                },
                {
                  $concatArrays: [
                    { $ifNull: ["$rateHistory", []] },
                    [
                      {
                        defaultRatePaise: "$defaultRatePaise",
                        unit: "$unit",
                        changedAt: "$$NOW",
                        actorId: { $literal: actorId },
                      },
                    ],
                  ],
                },
                { $ifNull: ["$rateHistory", []] },
              ],
            },
            ...updates,
            updatedAt: "$$NOW",
          },
        },
      ],
      { new: true },
    ).lean();
    return record && serviceDto(record);
  },
};
