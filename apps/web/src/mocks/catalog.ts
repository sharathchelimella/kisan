import { createMemoryCatalog } from "@kisan/contracts/catalog-memory";
import type { CatalogClient } from "../models/catalog";
import { calculateEquipmentAnalytics } from "@kisan/contracts";

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
  repository.equipmentCreate(businessId, {
    name: "DEMO Plough",
    kind: "PLOUGH",
    active: true,
  }),
  repository.equipmentCreate(businessId, {
    name: "DEMO Cultivator",
    kind: "CULTIVATOR",
    active: true,
  }),
  repository.equipmentCreate(businessId, {
    name: "DEMO Disc Harrow",
    kind: "HARROW",
    active: true,
  }),
]).then(async ([tractor, rotavator, trolley, plough, cultivator, harrow]) => {
  await Promise.all([
    repository.serviceCreate(businessId, {
      name: "Tractor + Rotavator",
      unit: "ACRE",
      defaultRatePaise: 150000,
      equipmentIds: [tractor.id, rotavator.id],
      active: true,
    }),
    repository.serviceCreate(businessId, {
      name: "Tractor + Plough",
      unit: "ACRE",
      defaultRatePaise: 120000,
      equipmentIds: [tractor.id, plough.id],
      active: true,
    }),
    repository.serviceCreate(businessId, {
      name: "Tractor + Cultivator",
      unit: "ACRE",
      defaultRatePaise: 100000,
      equipmentIds: [tractor.id, cultivator.id],
      active: true,
    }),
    repository.serviceCreate(businessId, {
      name: "Tractor (General Work)",
      unit: "HOUR",
      defaultRatePaise: 80000,
      equipmentIds: [tractor.id],
      active: true,
    }),
    repository.serviceCreate(businessId, {
      name: "Tractor + Trailer",
      unit: "TRIP",
      defaultRatePaise: 200000,
      equipmentIds: [tractor.id, trolley.id],
      active: true,
    }),
    repository.serviceCreate(businessId, {
      name: "Tractor + Disc Harrow",
      unit: "ACRE",
      defaultRatePaise: 140000,
      equipmentIds: [tractor.id, harrow.id],
      active: true,
    }),
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
  async analytics(from, to) {
    await ready;
    const { demoJobs } = await import("./jobs");
    const page = await repository.equipmentList(businessId, { active: "all", page: 1, pageSize: 100 });
    const fixtureIds: Record<string, string | undefined> = {
      "DEMO-tractor": page.items.find((item) => item.kind === "TRACTOR")?.id,
      "DEMO-rotavator": page.items.find((item) => item.kind === "ROTAVATOR")?.id,
      "DEMO-trolley": page.items.find((item) => item.kind === "TROLLEY")?.id,
    };
    const jobs = demoJobs.filter((job) => (!from || job.workDate >= from) && (!to || job.workDate <= to))
      .map((job) => ({ ...job, lines: job.lines.map((line) => ({ ...line,
        equipmentIds: line.equipmentIds.map((id) => fixtureIds[id] ?? id),
      })) }));
    return calculateEquipmentAnalytics(page.items, jobs, from, to);
  },
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

    if (id === "DEMO-tractor") return list.items.find((item) => item.kind === "TRACTOR") ?? null;
    if (id === "DEMO-rotavator") return list.items.find((item) => item.kind === "ROTAVATOR") ?? null;
    return null;
  },
};
