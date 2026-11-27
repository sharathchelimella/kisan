import { Router, json } from "express";
import {
  authError,
  requireAuthRequest,
  requireSession,
} from "../middleware/auth";
import type { AuthService } from "../services/auth.service";
import type { InvoiceRepository } from "../services/invoice.service";
import { createInvoiceController } from "../controllers/invoice.controller";

export function createInvoiceRouter(
  auth: AuthService | undefined,
  repository: InvoiceRepository,
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  if (!auth) {
    router.use((_req, res) =>
      authError(res, 401, "UNAUTHENTICATED", "Sign in to continue"),
    );
    return router;
  }
  router.use(requireSession(auth));
  const controller = createInvoiceController(repository);
  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.get("/:id/pdf", controller.pdf);
  router.use(requireAuthRequest, json({ limit: "4kb" }));
  router.post("/", controller.issue);
  router.post("/:id/void", controller.void);
  return router;
}
