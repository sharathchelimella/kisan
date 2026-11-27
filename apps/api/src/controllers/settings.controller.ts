import type { RequestHandler } from "express";
import { authError } from "../middleware/auth";
import type { SettingsRepository } from "../services/settings.service";
import { createSettingsService } from "../services/settings.service";

export function createSettingsController(
  repository: SettingsRepository,
): Record<"get" | "update", RequestHandler> {
  const service = createSettingsService(repository);
  return {
    get: async (_req, res) => {
      const data = await service.get(
        res.locals.businessId,
        res.locals.session.owner.id,
      );
      if (!data)
        return authError(res, 404, "NOT_FOUND", "Settings unavailable");
      res.json({ data, meta: { requestId: res.locals.requestId } });
    },
    update: async (req, res) => {
      const data = await service.update(
        res.locals.businessId,
        res.locals.session.owner.id,
        req.body,
      );
      if (!data)
        return authError(res, 404, "NOT_FOUND", "Settings unavailable");
      res.json({ data, meta: { requestId: res.locals.requestId } });
    },
  };
}
