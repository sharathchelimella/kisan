import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  jobSchema,
  type JobInput,
} from "@kisan/contracts";
import { farmersClient } from "./farmers";
import { catalogClient } from "./catalog";
import type { JobClient } from "../models/job";
import { demoJobClient } from "../mocks/jobs";

const httpJobs: JobClient = {
  async farmers() {
    const result = await farmersClient.list({
      page: 1,
      pageSize: 100,
      archived: "false",
    });
    return result.items.map(({ id, name, village }) => ({ id, name, village }));
  },
  async services() {
    const result = await catalogClient.services({
      page: 1,
      pageSize: 100,
      active: "true",
    });
    return result.items.map(
      ({ id, name, unit, defaultRatePaise, equipmentIds }) => ({
        id,
        name,
        unit,
        defaultRatePaise,
        equipmentIds,
      }),
    );
  },
  async save(input: JobInput) {
    const response = await fetch(API_PREFIX + "/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [AUTH_REQUEST_HEADER]: "1",
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Could not save work");
    return jobSchema.parse((await response.json()).data);
  },
};
export const jobClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demoJobClient
    : httpJobs;
