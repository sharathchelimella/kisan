import type { FarmerLookupPort, ServiceLookupPort } from "@kisan/contracts";
import { demoFarmers } from "./fixtures";

export const demoBusinessId = "DEMO-business-1";

export const demoLookups: FarmerLookupPort & ServiceLookupPort = {
  async findFarmer(businessId, id) {
    if (businessId !== demoBusinessId) return null;
    return demoFarmers.find((farmer) => farmer.id === id) ?? null;
  },
  async findService() {
    return null;
  },
};
