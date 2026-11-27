import {
  farmerDirectoryQuerySchema,
  farmerMatchesSchema,
  farmerPatchSchema,
  farmerWriteSchema,
} from "@kisan/contracts";
import type { FarmerRepository } from "./farmer.repository";

export function createFarmerService(repository: FarmerRepository) {
  return {
    list: (businessId: string, query: unknown) =>
      repository.list(businessId, farmerDirectoryQuerySchema.parse(query)),
    get: (businessId: string, id: string) => repository.get(businessId, id),
    create: (businessId: string, input: unknown) =>
      repository.create(businessId, farmerWriteSchema.parse(input)),
    update: (businessId: string, id: string, input: unknown) =>
      repository.update(businessId, id, farmerPatchSchema.parse(input)),
    archive: (businessId: string, id: string) =>
      repository.archive(businessId, id),
    matches: (businessId: string, input: unknown) =>
      repository.matches(businessId, farmerMatchesSchema.parse(input)),
  };
}
export type FarmerService = ReturnType<typeof createFarmerService>;
