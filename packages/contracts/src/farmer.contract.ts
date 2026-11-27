import { z } from "zod";
import { idSchema, timestampSchema } from "./common";

export const farmerInputSchema = z
  .object({
    name: z.string().trim().min(1),
    village: z.string().trim().min(1),
    mobile: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .strict();
export const farmerSchema = farmerInputSchema.extend({
  id: idSchema,
  archivedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  totalWorks: z.number().int().nonnegative().optional(),
  totalAmountPaise: z.number().int().nonnegative().optional(),
  paidAmountPaise: z.number().int().nonnegative().optional(),
  pendingAmountPaise: z.number().int().nonnegative().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});
export type FarmerInput = z.infer<typeof farmerInputSchema>;
export type Farmer = z.infer<typeof farmerSchema>;
