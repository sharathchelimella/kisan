import { z } from "zod";
import {
  businessDateSchema,
  idSchema,
  moneyPaiseSchema,
  timestampSchema,
} from "./common";
import { invoiceBalanceSchema } from "./invoice.contract";

export const paymentMethodSchema = z.enum(["CASH", "UPI", "BANK", "OTHER"]);
export const receiptInputSchema = z
  .object({
    invoiceId: idSchema,
    amountPaise: moneyPaiseSchema.refine((value) => value > 0),
    method: paymentMethodSchema,
    paymentDate: businessDateSchema,
    note: z.string().optional(),
    reference: z.string().optional(),
  })
  .strict();
export const receiptSchema = receiptInputSchema.extend({
  id: idSchema,
  farmerId: idSchema,
  status: z.enum(["POSTED", "REVERSED"]),
  reversedByReceiptId: idSchema.optional(),
  reversalReason: z.string().optional(),
  reversedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
});
export const receiptResultSchema = z.object({
  receipt: receiptSchema,
  invoice: invoiceBalanceSchema,
});
export const reverseReceiptSchema = z
  .object({ reason: z.string().trim().min(3).max(500) })
  .strict();
export const receiptPageSchema = z.object({
  items: z.array(receiptSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type ReceiptInput = z.infer<typeof receiptInputSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
