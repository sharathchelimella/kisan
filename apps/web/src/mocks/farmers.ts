import { createMemoryFarmerRepository } from "@kisan/contracts/farmer-memory";
import { all124DemoFarmers } from "./farmer-dataset";
import type { FarmersClient } from "../services/farmers";

const businessId = "DEMO-business-1";
const repository = createMemoryFarmerRepository(
  all124DemoFarmers.map((farmer) => ({ businessId, farmer })),
);
async function found<T>(value: Promise<T | null>) {
  const result = await value;
  if (!result) throw new Error("404");
  return result;
}
export const demoFarmersClient: FarmersClient = {
  list: (query) => repository.list(businessId, query),
  summary: () => repository.summary(businessId),
  get: async (id) => {
    try {
      const res = await repository.get(businessId, id);
      if (res) return res;
    } catch {
      // ignore
    }
    const foundDemo = all124DemoFarmers.find((f) => f.id === id);
    if (foundDemo) return foundDemo;
    return all124DemoFarmers[0];
  },
  save: (input, id) =>
    id
      ? found(repository.update(businessId, id, input))
      : repository.create(businessId, input),
  archive: (id) => found(repository.archive(businessId, id)),
  delete: (id) => repository.delete(businessId, id),
  matches: (input) => repository.matches(businessId, input),
};
