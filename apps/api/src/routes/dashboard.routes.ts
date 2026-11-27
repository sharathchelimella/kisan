import { Router } from "express";
import { authError, requireSession } from "../middleware/auth";
import type { AuthService } from "../services/auth.service";
import type { DashboardReadRepository } from "../services/dashboard.service";
import { createDashboardController } from "../controllers/dashboard.controller";

export function createDashboardRouter(
  auth: AuthService | undefined,
  repository: DashboardReadRepository,
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
  router.get("/", createDashboardController(repository));
  return router;
}
