import type { CookieOptions, Response } from "express";
import {
  loginSchema,
  recoverySchema,
  registerSchema,
  type Session,
} from "@kisan/contracts";
import {
  authError,
  readSessionToken,
  SESSION_COOKIE,
} from "../middleware/auth";
import { SESSION_SECONDS, type AuthService } from "../services/auth.service";

export function createAuthController(service: AuthService, secure: boolean) {
  const cookie: CookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  };
  function send(res: Response, data: unknown, status = 200) {
    res
      .status(status)
      .json({ data, meta: { requestId: res.locals.requestId } });
  }

  return {
    register: async (req: import("express").Request, res: Response) => {
      const session = await service.register(registerSchema.parse(req.body));
      if (!session) {
        authError(
          res,
          400,
          "REGISTRATION_REJECTED",
          "Registration could not be completed",
        );
        return;
      }
      send(res, { registered: true }, 201);
    },
    login: async (req: import("express").Request, res: Response) => {
      const session = await service.login(loginSchema.parse(req.body));
      if (!session) {
        authError(
          res,
          401,
          "INVALID_CREDENTIALS",
          "Email or password is incorrect",
        );
        return;
      }
      await service.revoke(readSessionToken(req));
      const token = await service.start(session);
      res.cookie(SESSION_COOKIE, token, {
        ...cookie,
        maxAge: SESSION_SECONDS * 1000,
      });
      send(res, session);
    },
    me: (_req: import("express").Request, res: Response) => {
      send(res, res.locals.session as Session);
    },
    logout: async (req: import("express").Request, res: Response) => {
      await service.revoke(readSessionToken(req));
      res.clearCookie(SESSION_COOKIE, cookie);
      send(res, { signedOut: true });
    },
    recover: (req: import("express").Request, res: Response) => {
      recoverySchema.parse(req.body);
      send(res, { accepted: true }, 202);
    },
  };
}
