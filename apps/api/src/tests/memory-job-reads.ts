import type { Job, JobPage, JobQuery, JobRecord } from "@kisan/contracts";
import type { JobReadRepository } from "../services/job-read.repository";

export function memoryJobReads(
  seed: { businessId: string; farmerName: string; job: Job }[] = [],
): JobReadRepository & { entries: typeof seed } {
  const entries = [...seed];
  return {
    entries,
    async list(businessId, query: JobQuery): Promise<JobPage> {
      const q = query.q?.toLowerCase();
      const found = entries.filter(
        ({ businessId: owner, farmerName, job }) =>
          owner === businessId &&
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
          (!q ||
            job.id.toLowerCase().includes(q) ||
            farmerName.toLowerCase().includes(q) ||
            job.village.toLowerCase().includes(q)),
      );
      found.sort(
        (a, b) =>
          (a.job.workDate.localeCompare(b.job.workDate) ||
            a.job.id.localeCompare(b.job.id)) *
          (query.sort === "oldest" ? 1 : -1),
      );
      return {
        items: found
          .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
          .map(({ farmerName, job }) => ({
            id: job.id,
            farmerId: job.farmerId,
            farmerName,
            workDate: job.workDate,
            village: job.village,
            state: job.state,
            totalPaise: job.totalPaise,
            invoiceId: job.invoiceId,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
            services: job.lines.map((line) => line.serviceNameSnapshot),
          })),
        total: found.length,
        page: query.page,
        pageSize: query.pageSize,
      };
    },
    async get(businessId, id) {
      const item = entries.find(
        (value) => value.businessId === businessId && value.job.id === id,
      );
      return item
        ? { ...item.job, revisions: (item.job as JobRecord).revisions ?? [] }
        : null;
    },
    async cancel(businessId, id, actorId, reason) {
      const item = entries.find(
        (value) => value.businessId === businessId && value.job.id === id,
      );
      if (
        !item ||
        item.job.invoiceId ||
        !["DRAFT", "COMPLETED"].includes(item.job.state)
      )
        return null;
      item.job.state = "CANCELLED";
      const record = item.job as JobRecord;
      record.revisions = [
        ...(record.revisions ?? []),
        { action: "CANCELLED", reason, actorId, at: new Date().toISOString() },
      ];
      return record;
    },
  };
}
