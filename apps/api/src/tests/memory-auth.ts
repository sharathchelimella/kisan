import { randomUUID } from "node:crypto";
import type { Session } from "@kisan/contracts";
import type { AuthRepository } from "../services/auth.repository";

export function memoryAuth(): AuthRepository {
  const accounts = new Map<
    string,
    { session: Session; passwordHash: string }
  >();
  const tokens = new Map<
    string,
    { userId: string; businessId: string; expiresAt: Date }
  >();
  return {
    async createOwner(input) {
      if (accounts.has(input.email)) return null;
      const session: Session = {
        owner: {
          id: randomUUID(),
          role: "OWNER",
          displayName: input.displayName,
          email: input.email,
          preferredLanguage: input.preferredLanguage,
        },
        business: {
          id: randomUUID(),
          name: input.businessName,
          village: input.village,
          timezone: "Asia/Kolkata",
          invoicePrefix: "KMM",
        },
      };
      accounts.set(input.email, { session, passwordHash: input.passwordHash });
      return session;
    },
    async findCredentials(email) {
      const record = accounts.get(email);
      return record
        ? {
            userId: record.session.owner.id,
            businessId: record.session.business.id,
            passwordHash: record.passwordHash,
          }
        : null;
    },
    async readMembership(identity) {
      return (
        [...accounts.values()].find(
          ({ session }) =>
            session.owner.id === identity.userId &&
            session.business.id === identity.businessId,
        )?.session ?? null
      );
    },
    async getIdentity(digest) {
      const record = tokens.get(digest);
      return record && record.expiresAt > new Date() ? record : null;
    },
    async saveSession(digest, identity, expiresAt) {
      tokens.set(digest, { ...identity, expiresAt });
    },
    async deleteSession(digest) {
      tokens.delete(digest);
    },
  };
}
