import type { Invoice } from "@kisan/contracts";
import type {
  AcceptedJobSnapshot,
  InvoiceRepository,
} from "../services/invoice.service";

export function memoryInvoices(
  seed: { businessId: string; job: AcceptedJobSnapshot }[] = [],
): InvoiceRepository {
  const invoices: { businessId: string; value: Invoice }[] = [];
  const queue = new Map<string, Promise<void>>();
  return {
    async existing(businessId, jobId) {
      return (
        invoices.find(
          (item) =>
            item.businessId === businessId && item.value.jobId === jobId,
        )?.value ?? null
      );
    },
    async acceptedJob(businessId, jobId) {
      return (
        seed.find(
          (item) =>
            item.businessId === businessId &&
            item.job.id === jobId &&
            !invoices.some(
              (value) =>
                value.businessId === businessId && value.value.jobId === jobId,
            ),
        )?.job ?? null
      );
    },
    async issueAtomic(businessId, job) {
      const previous = queue.get(businessId) ?? Promise.resolve();
      let release!: () => void;
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });
      queue.set(
        businessId,
        previous.then(() => current),
      );
      await previous;
      try {
        const existing = invoices.find(
          (item) =>
            item.businessId === businessId && item.value.jobId === job.id,
        )?.value;
        if (existing) return existing;
        const sequence =
          invoices.filter((item) => item.businessId === businessId).length + 1;
        const invoice: Invoice = {
          id: `invoice-${businessId}-${sequence}`,
          jobId: job.id,
          farmerId: job.farmerId,
          invoiceNumber: `KMM-${String(sequence).padStart(6, "0")}`,
          sequence,
          lifecycle: "ISSUED",
          issuedAt: new Date().toISOString(),
          workDate: job.workDate,
          farmerSnapshot: job.farmer,
          ownerSnapshot: job.owner,
          lines: job.lines.map((line) => ({
            lineId: line.lineId,
            serviceId: line.serviceId,
            equipmentIds: line.equipmentIds,
            serviceName: line.serviceNameSnapshot,
            unit: line.unit,
            quantity: line.quantity,
            ratePaise: line.agreedRatePaise ?? line.defaultRateSnapshotPaise,
            amountPaise: line.totalPaise,
          })),
          totalPaise: job.totalPaise,
          paidPaise: 0,
          duePaise: job.totalPaise,
          status: "UNPAID",
          version: 1,
        };
        invoices.push({ businessId, value: invoice });
        return invoice;
      } finally {
        release();
      }
    },
    async list(businessId, query) {
      const found = invoices.filter(
        (item) =>
          item.businessId === businessId &&
          (!query.status || item.value.status === query.status) &&
          (!query.q || item.value.invoiceNumber.includes(query.q)),
      );
      return {
        items: found
          .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
          .map((item) => item.value),
        total: found.length,
        page: query.page,
        pageSize: query.pageSize,
      };
    },
    async get(businessId, id) {
      return (
        invoices.find(
          (item) => item.businessId === businessId && item.value.id === id,
        )?.value ?? null
      );
    },
    async void(businessId, id, reason) {
      const item = invoices.find(
        (item) =>
          item.businessId === businessId &&
          item.value.id === id &&
          item.value.lifecycle === "ISSUED" &&
          item.value.paidPaise === 0,
      );
      if (!item) return null;
      item.value.lifecycle = "VOID";
      item.value.status = "VOID";
      item.value.voidReason = reason;
      item.value.version++;
      return item.value;
    },
  };
}
