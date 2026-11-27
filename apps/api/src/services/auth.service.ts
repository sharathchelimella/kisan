import { randomBytes } from "node:crypto";
import type { LoginInput, RegisterInput, Session } from "@kisan/contracts";
import type { AuthRepository } from "./auth.repository";
import {
  checkPassword,
  hashPassword,
  sessionDigest,
  verifyRegistrationCode,
} from "./auth.crypto";

export const SESSION_SECONDS = 8 * 60 * 60;

export function createAuthService(
  repository: AuthRepository,
  registrationSecret?: string,
) {
  return {
    async register({ password, verificationCode, ...input }: RegisterInput) {
      if (
        !registrationSecret ||
        !verifyRegistrationCode(
          input.email,
          verificationCode,
          registrationSecret,
        )
      )
        return null;
      return repository.createOwner({
        ...input,
        passwordHash: await hashPassword(password),
      });
    },
    async login({ email, password }: LoginInput) {
      const credentials = await repository.findCredentials(email);
      if (
        !(await checkPassword(password, credentials?.passwordHash)) ||
        !credentials
      )
        return null;
      return repository.readMembership(credentials);
    },
    async current(token: string) {
      const identity = await repository.getIdentity(sessionDigest(token));
      return identity && repository.readMembership(identity);
    },
    async revoke(token?: string) {
      if (token) await repository.deleteSession(sessionDigest(token));
    },
    async start(session: Session) {
      const token = randomBytes(32).toString("hex");
      await repository.saveSession(
        sessionDigest(token),
        { userId: session.owner.id, businessId: session.business.id },
        new Date(Date.now() + SESSION_SECONDS * 1000),
      );
      return token;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
