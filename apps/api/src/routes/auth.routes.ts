import { Router, json } from "express";
import { createAuthController } from "../controllers/auth.controller";
import {
  authError,
  limitAuthAttempts,
  readSessionToken,
  requireAuthRequest,
  requireSession,
} from "../middleware/auth";
import type { AuthService } from "../services/auth.service";

export function createAuthRouter(
  service: AuthService | undefined,
  secure: boolean,
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  if (!service) {
    router.get("/me", (req, res, next) => {
      if (readSessionToken(req)) next();
      else authError(res, 401, "UNAUTHENTICATED", "Sign in to continue");
    });
    router.use((_req, res) =>
      authError(res, 503, "AUTH_UNAVAILABLE", "Sign-in service is unavailable"),
    );
    return router;
  }
  const auth = createAuthController(service, secure);
  const parse = json({ limit: "8kb" });
  const limit = limitAuthAttempts();
  router.post("/register", requireAuthRequest, limit, parse, auth.register);
  router.post("/login", requireAuthRequest, limit, parse, auth.login);
  router.get("/me", requireSession(service), auth.me);
  router.post("/logout", requireAuthRequest, auth.logout);
  router.post(
    "/forgot-password",
    requireAuthRequest,
    limit,
    parse,
    auth.recover,
  );
  return router;
}
