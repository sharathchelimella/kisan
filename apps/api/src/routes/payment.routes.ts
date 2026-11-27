import { Router, json } from "express";
import {
  authError,
  requireAuthRequest,
  requireSession,
} from "../middleware/auth";
import type { AuthService } from "../services/auth.service";
import { createPaymentController } from "../controllers/payment.controller";
import type { PaymentRepository } from "../services/payment.service";

export function createPaymentRouter(
  auth: AuthService | undefined,
  repository: PaymentRepository,
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
  const controller = createPaymentController(repository);
  router.get("/dues", controller.dues);
  router.get("/receipts", controller.receipts);
  router.use(requireAuthRequest, json({ limit: "8kb" }));
  router.post("/receipts", controller.post);
  router.post("/receipts/:id/reverse", controller.reverse);
  return router;
}
