import { invoiceSchema, type Invoice } from "@kisan/contracts";
import { sumPaise } from "@kisan/domain";

export type AcceptedJobSnapshot = {
  id: string;
  farmerId: string;
  workDate: string;
  state: "COMPLETED";
  invoiceId: null;
  lines: {
    lineId: string;
    serviceId: string;
    equipmentIds: string[];
    serviceNameSnapshot: string;
    unit: Invoice["lines"][number]["unit"];
    quantity: string;
    defaultRateSnapshotPaise: number;
    agreedRatePaise?: number;
    totalPaise: number;
  }[];
  totalPaise: number;
  farmer: Invoice["farmerSnapshot"];
  owner: Invoice["ownerSnapshot"];
};
export interface InvoiceRepository {
  existing(businessId: string, jobId: string): Promise<Invoice | null>;
  acceptedJob(
    businessId: string,
    jobId: string,
  ): Promise<AcceptedJobSnapshot | null>;
  issueAtomic(businessId: string, job: AcceptedJobSnapshot): Promise<Invoice>;
  list(
    businessId: string,
    query: InvoiceQuery,
  ): Promise<{
    items: Invoice[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  get(businessId: string, id: string): Promise<Invoice | null>;
  void(businessId: string, id: string, reason: string): Promise<Invoice | null>;
}
export type InvoiceQuery = {
  q?: string;
  status?: Invoice["status"];
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};
export class InvoiceUnavailable extends Error {}
export class InvoiceConflict extends Error {}
export function createInvoiceService(repository: InvoiceRepository) {
  return {
    async issue(businessId: string, jobId: string) {
      const existing = await repository.existing(businessId, jobId);
      if (existing) return existing;
      const job = await repository.acceptedJob(businessId, jobId);
      if (!job) throw new InvoiceUnavailable("Completed work unavailable");
      if (
        !job.lines.length ||
        sumPaise(job.lines.map((line) => line.totalPaise)) !== job.totalPaise
      )
        throw new InvoiceConflict("Work amount mismatch");
      return invoiceSchema.parse(await repository.issueAtomic(businessId, job));
    },
    list: repository.list.bind(repository),
    get: repository.get.bind(repository),
    async void(businessId: string, id: string, reason: string) {
      const invoice = await repository.void(businessId, id, reason);
      if (!invoice) throw new InvoiceConflict("Invoice cannot be voided");
      return invoice;
    },
  };
}
