import type { HealthService } from "../models/health";

export const mockHealth: HealthService = {
  async getHealth() {
    return { data: { status: "ok" }, meta: { requestId: "DEMO-health" } };
  },
};
