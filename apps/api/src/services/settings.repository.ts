import mongoose from "mongoose";
import { settingsSchema } from "@kisan/contracts";
import { Business } from "../models/Business.model";
import { User } from "../models/User.model";
import type { SettingsRepository } from "./settings.service";
class SettingsUnavailable extends Error {}

export const mongoSettings: SettingsRepository = {
  async get(businessId, ownerId) {
    const [business, owner] = await Promise.all([
      Business.findOne({ _id: businessId, ownerUserId: ownerId }).lean(),
      User.findOne({ _id: ownerId, businessId, role: "OWNER" }).lean(),
    ]);
    if (!business || !owner) return null;
    return settingsSchema.parse({
      businessName: business.name,
      village: business.village,
      phone: business.phone ?? undefined,
      address: business.address ?? undefined,
      timezone: business.timezone,
      invoicePrefix: business.invoicePrefix,
      nextInvoiceSequence: business.nextInvoiceSequence,
      ownerDisplayName: owner.displayName,
      ownerMobile: owner.mobile ?? undefined,
      preferredLanguage: owner.preferredLanguage,
      notificationsOptIn: business.notificationsOptIn ?? false,
      textSize: owner.textSize ?? "STANDARD",
    });
  },
  async update(businessId, ownerId, input) {
    const session = await mongoose.startSession();
    try {
      let changed = false;
      await session.withTransaction(async () => {
        const businessFields = {
          ...(input.businessName !== undefined && { name: input.businessName }),
          ...(input.village !== undefined && { village: input.village }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.notificationsOptIn !== undefined && {
            notificationsOptIn: input.notificationsOptIn,
          }),
        };
        const ownerFields = {
          ...(input.ownerDisplayName !== undefined && {
            displayName: input.ownerDisplayName,
          }),
          ...(input.ownerMobile !== undefined && { mobile: input.ownerMobile }),
          ...(input.preferredLanguage !== undefined && {
            preferredLanguage: input.preferredLanguage,
          }),
          ...(input.textSize !== undefined && { textSize: input.textSize }),
        };
        const business = await Business.findOneAndUpdate(
          { _id: businessId, ownerUserId: ownerId },
          { $set: businessFields },
          { new: true, session },
        );
        const owner = await User.findOneAndUpdate(
          { _id: ownerId, businessId, role: "OWNER" },
          { $set: ownerFields },
          { new: true, session },
        );
        changed = !!business && !!owner;
        if (!changed) throw new SettingsUnavailable("Settings unavailable");
      });
      return changed ? this.get(businessId, ownerId) : null;
    } catch (error) {
      if (error instanceof SettingsUnavailable) return null;
      throw error;
    } finally {
      await session.endSession();
    }
  },
};
