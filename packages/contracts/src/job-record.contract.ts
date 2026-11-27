import { z } from "zod";
import { businessDateSchema, idSchema, timestampSchema } from "./common";
import { jobSchema, jobStateSchema } from "./job.contract";

export const jobQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    farmerId: idSchema.optional(),
    from: businessDateSchema.optional(),
    to: businessDateSchema.optional(),
    village: z.string().trim().max(100).optional(),
    serviceId: idSchema.optional(),
    equipmentId: idSchema.optional(),
    state: jobStateSchema.optional(),
    sort: z.enum(["newest", "oldest"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ["to"],
  });
export const jobRevisionSchema = z.object({
  action: z.literal("CANCELLED"),
  reason: z.string().trim().min(3).max(500),
  actorId: idSchema,
  at: timestampSchema,
});
export const jobRecordSchema = jobSchema.extend({
  revisions: z.array(jobRevisionSchema),
});
export const jobSummarySchema = jobSchema
  .pick({
    id: true,
    farmerId: true,
    workDate: true,
    village: true,
    state: true,
    totalPaise: true,
    invoiceId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({ farmerName: z.string(), services: z.array(z.string()) });
export const jobPageSchema = z.object({
  items: z.array(jobSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export const cancelJobSchema = z
  .object({ reason: z.string().trim().min(3).max(500) })
  .strict();
export type JobQuery = z.infer<typeof jobQuerySchema>;
export type JobRecord = z.infer<typeof jobRecordSchema>;
export type JobPage = z.infer<typeof jobPageSchema>;
