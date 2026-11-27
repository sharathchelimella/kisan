import type { Dashboard } from "@kisan/contracts";
export interface DashboardClient {
  summary(query: Pick<Dashboard, "from" | "to" | "asOf">): Promise<Dashboard>;
}
