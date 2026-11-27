import { Router, json } from "express";
import {
  authError,
  requireAuthRequest,
  requireSession,
} from "../middleware/auth";
import type { AuthService } from "../services/auth.service";
import { createFarmerController } from "../controllers/farmer.controller";
import { createFarmerService } from "../services/farmer.service";
import type { FarmerRepository } from "../services/farmer.repository";

export function createFarmerRouter(
  auth: AuthService | undefined,
  repository: FarmerRepository,
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
  const controller = createFarmerController(createFarmerService(repository));
  router.get("/", controller.list);
  router.get("/:id", controller.get);
  router.use(requireAuthRequest, json({ limit: "16kb" }));
  router.post("/duplicates", controller.matches);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.post("/:id/archive", controller.archive);
  return router;
}
