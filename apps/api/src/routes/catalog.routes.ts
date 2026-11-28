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
import { calculateEquipmentAnalytics, jobSchema } from "@kisan/contracts";
import { JobModel } from "../models/Job.model";
import mongoose from "mongoose";

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
  const parse = json({ limit: "768kb" });
  router.get("/equipment", guard, controller.equipmentList);
  router.get("/equipment/analytics", guard, async (req, res) => {
    const from =
      typeof req.query.from === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(req.query.from)
        ? req.query.from
        : undefined;
    const to =
      typeof req.query.to === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(req.query.to)
        ? req.query.to
        : undefined;
    const businessId = res.locals.businessId;
    const jobRecords =
      mongoose.connection.readyState === 1
        ? await JobModel.find({
            businessId,
            state: { $in: ["COMPLETED", "BILLED"] },
            ...(from || to
              ? {
                  workDate: {
                    ...(from && { $gte: from }),
                    ...(to && { $lte: to }),
                  },
                }
              : {}),
          }).lean()
        : [];
    const equipment = [];
    for (let page = 1; ; page += 1) {
      const result = await repository.equipmentList(businessId, {
        active: "all",
        page,
        pageSize: 100,
      });
      equipment.push(...result.items);
      if (page * 100 >= result.total) break;
    }
    const jobs = jobRecords.map((record) =>
      jobSchema.parse({
        ...record,
        id: record._id.toString(),
        farmerId: record.farmerId.toString(),
        invoiceId: record.invoiceId?.toString() ?? null,
        lines: record.lines.map((line) => ({
          ...line,
          serviceId: line.serviceId.toString(),
          equipmentIds: line.equipmentIds.map((id) => id.toString()),
        })),
        completedAt: record.completedAt?.toISOString(),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }),
    );
    res.json({
      data: calculateEquipmentAnalytics(equipment, jobs, from, to),
      meta: { requestId: res.locals.requestId },
    });
  });
  router.get("/services", guard, controller.serviceList);
  router.get("/equipment/:id", guard, controller.equipmentGet);
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
