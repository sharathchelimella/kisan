import { z } from "zod";
import { idSchema, moneyPaiseSchema } from "./common";

export const pricingUnitSchema = z.enum(["HOUR", "ACRE", "TRIP", "FIXED"]);
export const equipmentInputSchema = z
  .object({
    name: z.string().trim().min(1),
    kind: z.string().min(1),
    displayIcon: z.string().optional(),
    serialOrRegistration: z.string().optional(),
    serialNumber: z.string().optional(),
    active: z.boolean(),
    brand: z.string().optional(),
    model: z.string().optional(),
    purchaseDate: z.string().optional(),
    purchaseCostPaise: moneyPaiseSchema.optional(),
    status: z
      .enum(["ACTIVE", "AVAILABLE", "MAINTENANCE", "INACTIVE"])
      .optional(),
    notes: z.string().optional(),
    lastServiceDate: z.string().optional(),
    nextMaintenanceDate: z.string().optional(),
    horsepower: z.number().positive().optional(),
    driveType: z.string().optional(),
    implementSize: z.string().optional(),
    capacity: z.string().optional(),
    photoDataUrl: z.string().optional(),
    availabilityRecords: z
      .array(
        z.object({
          from: z.string(),
          to: z.string(),
          hours: z.number().nonnegative(),
        }),
      )
      .optional(),
  })
  .strict();
export const serviceInputSchema = z
  .object({
    name: z.string().trim().min(1),
    unit: pricingUnitSchema,
    defaultRatePaise: moneyPaiseSchema,
    equipmentIds: z.array(idSchema),
    active: z.boolean(),
  })
  .strict();
export const equipmentSchema = equipmentInputSchema.extend({ id: idSchema });
export const serviceSchema = serviceInputSchema.extend({ id: idSchema });
export type PricingUnit = z.infer<typeof pricingUnitSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;
export type Service = z.infer<typeof serviceSchema>;
