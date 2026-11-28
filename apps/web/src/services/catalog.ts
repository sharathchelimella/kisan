import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  equipmentPageSchema,
  servicePageSchema,
  equipmentSchema,
  serviceSchema,
  type CatalogQuery,
  type calculateEquipmentAnalytics,
} from "@kisan/contracts";
import type { CatalogClient } from "../models/catalog";
import { demoCatalog } from "../mocks/catalog";

async function request(path: string, method = "GET", body?: object) {
  const response = await fetch(API_PREFIX + path, {
    method,
    headers: { [AUTH_REQUEST_HEADER]: "1", "Content-Type": "application/json" },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()).data as unknown;
}
function params(query: CatalogQuery) {
  return (
    "?" +
    new URLSearchParams(
      Object.entries(query).map(([key, value]) => [key, String(value)]),
    )
  );
}
const httpCatalog: CatalogClient = {
  async analytics(from, to) {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    return await request("/equipment/analytics" + (query.size ? "?" + query : "")) as ReturnType<typeof calculateEquipmentAnalytics>;
  },
  async equipment(query) {
    return equipmentPageSchema.parse(
      await request("/equipment" + params(query)),
    );
  },
  async services(query) {
    return servicePageSchema.parse(await request("/services" + params(query)));
  },
  async saveEquipment(input, id) {
    return equipmentSchema.parse(
      await request(
        "/equipment" + (id ? "/" + encodeURIComponent(id) : ""),
        id ? "PATCH" : "POST",
        input,
      ),
    );
  },
  async saveService(input, id) {
    return serviceSchema.parse(
      await request(
        "/services" + (id ? "/" + encodeURIComponent(id) : ""),
        id ? "PATCH" : "POST",
        input,
      ),
    );
  },
  async getEquipment(id) {
    try {
      const result = await request("/equipment/" + encodeURIComponent(id));
      return equipmentSchema.parse(result);
    } catch {
      return null;
    }
  },
};
export const catalogClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demoCatalog
    : httpCatalog;
