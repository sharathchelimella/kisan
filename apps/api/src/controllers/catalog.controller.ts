import type { RequestHandler, Response } from "express";
import { authError } from "../middleware/auth";
import { createCatalogService } from "../services/catalog.service";
import type { CatalogRepository } from "../services/catalog.repository";

function send(res: Response, data: unknown, status = 200) {
  if (data === null) {
    authError(res, 404, "NOT_FOUND", "Catalog record unavailable");
    return;
  }
  res.status(status).json({ data, meta: { requestId: res.locals.requestId } });
}
export function createCatalogController(
  repository: CatalogRepository,
): Record<
  | "equipmentList"
  | "equipmentGet"
  | "serviceList"
  | "equipmentCreate"
  | "serviceCreate"
  | "equipmentUpdate"
  | "serviceUpdate",
  RequestHandler
> {
  const service = createCatalogService(repository);
  return {
    equipmentGet: async (req, res) =>
      send(res, await service.equipmentGet(res.locals.businessId, String(req.params.id))),
    equipmentList: async (req, res) =>
      send(res, await service.equipmentList(res.locals.businessId, req.query)),
    serviceList: async (req, res) =>
      send(res, await service.serviceList(res.locals.businessId, req.query)),
    equipmentCreate: async (req, res) =>
      send(
        res,
        await service.equipmentCreate(res.locals.businessId, req.body),
        201,
      ),
    serviceCreate: async (req, res) =>
      send(
        res,
        await service.serviceCreate(res.locals.businessId, req.body),
        201,
      ),
    equipmentUpdate: async (req, res) =>
      send(
        res,
        await service.equipmentUpdate(
          res.locals.businessId,
          String(req.params.id),
          req.body,
        ),
      ),
    serviceUpdate: async (req, res) =>
      send(
        res,
        await service.serviceUpdate(
          res.locals.businessId,
          String(req.params.id),
          req.body,
          res.locals.session.owner.id,
        ),
      ),
  };
}
