import { Router } from "express";
import { authError, requireSession } from "../middleware/auth";
import type { AuthService } from "../services/auth.service";
import { createReportController } from "../controllers/report.controller";
import type { ReportReadRepository } from "../services/report.service";

export function createReportRouter(
  auth: AuthService | undefined,
  repository: ReportReadRepository,
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
  const controller = createReportController(repository);
  router.get("/", controller.get);
  router.get("/export.csv", controller.csv);
  return router;
}
