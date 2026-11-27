import type { RequestHandler } from "express";
import { z } from "zod";
import {
  businessDateSchema,
  invoiceStatusSchema,
  issueInvoiceSchema,
} from "@kisan/contracts";
import { authError } from "../middleware/auth";
import { renderInvoicePdf } from "../services/invoice.pdf";
import {
  InvoiceConflict,
  InvoiceUnavailable,
  type InvoiceRepository,
} from "../services/invoice.service";
import { createInvoiceService } from "../services/invoice.service";

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: invoiceStatusSchema.optional(),
  from: businessDateSchema.optional(),
  to: businessDateSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const voidSchema = z
  .object({ reason: z.string().trim().min(3).max(500) })
  .strict();
export function createInvoiceController(
  repository: InvoiceRepository,
): Record<"issue" | "list" | "get" | "pdf" | "void", RequestHandler> {
  const service = createInvoiceService(repository);
  return {
    issue: async (req, res) => {
      try {
        const { jobId } = issueInvoiceSchema.parse(req.body);
        const invoice = await service.issue(res.locals.businessId, jobId);
        res
          .status(201)
          .json({ data: invoice, meta: { requestId: res.locals.requestId } });
      } catch (error) {
        if (error instanceof InvoiceUnavailable)
          authError(res, 404, "JOB_UNAVAILABLE", error.message);
        else if (error instanceof InvoiceConflict)
          authError(res, 409, "INVOICE_CONFLICT", error.message);
        else throw error;
      }
    },
    list: async (req, res) =>
      res.json({
        data: await service.list(
          res.locals.businessId,
          querySchema.parse(req.query),
        ),
        meta: { requestId: res.locals.requestId },
      }),
    get: async (req, res) => {
      const invoice = await service.get(
        res.locals.businessId,
        String(req.params.id),
      );
      if (!invoice)
        return authError(res, 404, "NOT_FOUND", "Invoice unavailable");
      res.json({ data: invoice, meta: { requestId: res.locals.requestId } });
    },
    pdf: async (req, res) => {
      const invoice = await service.get(
        res.locals.businessId,
        String(req.params.id),
      );
      if (!invoice)
        return authError(res, 404, "NOT_FOUND", "Invoice unavailable");
      const pdf = await renderInvoicePdf(invoice);
      res
        .type("pdf")
        .setHeader(
          "Content-Disposition",
          `inline; filename="${invoice.invoiceNumber}.pdf"`,
        );
      res.send(pdf);
    },
    void: async (req, res) => {
      try {
        const { reason } = voidSchema.parse(req.body);
        const invoice = await service.void(
          res.locals.businessId,
          String(req.params.id),
          reason,
        );
        res.json({ data: invoice, meta: { requestId: res.locals.requestId } });
      } catch (error) {
        if (error instanceof InvoiceConflict)
          authError(res, 409, "CANNOT_VOID", error.message);
        else throw error;
      }
    },
  };
}
