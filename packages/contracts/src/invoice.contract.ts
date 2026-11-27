import { z } from "zod";
import {
  businessDateSchema,
  idSchema,
  moneyPaiseSchema,
  timestampSchema,
} from "./common";
import { quantitySchema } from "./job.contract";
import { pricingUnitSchema } from "./machinery.contract";

export const invoiceLifecycleSchema = z.enum(["ISSUED", "VOID"]);
export const paymentStatusSchema = z.enum(["UNPAID", "PARTIAL", "PAID"]);
export const invoiceStatusSchema = z.enum([
  ...paymentStatusSchema.options,
  "VOID",
]);
export const invoiceBalanceSchema = z.object({
  invoiceId: idSchema,
  invoiceNumber: z.string(),
  totalPaise: moneyPaiseSchema,
  paidPaise: moneyPaiseSchema,
  duePaise: moneyPaiseSchema,
  status: invoiceStatusSchema,
});
export const issueInvoiceSchema = z.object({ jobId: idSchema }).strict();
export const invoiceSchema = invoiceBalanceSchema
  .omit({ invoiceId: true })
  .extend({
    id: idSchema,
    jobId: idSchema,
    farmerId: idSchema.optional(),
    sequence: z.number().int().positive(),
    lifecycle: invoiceLifecycleSchema,
    issuedAt: timestampSchema,
    workDate: businessDateSchema,
    farmerSnapshot: z.object({
      name: z.string(),
      mobile: z.string().optional(),
      village: z.string(),
    }),
    ownerSnapshot: z.object({
      name: z.string(),
      phone: z.string().optional(),
      address: z.string().optional(),
    }),
    lines: z.array(
      z.object({
        lineId: idSchema,
        serviceId: idSchema,
        equipmentIds: z.array(idSchema).default([]),
        serviceName: z.string(),
        unit: pricingUnitSchema,
        quantity: quantitySchema,
        ratePaise: moneyPaiseSchema.optional(),
        amountPaise: moneyPaiseSchema,
      }),
    ),
    version: z.number().int().positive(),
    voidReason: z.string().optional(),
  });
export type InvoiceLifecycle = z.infer<typeof invoiceLifecycleSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type InvoiceBalance = z.infer<typeof invoiceBalanceSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
