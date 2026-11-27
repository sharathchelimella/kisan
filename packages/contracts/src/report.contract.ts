import { z } from "zod";
import { businessDateSchema, idSchema, moneyPaiseSchema } from "./common";
import { periodSchema } from "./dashboard.contract";
import { paymentMethodSchema } from "./payment.contract";

export const reportPeriodSchema = periodSchema.safeExtend({
  groupBy: z.enum(["day", "week", "month"]),
});
export const revenuePointSchema = z.object({
  date: businessDateSchema,
  workValuePaise: moneyPaiseSchema,
  collectionsPaise: moneyPaiseSchema,
});
export const equipmentReportRowSchema = z.object({
  serviceId: idSchema,
  serviceName: z.string(),
  workValuePaise: moneyPaiseSchema,
  estimatedOutstandingPaise: moneyPaiseSchema,
});
export const collectionReportRowSchema = z.object({
  method: paymentMethodSchema,
  collectionsPaise: moneyPaiseSchema,
});
export type RevenuePoint = z.infer<typeof revenuePointSchema>;
export type EquipmentReportRow = z.infer<typeof equipmentReportRowSchema>;
export type CollectionReportRow = z.infer<typeof collectionReportRowSchema>;
