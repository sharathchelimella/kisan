import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  jobPageSchema,
  jobRecordSchema,
  type JobPage,
  type JobQuery,
  type JobRecord,
} from "@kisan/contracts";
import { demoJobs } from "../mocks/jobs";
import { demoFarmers } from "../mocks/fixtures";

export interface JobReadClient {
  list(query: JobQuery): Promise<JobPage>;
  get(id: string): Promise<JobRecord | null>;
  cancel(id: string, reason: string): Promise<JobRecord>;
}
const http: JobReadClient = {
  async list(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined && value !== "") params.set(key, String(value));
    const response = await fetch(`${API_PREFIX}/jobs?${params}`);
    if (!response.ok) throw new Error("Could not load work records");
    return jobPageSchema.parse((await response.json()).data);
  },
  async get(id) {
    const response = await fetch(
      `${API_PREFIX}/jobs/${encodeURIComponent(id)}`,
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Could not load work record");
    return jobRecordSchema.parse((await response.json()).data);
  },
  async cancel(id, reason) {
    const response = await fetch(
      `${API_PREFIX}/jobs/${encodeURIComponent(id)}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [AUTH_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({ reason }),
      },
    );
    if (!response.ok) throw new Error("Could not cancel work record");
    return jobRecordSchema.parse((await response.json()).data);
  },
};
const demo: JobReadClient = {
  async list(query) {
    const search = query.q?.toLowerCase();
    const filtered = demoJobs.filter(
      (job) =>
        (!query.farmerId || job.farmerId === query.farmerId) &&
        (!query.from || job.workDate >= query.from) &&
        (!query.to || job.workDate <= query.to) &&
        (!query.village ||
          job.village.toLowerCase().includes(query.village.toLowerCase())) &&
        (!query.serviceId ||
          job.lines.some((line) => line.serviceId === query.serviceId)) &&
        (!query.equipmentId ||
          job.lines.some((line) =>
            line.equipmentIds.includes(query.equipmentId!),
          )) &&
        (!query.state || job.state === query.state) &&
        (!search ||
          job.id.toLowerCase().includes(search) ||
          job.village.toLowerCase().includes(search) ||
          demoFarmers
            .find((farmer) => farmer.id === job.farmerId)
            ?.name.toLowerCase()
            .includes(search)),
    );
    filtered.sort(
      (a, b) =>
        (a.workDate.localeCompare(b.workDate) || a.id.localeCompare(b.id)) *
        (query.sort === "oldest" ? 1 : -1),
    );
    return {
      items: filtered
        .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
        .map((job) => ({
          id: job.id,
          farmerId: job.farmerId,
          farmerName:
            demoFarmers.find((farmer) => farmer.id === job.farmerId)?.name ??
            "—",
          workDate: job.workDate,
          village: job.village,
          state: job.state,
          totalPaise: job.totalPaise,
          invoiceId: job.invoiceId,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          services: job.lines.map((line) => line.serviceNameSnapshot),
        })),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async get(id) {
    const job = demoJobs.find((value) => value.id === id);
    if (job) return { ...job, revisions: (job as JobRecord).revisions ?? [] };
    if (id.startsWith("ACT") || id.startsWith("WRK")) {
      return { ...demoJobs[0], id, revisions: [] };
    }
    return null;
  },
  async cancel(id, reason) {
    const job = demoJobs.find((value) => value.id === id);
    if (!job || job.invoiceId || !["DRAFT", "COMPLETED"].includes(job.state))
      throw new Error("Cannot cancel work record");
    job.state = "CANCELLED";
    const record = job as JobRecord;
    record.revisions = [
      ...(record.revisions ?? []),
      {
        action: "CANCELLED",
        reason,
        actorId: "DEMO-owner",
        at: new Date().toISOString(),
      },
    ];
    return record;
  },
};
export const jobReadClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demo
    : http;
