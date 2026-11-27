import { Router, json } from "express";
import { jobSchema, type ApiSuccess } from "@kisan/contracts";
import {
  authError,
  requireAuthRequest,
  requireSession,
} from "../middleware/auth";
import {
  createJobService,
  JobPricingError,
  JobReferenceError,
  type JobPorts,
} from "../services/job.service";
import type { AuthService } from "../services/auth.service";

export function createJobRouter(
  auth: AuthService | undefined,
  ports: JobPorts,
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!auth) {
      authError(res, 401, "UNAUTHENTICATED", "Sign in to continue");
      return;
    }
    next();
  });
  if (!auth) return router;
  const create = createJobService(ports);
  router.post(
    "/",
    requireSession(auth),
    requireAuthRequest,
    json({ limit: "32kb" }),
    async (req, res) => {
      try {
        const job = await create(
          res.locals.businessId,
          res.locals.session.owner.id,
          req.body,
        );
        res
          .status(201)
          .json({
            data: jobSchema.parse(job),
            meta: { requestId: res.locals.requestId },
          } satisfies ApiSuccess<typeof job>);
      } catch (error) {
        if (error instanceof JobReferenceError)
          authError(res, 404, "REFERENCE_UNAVAILABLE", error.message);
        else if (
          error instanceof JobPricingError ||
          error instanceof RangeError
        )
          authError(res, 422, "INVALID_PRICING", error.message);
        else throw error;
      }
    },
  );
  return router;
}
