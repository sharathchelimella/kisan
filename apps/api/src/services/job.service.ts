import { randomUUID } from "node:crypto";
import { isValidObjectId } from "mongoose";
import {
  jobInputSchema,
  jobSchema,
  type Job,
  type JobInput,
  type JobLine,
  type JobFarmerSummary,
  type JobServiceSummary,
} from "@kisan/contracts";
import { multiplyRate, sumPaise } from "@kisan/domain";
import { JobModel } from "../models/Job.model";

export interface JobPorts {
  farmer(businessId: string, id: string): Promise<JobFarmerSummary | null>;
  service(businessId: string, id: string): Promise<JobServiceSummary | null>;
  save(
    businessId: string,
    actorId: string,
    job: Omit<Job, "id" | "createdAt" | "updatedAt">,
  ): Promise<Job>;
}
export class JobReferenceError extends Error {}
export class JobPricingError extends Error {}

export function createJobService(ports: JobPorts) {
  return async (businessId: string, actorId: string, raw: unknown) => {
    const input: JobInput = jobInputSchema.parse(raw);
    const farmer = await ports.farmer(businessId, input.farmerId);
    if (!farmer) throw new JobReferenceError("Farmer unavailable");
    const lines: JobLine[] = [];
    for (const requested of input.lines) {
      const service = await ports.service(businessId, requested.serviceId);
      if (
        !service ||
        service.unit !== requested.unit ||
        requested.equipmentIds.length !== service.equipmentIds.length ||
        requested.equipmentIds.some((id) => !service.equipmentIds.includes(id))
      ) {
        throw new JobReferenceError("Service or equipment unavailable");
      }
      if (requested.unit === "FIXED" && requested.quantity !== "1") {
        throw new JobPricingError("Fixed service quantity must be one");
      }
      const rate =
        requested.pricingMode === "CUSTOM_RATE"
          ? requested.agreedRatePaise
          : service.defaultRatePaise;
      const totalPaise =
        requested.pricingMode === "CUSTOM_TOTAL"
          ? requested.agreedTotalPaise
          : multiplyRate(requested.quantity, rate, requested.unit);
      lines.push({
        lineId: randomUUID(),
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        equipmentIds: [...service.equipmentIds],
        unit: service.unit,
        quantity: requested.quantity,
        ...(requested.operatingHours && {
          operatingHours: requested.operatingHours,
        }),
        pricingMode: requested.pricingMode,
        defaultRateSnapshotPaise: service.defaultRatePaise,
        ...(requested.pricingMode === "CUSTOM_RATE" && {
          agreedRatePaise: requested.agreedRatePaise,
        }),
        ...(requested.reason && { reason: requested.reason }),
        totalPaise,
      });
    }
    const now = new Date().toISOString();
    return ports.save(businessId, actorId, {
      farmerId: farmer.id,
      workDate: input.workDate,
      village: input.village,
      fieldLocation: input.fieldLocation,
      notes: input.notes,
      state: input.state,
      lines,
      totalPaise: sumPaise(lines.map((line) => line.totalPaise)),
      invoiceId: null,
      ...(input.state === "COMPLETED" && { completedAt: now }),
    });
  };
}

export const mongoJobPorts: JobPorts = {
  async farmer(businessId, id) {
    if (!isValidObjectId(id)) return null;
    const { FarmerModel } = await import("../models/Farmer.model");
    const record = await FarmerModel.findOne({
      _id: id,
      businessId,
      archivedAt: { $exists: false },
    }).lean();
    return (
      record && {
        id: record._id.toString(),
        name: record.name,
        village: record.village,
      }
    );
  },
  async service(businessId, id) {
    if (!isValidObjectId(id)) return null;
    const { ServiceModel } = await import("../models/Service.model");
    const record = await ServiceModel.findOne({
      _id: id,
      businessId,
      active: true,
    }).lean();
    if (record) {
      const { EquipmentModel } = await import("../models/Equipment.model");
      const available = await EquipmentModel.countDocuments({
        businessId,
        _id: { $in: record.equipmentIds },
        active: true,
        status: { $nin: ["INACTIVE", "MAINTENANCE"] },
      });
      if (available !== record.equipmentIds.length) return null;
    }
    return (
      record && {
        id: record._id.toString(),
        name: record.name,
        unit: record.unit as JobServiceSummary["unit"],
        defaultRatePaise: record.defaultRatePaise,
        equipmentIds: record.equipmentIds.map((value) => value.toString()),
      }
    );
  },
  async save(businessId, actorId, input) {
    const record = await JobModel.create({
      ...input,
      businessId,
      createdBy: actorId,
    });
    return jobSchema.parse({
      ...input,
      id: record._id.toString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  },
};
