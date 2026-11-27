import { dashboardSchema, type Dashboard } from "@kisan/contracts";

export interface DashboardReadRepository {
  summary(
    businessId: string,
    period: Pick<Dashboard, "from" | "to" | "asOf">,
  ): Promise<Omit<Dashboard, "from" | "to" | "asOf">>;
}
export function createDashboardService(repository: DashboardReadRepository) {
  return async (
    businessId: string,
    period: Pick<Dashboard, "from" | "to" | "asOf">,
  ) =>
    dashboardSchema.parse({
      ...period,
      ...(await repository.summary(businessId, period)),
    });
}
