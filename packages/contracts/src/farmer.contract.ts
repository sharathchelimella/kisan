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
});
export type FarmerInput = z.infer<typeof farmerInputSchema>;
export type Farmer = z.infer<typeof farmerSchema>;
