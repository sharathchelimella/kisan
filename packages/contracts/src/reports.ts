import { z } from "zod";
import { businessDateSchema, idSchema, moneyPaiseSchema } from "./common";
import {
  reportPeriodSchema,
  revenuePointSchema,
  equipmentReportRowSchema,
  collectionReportRowSchema,
} from "./report.contract";

export const reportQuerySchema = reportPeriodSchema
  .safeExtend({
    farmerId: idSchema.optional(),
    equipmentId: idSchema.optional(),
    serviceId: idSchema.optional(),
    asOf: businessDateSchema,
  })
  .refine(
    (value) =>
      (Date.parse(value.to) - Date.parse(value.from)) / 86_400_000 <= 366 * 5,
    { path: ["to"], message: "Report range cannot exceed five years" },
  );
export const reportSummarySchema = z.object({
  workValuePaise: moneyPaiseSchema,
  collectionsPaise: moneyPaiseSchema,
  outstandingPaise: moneyPaiseSchema,
  workCount: z.number().int().nonnegative(),
});
export const reportServiceRowSchema = equipmentReportRowSchema.extend({
  workCount: z.number().int().nonnegative(),
});
export const reportEquipmentRowSchema = z.object({
  equipmentId: idSchema,
  equipmentName: z.string().optional(),
  workValuePaise: moneyPaiseSchema,
  collectionsPaise: moneyPaiseSchema,
  estimatedOutstandingPaise: moneyPaiseSchema,
});
export const reportSchema = z.object({
  query: reportQuerySchema,
  summary: reportSummarySchema,
  series: z.array(revenuePointSchema),
  services: z.array(reportServiceRowSchema),
  equipment: z.array(reportEquipmentRowSchema),
  collectionsByMethod: z.array(collectionReportRowSchema),
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;
export type Report = z.infer<typeof reportSchema>;
