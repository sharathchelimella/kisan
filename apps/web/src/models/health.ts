import type { ApiSuccess, Health } from "@kisan/contracts";

export interface HealthService {
  getHealth(): Promise<ApiSuccess<Health>>;
}
