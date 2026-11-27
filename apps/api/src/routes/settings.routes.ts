import { Router, json } from "express";
import {
  authError,
  requireAuthRequest,
  requireSession,
} from "../middleware/auth";
import type { AuthService } from "../services/auth.service";
import type { SettingsRepository } from "../services/settings.service";
import { createSettingsController } from "../controllers/settings.controller";

export function createSettingsRouter(
  auth: AuthService | undefined,
  repository: SettingsRepository,
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
  const controller = createSettingsController(repository);
  router.get("/", controller.get);
  router.patch(
    "/",
    requireAuthRequest,
    json({ limit: "8kb" }),
    controller.update,
  );
  return router;
}
