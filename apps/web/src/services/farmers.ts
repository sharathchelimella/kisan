import { z } from "zod";
import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  farmerSchema,
  farmerPageSchema,
  type Farmer,
  type FarmerInput,
  type FarmerMatches,
  type FarmerPage,
  type FarmerQuery,
} from "@kisan/contracts";
import { demoFarmersClient } from "../mocks/farmers";

export interface FarmersClient {
  list(query: FarmerQuery): Promise<FarmerPage>;
  get(id: string): Promise<Farmer>;
  save(input: FarmerInput, id?: string): Promise<Farmer>;
  archive(id: string): Promise<Farmer>;
  matches(input: FarmerMatches): Promise<Farmer[]>;
}
async function request(path: string, method = "GET", body?: object) {
  const response = await fetch(API_PREFIX + "/farmers" + path, {
    method,
    headers: {
      [AUTH_REQUEST_HEADER]: "1",
      ...(body && { "Content-Type": "application/json" }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()).data as unknown;
}
const httpFarmers: FarmersClient = {
  async list(query) {
    const params = new URLSearchParams(
      Object.entries(query)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
    return farmerPageSchema.parse(await request("?" + params));
  },
  async get(id) {
    return farmerSchema.parse(await request("/" + encodeURIComponent(id)));
  },
  async save(input, id) {
    return farmerSchema.parse(
      await request(
        id ? "/" + encodeURIComponent(id) : "",
        id ? "PATCH" : "POST",
        input,
      ),
    );
  },
  async archive(id) {
    return farmerSchema.parse(
      await request("/" + encodeURIComponent(id) + "/archive", "POST"),
    );
  },
  async matches(input) {
    return z
      .array(farmerSchema)
      .parse(await request("/duplicates", "POST", input));
  },
};
export const farmersClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demoFarmersClient
    : httpFarmers;
