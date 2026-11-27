import { z } from "zod";
import { businessDateSchema, idSchema, pageRequestSchema } from "./common";
import { jobStateSchema } from "./job.contract";
import { invoiceStatusSchema, paymentStatusSchema } from "./invoice.contract";

const dates = {
  from: businessDateSchema.optional(),
  to: businessDateSchema.optional(),
};

function orderedDates({ from, to }: { from?: string; to?: string }) {
  return from === undefined || to === undefined || from <= to;
}

export const farmersQuerySchema = pageRequestSchema.extend({
  q: z.string().trim().optional(),
  village: z.string().trim().optional(),
});
export const jobsQuerySchema = pageRequestSchema
  .extend({
    ...dates,
    farmerId: idSchema.optional(),
    serviceId: idSchema.optional(),
    status: jobStateSchema.optional(),
  })
  .refine(orderedDates, { path: ["to"] });

export const invoicesQuerySchema = pageRequestSchema
  .extend({
    ...dates,
    q: z.string().trim().optional(),
    serviceId: idSchema.optional(),
    status: invoiceStatusSchema.optional(),
  })
  .refine(orderedDates, { path: ["to"] });

export const duesQuerySchema = pageRequestSchema
  .extend({
    ...dates,
    farmerId: idSchema.optional(),
    serviceId: idSchema.optional(),
    village: z.string().trim().optional(),
    status: paymentStatusSchema.optional(),
  })
  .refine(orderedDates, { path: ["to"] });

export const receiptsQuerySchema = pageRequestSchema
  .extend({
    ...dates,
    invoiceId: idSchema.optional(),
    farmerId: idSchema.optional(),
  })
  .refine(orderedDates, { path: ["to"] });

export const reasonInputSchema = z
  .object({ reason: z.string().trim().min(1) })
  .strict();
export const idempotencyKeySchema = z.uuid();
