import { z } from "zod";
import { farmerInputSchema, farmerSchema } from "./farmer.contract";
import { farmersQuerySchema } from "./queries";

export const farmerWriteSchema = farmerInputSchema
  .extend({
    name: z.string().trim().min(1).max(120),
    village: z.string().trim().min(1).max(120),
    mobile: z
      .string()
      .trim()
      .max(30)
      .refine((value) => value === "" || /^[+\d\s()-]+$/.test(value))
      .optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export const farmerPatchSchema = farmerWriteSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0);
export const farmerDirectoryQuerySchema = farmersQuerySchema.extend({
  q: z.string().trim().max(120).optional(),
  village: z.string().trim().max(120).optional(),
  archived: z.enum(["true", "false"]).default("false"),
});
export const farmerMatchesSchema = z
  .object({
    name: farmerWriteSchema.shape.name,
    village: farmerWriteSchema.shape.village,
    mobile: farmerWriteSchema.shape.mobile,
    excludeId: z.string().optional(),
  })
  .strict();
export const farmerSummarySchema = z.object({
  totalFarmers: z.number().int().nonnegative(),
  totalWorkCount: z.number().int().nonnegative(),
  totalAmountPaise: z.number().int().nonnegative(),
  pendingAmountPaise: z.number().int().nonnegative(),
  villages: z.array(z.string()).default([]),
});
export const farmerPageSchema = z.object({
  items: z.array(farmerSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  summary: farmerSummarySchema.optional(),
});
export type FarmerSummary = z.infer<typeof farmerSummarySchema>;
export type FarmerQuery = z.infer<typeof farmerDirectoryQuerySchema>;
export type FarmerPatch = z.infer<typeof farmerPatchSchema>;
export type FarmerMatches = z.infer<typeof farmerMatchesSchema>;
export type FarmerPage = z.infer<typeof farmerPageSchema>;

export function normalizeFarmerText(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-IN");
}
export function normalizeFarmerPhone(value = "") {
  return value.replace(/[\s()+-]/g, "");
}
