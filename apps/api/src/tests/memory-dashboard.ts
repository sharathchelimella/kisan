import type { Dashboard } from "@kisan/contracts";
import type { DashboardReadRepository } from "../services/dashboard.service";

export function memoryDashboard(
  data: Omit<Dashboard, "from" | "to" | "asOf"> = {
    workValuePaise: 0,
    collectionsPaise: 0,
    outstandingPaise: 0,
    farmerCount: 0,
    completedJobCount: 0,
    todayWorkPaise: 0,
    todayCollectionsPaise: 0,
    recentActivity: [],
  },
): DashboardReadRepository {
  return {
    async summary() {
      return data;
    },
  };
}
