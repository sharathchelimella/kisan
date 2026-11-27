import { API_PREFIX, dashboardSchema } from "@kisan/contracts";
import type { DashboardClient } from "../models/dashboard";
import { demoDashboard } from "../mocks/dashboard";

const http: DashboardClient = {
  async summary(query) {
    const result = await fetch(
      `${API_PREFIX}/dashboard?${new URLSearchParams(query)}`,
    );
    if (!result.ok) throw new Error("Dashboard unavailable");
    return dashboardSchema.parse((await result.json()).data);
  },
};
export const dashboardClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demoDashboard
    : http;
