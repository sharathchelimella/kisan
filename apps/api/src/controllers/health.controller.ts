import type { RequestHandler } from "express";
import type { ApiSuccess, Health } from "@kisan/contracts";

export const getHealth: RequestHandler = (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    data: { status: "ok" },
    meta: { requestId: res.locals.requestId },
  } satisfies ApiSuccess<Health>);
};
