import { randomUUID } from "node:crypto";
import type {
  Job,
  JobFarmerSummary,
  JobServiceSummary,
} from "@kisan/contracts";
import type { JobPorts } from "../services/job.service";

export function memoryJobPorts(
  farmers: JobFarmerSummary[],
  services: JobServiceSummary[],
): JobPorts & { jobs: Job[] } {
  const jobs: Job[] = [];
  return {
    jobs,
    async farmer(_businessId, id) {
      return farmers.find((value) => value.id === id) ?? null;
    },
    async service(_businessId, id) {
      return services.find((value) => value.id === id) ?? null;
    },
    async save(_businessId, _actorId, job) {
      const now = new Date().toISOString();
      const saved: Job = {
        ...job,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      jobs.push(saved);
      return saved;
    },
  };
}
