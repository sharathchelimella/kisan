import { Router } from "express";
import mongoose from "mongoose";
import { getHealth } from "../controllers/health.controller";

export const healthRouter = Router();
healthRouter.get("/health", getHealth);
healthRouter.get("/ready", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (mongoose.connection.readyState !== 1) {
    res
      .status(503)
      .json({
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Service is not ready",
        },
        requestId: res.locals.requestId,
      });
    return;
  }
  res.json({
    data: { status: "ok" },
    meta: { requestId: res.locals.requestId },
  });
});
