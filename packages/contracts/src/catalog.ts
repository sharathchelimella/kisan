import { z } from "zod";
import {
  equipmentInputSchema,
  equipmentSchema,
  serviceInputSchema,
  serviceSchema,
} from "./machinery.contract";
import { pageRequestSchema } from "./common";

export const equipmentWriteSchema = equipmentInputSchema
  .extend({
    name: z.string().trim().min(1).max(120),
    kind: z.string().trim().min(1).max(80),
    displayIcon: z.string().max(80).optional(),
    serialOrRegistration: z.string().trim().max(80).optional(),
    serialNumber: z.string().trim().max(80).optional(),
    brand: z.string().trim().max(80).optional(),
    model: z.string().trim().max(80).optional(),
    purchaseDate: z.iso.date().optional(),
    purchaseCostPaise: z.number().int().nonnegative().optional(),
    notes: z.string().trim().max(2000).optional(),
    lastServiceDate: z.iso.date().optional(),
    nextMaintenanceDate: z.iso.date().optional(),
    driveType: z.string().trim().max(80).optional(),
    implementSize: z.string().trim().max(80).optional(),
    capacity: z.string().trim().max(80).optional(),
    photoDataUrl: z
      .string()
      .regex(/^data:image\/(jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/)
      .max(700000)
      .optional(),
    availabilityRecords: z
      .array(
        z
          .object({
            from: z.iso.date(),
            to: z.iso.date(),
            hours: z.number().nonnegative(),
          })
          .refine((value) => value.from <= value.to),
      )
      .max(120)
      .optional(),
  })
  .strict();
export const serviceWriteSchema = serviceInputSchema
  .extend({
    name: z.string().trim().min(1).max(120),
    equipmentIds: z
      .array(z.string().min(1))
      .max(50)
      .refine((ids) => new Set(ids).size === ids.length),
  })
  .strict();
export const equipmentPatchSchema = equipmentWriteSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0);
export const servicePatchSchema = serviceWriteSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0);
export const catalogQuerySchema = pageRequestSchema.extend({
  active: z.enum(["true", "false", "all"]).default("true"),
});
export const equipmentPageSchema = pageRequestSchema.extend({
  items: z.array(equipmentSchema),
  total: z.number().int().nonnegative(),
});
export const servicePageSchema = pageRequestSchema.extend({
  items: z.array(serviceSchema),
  total: z.number().int().nonnegative(),
});
export type EquipmentInput = z.infer<typeof equipmentWriteSchema>;
export type ServiceInput = z.infer<typeof serviceWriteSchema>;
export type EquipmentPatch = z.infer<typeof equipmentPatchSchema>;
export type ServicePatch = z.infer<typeof servicePatchSchema>;
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
