import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ApiError } from "@kisan/contracts";
import { ZodError } from "zod";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route unavailable" },
    requestId: res.locals.requestId,
  } satisfies ApiError);
};

export const handleError: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (
    error instanceof Error &&
    "type" in error &&
    (error.type === "entity.parse.failed" || error.type === "entity.too.large")
  ) {
    const oversized = error.type === "entity.too.large";
    res.status(oversized ? 413 : 400).json({
      error: {
        code: oversized ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON",
        message: oversized
          ? "Request body is too large"
          : "Request body must be valid JSON",
      },
      requestId: res.locals.requestId,
    } satisfies ApiError);
    return;
  }
  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map(({ path, message }) => [path.join("."), message]),
    );
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Check the entered details",
        fields,
      },
      requestId: res.locals.requestId,
    } satisfies ApiError);
    return;
  }
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    requestId: res.locals.requestId,
  } satisfies ApiError);
};
