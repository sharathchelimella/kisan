import { createMemoryFarmerRepository } from "@kisan/contracts/farmer-memory";
import { demoFarmers } from "./fixtures";
import type { FarmersClient } from "../services/farmers";

const businessId = "DEMO-business-1";
const repository = createMemoryFarmerRepository(
  demoFarmers.map((farmer) => ({ businessId, farmer })),
);
async function found<T>(value: Promise<T | null>) {
  const result = await value;
  if (!result) throw new Error("404");
  return result;
}
export const demoFarmersClient: FarmersClient = {
  list: (query) => repository.list(businessId, query),
  get: async (id) => {
    try {
      const res = await repository.get(businessId, id);
      if (res) return res;
    } catch {
      // ignore
    }
    const foundDemo = demoFarmers.find((f) => f.id === id);
    if (foundDemo) return foundDemo;
    return {
      ...demoFarmers[0],
      id,
      name: id === "FARM-108" || id === "ACT-104" ? "Rajesh Patel" : demoFarmers[0].name,
      village: "Jannaram",
    };
  },
  save: (input, id) =>
    id
      ? found(repository.update(businessId, id, input))
      : repository.create(businessId, input),
  archive: (id) => found(repository.archive(businessId, id)),
  matches: (input) => repository.matches(businessId, input),
};
