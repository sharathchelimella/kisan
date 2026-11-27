import {
  settingsSchema,
  settingsUpdateSchema,
  type Settings,
  type SettingsUpdate,
} from "@kisan/contracts";

export interface SettingsRepository {
  get(businessId: string, ownerId: string): Promise<Settings | null>;
  update(
    businessId: string,
    ownerId: string,
    input: SettingsUpdate,
  ): Promise<Settings | null>;
}
export function createSettingsService(repository: SettingsRepository) {
  return {
    async get(businessId: string, ownerId: string) {
      const value = await repository.get(businessId, ownerId);
      return value ? settingsSchema.parse(value) : null;
    },
    async update(businessId: string, ownerId: string, raw: unknown) {
      const input = settingsUpdateSchema.parse(raw);
      const value = await repository.update(businessId, ownerId, input);
      return value ? settingsSchema.parse(value) : null;
    },
  };
}
