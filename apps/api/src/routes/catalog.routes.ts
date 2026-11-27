import { Router, json, type ErrorRequestHandler } from "express";
import {
  authError,
  requireAuthRequest,
  requireSession,
} from "../middleware/auth";
import type { AuthService } from "../services/auth.service";
import type { CatalogRepository } from "../services/catalog.repository";
import { CatalogReferenceError } from "../services/catalog.service";
import { createCatalogController } from "../controllers/catalog.controller";

export function createCatalogRouter(
  auth: AuthService | undefined,
  repository: CatalogRepository,
) {
  const router = Router();
  router.use(["/equipment", "/services"], (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!auth) {
      authError(res, 401, "UNAUTHENTICATED", "Sign in to continue");
      return;
    }
    next();
  });
  if (!auth) return router;
  const controller = createCatalogController(repository);
  const guard = requireSession(auth);
  const parse = json({ limit: "16kb" });
  router.get("/equipment", guard, controller.equipmentList);
  router.get("/services", guard, controller.serviceList);
  router.post(
    "/equipment",
    guard,
    requireAuthRequest,
    parse,
    controller.equipmentCreate,
  );
  router.patch(
    "/equipment/:id",
    guard,
    requireAuthRequest,
    parse,
    controller.equipmentUpdate,
  );
  router.post(
    "/services",
    guard,
    requireAuthRequest,
    parse,
    controller.serviceCreate,
  );
  router.patch(
    "/services/:id",
    guard,
    requireAuthRequest,
    parse,
    controller.serviceUpdate,
  );
  const referenceError: ErrorRequestHandler = (error, _req, res, next) => {
    if (error instanceof CatalogReferenceError) {
      authError(
        res,
        422,
        "INVALID_EQUIPMENT",
        "Choose equipment from your catalog",
      );
      return;
    }
    next(error);
  };
  router.use(referenceError);
  return router;
}
