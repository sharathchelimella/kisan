import { z } from "zod";
import { API_PREFIX, healthSchema } from "@kisan/contracts";
import { mockHealth } from "../mocks/health";

import type { HealthService } from "../models/health";

const responseSchema = z.object({
  data: healthSchema,
  meta: z.object({ requestId: z.string() }),
});

const httpHealth: HealthService = {
  async getHealth() {
    const response = await fetch(`${API_PREFIX}/health`);
    if (!response.ok)
      throw new Error(`Health request failed with HTTP ${response.status}`);
    return responseSchema.parse(await response.json());
  },
};

export const healthService =
  import.meta.env.VITE_USE_MOCK_API === "true" ? mockHealth : httpHealth;
