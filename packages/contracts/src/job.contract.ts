import { z } from "zod";
import {
  businessDateSchema,
  idSchema,
  moneyPaiseSchema,
  timestampSchema,
} from "./common";
import { pricingUnitSchema } from "./machinery.contract";

export const quantitySchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/)
  .refine((value) => /[1-9]/.test(value));
export const pricingModeSchema = z.enum([
  "DEFAULT_RATE",
  "CUSTOM_RATE",
  "CUSTOM_TOTAL",
]);
export const jobStateSchema = z.enum([
  "DRAFT",
  "COMPLETED",
  "BILLED",
  "CANCELLED",
]);
const lineFields = z.object({
  serviceId: idSchema,
  equipmentIds: z.array(idSchema),
  unit: pricingUnitSchema,
  quantity: quantitySchema,
  reason: z.string().optional(),
});
export const workLineSchema = z
  .discriminatedUnion("pricingMode", [
    lineFields.extend({ pricingMode: z.literal("DEFAULT_RATE") }).strict(),
    lineFields
      .extend({
        pricingMode: z.literal("CUSTOM_RATE"),
        agreedRatePaise: moneyPaiseSchema,
      })
      .strict(),
    lineFields
      .extend({
        pricingMode: z.literal("CUSTOM_TOTAL"),
        agreedTotalPaise: moneyPaiseSchema,
      })
      .strict(),
  ])
  .refine((line) => line.unit !== "TRIP" || /^\d+$/.test(line.quantity), {
    path: ["quantity"],
    message: "Trips require a whole number",
  });
export const jobLineSchema = lineFields.extend({
  lineId: idSchema,
  serviceNameSnapshot: z.string(),
  pricingMode: pricingModeSchema,
  defaultRateSnapshotPaise: moneyPaiseSchema,
  agreedRatePaise: moneyPaiseSchema.optional(),
  totalPaise: moneyPaiseSchema,
});
export const jobFarmerSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  village: z.string(),
});
export const jobServiceSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  unit: pricingUnitSchema,
  defaultRatePaise: moneyPaiseSchema,
  equipmentIds: z.array(idSchema),
});
export type JobFarmerSummary = z.infer<typeof jobFarmerSummarySchema>;
export type JobServiceSummary = z.infer<typeof jobServiceSummarySchema>;
const jobDetails = z.object({
  farmerId: idSchema,
  workDate: businessDateSchema,
  village: z.string().trim().min(1),
  fieldLocation: z.string().optional(),
  notes: z.string().optional(),
});
export const jobInputSchema = jobDetails
  .extend({
    state: z.enum(["DRAFT", "COMPLETED"]),
    lines: z.array(workLineSchema).min(1),
  })
  .strict();
export const jobSchema = jobDetails.extend({
  id: idSchema,
  state: jobStateSchema,
  lines: z.array(jobLineSchema),
  totalPaise: moneyPaiseSchema,
  invoiceId: idSchema.nullable(),
  completedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type WorkLine = z.infer<typeof workLineSchema>;
export type JobLine = z.infer<typeof jobLineSchema>;
export type JobInput = z.infer<typeof jobInputSchema>;
export type Job = z.infer<typeof jobSchema>;
