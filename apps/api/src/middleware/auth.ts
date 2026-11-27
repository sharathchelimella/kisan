import type { Request, RequestHandler, Response } from "express";
import { AUTH_REQUEST_HEADER, type ApiError } from "@kisan/contracts";
import type { AuthService } from "../services/auth.service";

export const SESSION_COOKIE = "kisan_session";

export function readSessionToken(req: Request) {
  return /(?:^|;\s*)kisan_session=([a-f0-9]{64})(?:;|$)/.exec(
    req.headers.cookie ?? "",
  )?.[1];
}

export function authError(
  res: Response,
  status: number,
  code: string,
  message: string,
) {
  res.status(status).json({
    error: { code, message },
    requestId: res.locals.requestId,
  } satisfies ApiError);
}

export function requireSession(service: AuthService): RequestHandler {
  return async (req, res, next) => {
    const token = readSessionToken(req);
    const session = token && (await service.current(token));
    if (!session) {
      authError(res, 401, "UNAUTHENTICATED", "Sign in to continue");
      return;
    }
    res.locals.session = session;
    res.locals.businessId = session.business.id;
    next();
  };
}

export const requireAuthRequest: RequestHandler = (req, res, next) => {
  if (
    req.get(AUTH_REQUEST_HEADER) !== "1" ||
    (req.get("Sec-Fetch-Site") && req.get("Sec-Fetch-Site") !== "same-origin")
  ) {
    authError(res, 403, "REQUEST_ORIGIN", "Request origin was rejected");
    return;
  }
  next();
};

export function limitAuthAttempts(): RequestHandler {
  const windowMs = 15 * 60_000;
  let resetAt = 0;
  let total = 0;
  const buckets = new Map<string, number>();
  return (req, res, next) => {
    const now = Date.now();
    if (now >= resetAt) {
      resetAt = now + windowMs;
      total = 0;
      buckets.clear();
    }
    const key = req.path + ":" + (req.ip ?? "unknown");
    const attempts = buckets.get(key) ?? 0;
    if (attempts >= 10 || total >= 500) {
      res.setHeader("Retry-After", Math.ceil((resetAt - now) / 1000));
      authError(res, 429, "RATE_LIMITED", "Try again later");
      return;
    }
    total += 1;
    buckets.set(key, attempts + 1);
    next();
  };
}
