import { createMemoryCatalog } from "@kisan/contracts/catalog-memory";
import type { CatalogClient } from "../models/catalog";

const repository = createMemoryCatalog();
const businessId = "DEMO-business-1";
const ready = Promise.all([
  repository.equipmentCreate(businessId, {
    name: "DEMO Tractor",
    kind: "TRACTOR",
    active: true,
  }),
  repository.equipmentCreate(businessId, {
    name: "DEMO Rotavator",
    kind: "ROTAVATOR",
    active: true,
  }),
  repository.equipmentCreate(businessId, {
    name: "DEMO Trolley",
    kind: "TROLLEY",
    active: true,
  }),
]).then(async ([tractor, rotavator, trolley]) => {
  await Promise.all([
    repository.serviceCreate(businessId, {
      name: "DEMO Field preparation",
      unit: "ACRE",
      defaultRatePaise: 170000,
      equipmentIds: [tractor.id, rotavator.id],
      active: true,
    }),
    repository.serviceCreate(businessId, {
      name: "DEMO Trolley trip",
      unit: "TRIP",
      defaultRatePaise: 50000,
      equipmentIds: [tractor.id, trolley.id],
      active: true,
    }),
  ]);
});
async function required<T>(promise: Promise<T | null>) {
  const result = await promise;
  if (!result) throw new Error("404");
  return result;
}
export const demoCatalog: CatalogClient = {
  async equipment(query) {
    await ready;
    return repository.equipmentList(businessId, query);
  },
  async services(query) {
    await ready;
    return repository.serviceList(businessId, query);
  },
  saveEquipment: (input, id) =>
    id
      ? required(repository.equipmentUpdate(businessId, id, input))
      : repository.equipmentCreate(businessId, input),
  async saveService(input, id) {
    if (!(await repository.equipmentExist(businessId, input.equipmentIds)))
      throw new Error("422");
    return id
      ? required(repository.serviceUpdate(businessId, id, input))
      : repository.serviceCreate(businessId, input);
  },
  async getEquipment(id) {
    await ready;
    const list = await repository.equipmentList(businessId, {
      active: "all",
      page: 1,
      pageSize: 100,
    });
    const found = list.items.find((item) => item.id === id);
    if (found) return found;

    if (id === "DEMO-tractor" || id.toLowerCase().includes("tractor")) {
      return {
        id: "DEMO-tractor",
        name: "Mahindra 575 DI (45 HP)",
        kind: "TRACTOR",
        serialOrRegistration: "TS-19-TR-1001",
        active: true,
      };
    }
    if (id === "DEMO-rotavator" || id.toLowerCase().includes("rotavator")) {
      return {
        id: "DEMO-rotavator",
        name: "Shaktiman 7ft Rotavator",
        kind: "ROTAVATOR",
        serialOrRegistration: "ROT-2024-88",
        active: true,
      };
    }
    return list.items[0] || null;
  },
};
