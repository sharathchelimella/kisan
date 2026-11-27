import mongoose, { Types } from "mongoose";
import {
  sessionSchema,
  type RegisterInput,
  type Session,
} from "@kisan/contracts";
import { Business } from "../models/Business.model";
import { User } from "../models/User.model";
import { AuthSession } from "../models/Session.model";

type Identity = { userId: string; businessId: string };
type NewOwner = Omit<RegisterInput, "password" | "verificationCode"> & {
  passwordHash: string;
};

export interface AuthRepository {
  createOwner(owner: NewOwner): Promise<Session | null>;
  findCredentials(
    email: string,
  ): Promise<(Identity & { passwordHash: string }) | null>;
  getIdentity(digest: string): Promise<Identity | null>;
  readMembership(identity: Identity): Promise<Session | null>;
  saveSession(
    digest: string,
    identity: Identity,
    expiresAt: Date,
  ): Promise<void>;
  deleteSession(digest: string): Promise<void>;
}

async function readMembership({
  userId,
  businessId,
}: Identity): Promise<Session | null> {
  const [owner, business] = await Promise.all([
    User.findOne({ _id: userId, businessId, role: "OWNER" }).lean(),
    Business.findOne({ _id: businessId, ownerUserId: userId }).lean(),
  ]);
  if (!owner || !business) return null;
  return sessionSchema.parse({
    owner: {
      id: userId,
      displayName: owner.displayName,
      role: owner.role,
      email: owner.email,
      mobile: owner.mobile,
      preferredLanguage: owner.preferredLanguage,
    },
    business: {
      id: businessId,
      name: business.name,
      village: business.village,
      timezone: business.timezone,
      invoicePrefix: business.invoicePrefix,
      phone: business.phone,
      address: business.address,
    },
  });
}

export const mongoAuthRepository: AuthRepository = {
  async createOwner({ businessName, village, ...owner }) {
    const businessId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    try {
      return await mongoose.connection.transaction(async (transaction) => {
        const [business] = await Business.create(
          [
            {
              _id: businessId,
              name: businessName,
              village,
              ownerUserId: userId,
            },
          ],
          { session: transaction },
        );
        const [user] = await User.create(
          [{ ...owner, _id: userId, businessId }],
          { session: transaction },
        );
        return sessionSchema.parse({
          owner: {
            id: userId.toHexString(),
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            preferredLanguage: user.preferredLanguage,
          },
          business: {
            id: businessId.toHexString(),
            name: business.name,
            village,
            timezone: business.timezone,
            invoicePrefix: business.invoicePrefix,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof mongoose.mongo.MongoServerError &&
        error.code === 11000
      )
        return null;
      throw error;
    }
  },
  async findCredentials(email) {
    const user = await User.findOne({ email }).select("+passwordHash").lean();
    return (
      user && {
        userId: user._id.toHexString(),
        businessId: user.businessId.toHexString(),
        passwordHash: user.passwordHash,
      }
    );
  },
  async getIdentity(digest) {
    const record = await AuthSession.findOne({
      digest,
      expiresAt: { $gt: new Date() },
    }).lean();
    return (
      record && {
        userId: record.userId.toHexString(),
        businessId: record.businessId.toHexString(),
      }
    );
  },
  readMembership,
  async saveSession(digest, identity, expiresAt) {
    await AuthSession.create({ digest, ...identity, expiresAt });
  },
  async deleteSession(digest) {
    await AuthSession.deleteOne({ digest });
  },
};

export async function initializeAuthCollections() {
  for (const model of [User, Business, AuthSession]) {
    await model.createCollection();
    await model.createIndexes();
  }
}
