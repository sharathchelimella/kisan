import type { RequestHandler } from "express";
import { z } from "zod";
import {
  businessDateSchema,
  invoiceStatusSchema,
  reverseReceiptSchema,
} from "@kisan/contracts";
import { authError } from "../middleware/auth";
import {
  createPaymentService,
  PaymentConflict,
  type PaymentRepository,
} from "../services/payment.service";

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  farmerId: z.string().optional(),
  equipmentId: z.string().optional(),
  status: invoiceStatusSchema.optional(),
  from: businessDateSchema.optional(),
  to: businessDateSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export function createPaymentController(
  repository: PaymentRepository,
): Record<"post" | "reverse" | "receipts" | "dues", RequestHandler> {
  const service = createPaymentService(repository);
  return {
    post: async (req, res) => {
      try {
        const result = await service.post(
          res.locals.businessId,
          res.locals.session.owner.id,
          req.get("Idempotency-Key") ?? "",
          req.body,
        );
        res
          .status(201)
          .json({ data: result, meta: { requestId: res.locals.requestId } });
      } catch (error) {
        if (error instanceof PaymentConflict)
          authError(res, 409, "PAYMENT_CONFLICT", error.message);
        else throw error;
      }
    },
    reverse: async (req, res) => {
      try {
        const { reason } = reverseReceiptSchema.parse(req.body);
        const result = await service.reverse(
          res.locals.businessId,
          res.locals.session.owner.id,
          String(req.params.id),
          reason,
        );
        res.json({ data: result, meta: { requestId: res.locals.requestId } });
      } catch (error) {
        if (error instanceof PaymentConflict)
          authError(res, 409, "REVERSAL_CONFLICT", error.message);
        else throw error;
      }
    },
    receipts: async (req, res) =>
      res.json({
        data: await service.receipts(
          res.locals.businessId,
          querySchema.parse(req.query),
        ),
        meta: { requestId: res.locals.requestId },
      }),
    dues: async (req, res) =>
      res.json({
        data: await service.dues(
          res.locals.businessId,
          querySchema.parse(req.query),
        ),
        meta: { requestId: res.locals.requestId },
      }),
  };
}
