import type { RequestHandler, Response } from "express";
import { authError } from "../middleware/auth";
import type { FarmerService } from "../services/farmer.service";

function send(res: Response, data: unknown, status = 200) {
  if (data === null) {
    authError(res, 404, "NOT_FOUND", "Farmer unavailable");
    return;
  }
  res.status(status).json({ data, meta: { requestId: res.locals.requestId } });
}
export function createFarmerController(
  service: FarmerService,
): Record<
  "list" | "get" | "create" | "update" | "archive" | "matches",
  RequestHandler
> {
  return {
    list: async (req, res) =>
      send(res, await service.list(res.locals.businessId, req.query)),
    get: async (req, res) =>
      send(
        res,
        await service.get(res.locals.businessId, String(req.params.id)),
      ),
    create: async (req, res) =>
      send(res, await service.create(res.locals.businessId, req.body), 201),
    update: async (req, res) =>
      send(
        res,
        await service.update(
          res.locals.businessId,
          String(req.params.id),
          req.body,
        ),
      ),
    archive: async (req, res) =>
      send(
        res,
        await service.archive(res.locals.businessId, String(req.params.id)),
      ),
    matches: async (req, res) =>
      send(res, await service.matches(res.locals.businessId, req.body)),
  };
}
