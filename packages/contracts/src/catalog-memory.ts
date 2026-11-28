import type { Equipment, Service } from "./machinery.contract";
import type {
  EquipmentInput,
  EquipmentPatch,
  ServiceInput,
  ServicePatch,
  CatalogQuery,
} from "./catalog";

export function createMemoryCatalog() {
  const equipment = new Map<string, Equipment & { businessId: string }>();
  const services = new Map<string, Service & { businessId: string }>();
  function publicRecord<T extends { businessId: string }>(record: T) {
    const { businessId: _businessId, ...value } = record;
    void _businessId;
    return structuredClone(value);
  }
  function list<
    T extends { businessId: string; active: boolean; name: string; id: string },
  >(records: Map<string, T>, businessId: string, query: CatalogQuery) {
    const all = [...records.values()]
      .filter(
        (record) =>
          record.businessId === businessId &&
          (query.active === "all" ||
            record.active === (query.active === "true")),
      )
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    return {
      items: all
        .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
        .map(publicRecord),
      total: all.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
  return {
    async equipmentGet(businessId: string, id: string) {
      const record = equipment.get(id);
      return record?.businessId === businessId ? publicRecord(record) : null;
    },
    async equipmentList(businessId: string, query: CatalogQuery) {
      return list(equipment, businessId, query);
    },
    async serviceList(businessId: string, query: CatalogQuery) {
      return list(services, businessId, query);
    },
    async equipmentCreate(businessId: string, input: EquipmentInput) {
      const record = { ...input, businessId, id: crypto.randomUUID() };
      equipment.set(record.id, record);
      return publicRecord(record);
    },
    async equipmentUpdate(
      businessId: string,
      id: string,
      input: EquipmentPatch,
    ) {
      const record = equipment.get(id);
      if (record?.businessId !== businessId) return null;
      Object.assign(record, input);
      return publicRecord(record);
    },
    async equipmentExist(businessId: string, ids: string[]) {
      return ids.every((id) => equipment.get(id)?.businessId === businessId);
    },
    async serviceCreate(businessId: string, input: ServiceInput) {
      const record = { ...input, businessId, id: crypto.randomUUID() };
      services.set(record.id, record);
      return publicRecord(record);
    },
    async serviceUpdate(businessId: string, id: string, input: ServicePatch) {
      const record = services.get(id);
      if (record?.businessId !== businessId) return null;
      Object.assign(record, input);
      return publicRecord(record);
    },
  };
}
