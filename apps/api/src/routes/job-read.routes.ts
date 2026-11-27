import { Router, json } from "express";
import { cancelJobSchema, jobQuerySchema } from "@kisan/contracts";
import {
  authError,
  requireAuthRequest,
  requireSession,
} from "../middleware/auth";
import type { AuthService } from "../services/auth.service";
import type { JobReadRepository } from "../services/job-read.repository";

export function createJobReadRouter(
  auth: AuthService | undefined,
  reads: JobReadRepository,
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
  router.get("/", async (req, res) =>
    res.json({
      data: await reads.list(
        res.locals.businessId,
        jobQuerySchema.parse(req.query),
      ),
      meta: { requestId: res.locals.requestId },
    }),
  );
  router.get("/:id", async (req, res) => {
    const data = await reads.get(res.locals.businessId, String(req.params.id));
    if (!data)
      return authError(res, 404, "NOT_FOUND", "Work record unavailable");
    res.json({ data, meta: { requestId: res.locals.requestId } });
  });
  router.post(
    "/:id/cancel",
    requireAuthRequest,
    json({ limit: "4kb" }),
    async (req, res) => {
      const { reason } = cancelJobSchema.parse(req.body);
      const data = await reads.cancel(
        res.locals.businessId,
        String(req.params.id),
        res.locals.session.owner.id,
        reason,
      );
      if (!data)
        return authError(
          res,
          409,
          "CANNOT_CANCEL",
          "Work record cannot be cancelled",
        );
      res.json({ data, meta: { requestId: res.locals.requestId } });
    },
  );
  return router;
}
