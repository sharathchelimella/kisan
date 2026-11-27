import type { Settings, SettingsUpdate } from "@kisan/contracts";
import type { SettingsRepository } from "../services/settings.service";

export function memorySettings(
  seed: { businessId: string; ownerId: string; settings: Settings }[] = [],
): SettingsRepository {
  const entries = seed.map((value) => ({
    ...value,
    settings: { ...value.settings },
  }));
  return {
    async get(businessId, ownerId) {
      return (
        entries.find(
          (value) =>
            value.businessId === businessId && value.ownerId === ownerId,
        )?.settings ?? null
      );
    },
    async update(businessId, ownerId, input: SettingsUpdate) {
      const found = entries.find(
        (value) => value.businessId === businessId && value.ownerId === ownerId,
      );
      if (!found) return null;
      found.settings = { ...found.settings, ...input };
      return found.settings;
    },
  };
}
