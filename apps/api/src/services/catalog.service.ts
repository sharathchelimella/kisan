import {
  catalogQuerySchema,
  equipmentWriteSchema,
  equipmentPatchSchema,
  serviceWriteSchema,
  servicePatchSchema,
} from "@kisan/contracts";
import type { CatalogRepository } from "./catalog.repository";

export class CatalogReferenceError extends Error {}
export function createCatalogService(repository: CatalogRepository) {
  async function references(businessId: string, ids?: string[]) {
    if (ids && !(await repository.equipmentExist(businessId, ids)))
      throw new CatalogReferenceError();
  }
  return {
    equipmentList: (businessId: string, query: unknown) =>
      repository.equipmentList(businessId, catalogQuerySchema.parse(query)),
    serviceList: (businessId: string, query: unknown) =>
      repository.serviceList(businessId, catalogQuerySchema.parse(query)),
    equipmentCreate: (businessId: string, body: unknown) =>
      repository.equipmentCreate(businessId, equipmentWriteSchema.parse(body)),
    equipmentUpdate: (businessId: string, id: string, body: unknown) =>
      repository.equipmentUpdate(
        businessId,
        id,
        equipmentPatchSchema.parse(body),
      ),
    async serviceCreate(businessId: string, body: unknown) {
      const input = serviceWriteSchema.parse(body);
      await references(businessId, input.equipmentIds);
      return repository.serviceCreate(businessId, input);
    },
    async serviceUpdate(
      businessId: string,
      id: string,
      body: unknown,
      actorId: string,
    ) {
      const input = servicePatchSchema.parse(body);
      await references(businessId, input.equipmentIds);
      return repository.serviceUpdate(businessId, id, input, actorId);
    },
  };
}
