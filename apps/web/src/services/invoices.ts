import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  invoiceSchema,
  type Invoice,
} from "@kisan/contracts";
import { demoJobs } from "../mocks/jobs";
import { demoFarmers } from "../mocks/fixtures";
import { demoSession } from "../mocks/auth";

export type InvoicePage = {
  items: Invoice[];
  total: number;
  page: number;
  pageSize: number;
};
export type InvoiceQuery = {
  q?: string;
  status?: string;
  page: number;
  pageSize: number;
};
export interface InvoiceClient {
  list(query: InvoiceQuery): Promise<InvoicePage>;
  get(id: string): Promise<Invoice | null>;
  issue(jobId: string): Promise<Invoice>;
  void(id: string, reason: string): Promise<Invoice>;
  pdf(id: string): Promise<Blob>;
}
const http: InvoiceClient = {
  async list(query) {
    const url = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      ...(query.q && { q: query.q }),
      ...(query.status && { status: query.status }),
    });
    const res = await fetch(`${API_PREFIX}/invoices?${url}`);
    if (!res.ok) throw new Error("Invoices unavailable");
    const data = (await res.json()).data as InvoicePage;
    return {
      ...data,
      items: data.items.map((item) => invoiceSchema.parse(item)),
    };
  },
  async get(id) {
    const res = await fetch(`${API_PREFIX}/invoices/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Invoice unavailable");
    return invoiceSchema.parse((await res.json()).data);
  },
  async issue(jobId) {
    const res = await fetch(`${API_PREFIX}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [AUTH_REQUEST_HEADER]: "1",
      },
      body: JSON.stringify({ jobId }),
    });
    if (!res.ok) throw new Error("Could not issue invoice");
    return invoiceSchema.parse((await res.json()).data);
  },
  async void(id, reason) {
    const res = await fetch(
      `${API_PREFIX}/invoices/${encodeURIComponent(id)}/void`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [AUTH_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({ reason }),
      },
    );
    if (!res.ok) throw new Error("Could not void invoice");
    return invoiceSchema.parse((await res.json()).data);
  },
  async pdf(id) {
    const res = await fetch(
      `${API_PREFIX}/invoices/${encodeURIComponent(id)}/pdf`,
    );
    if (!res.ok) throw new Error("PDF unavailable");
    return res.blob();
  },
};
export const demoInvoices: Invoice[] = [
  {
    id: "DEMO-invoice-1",
    jobId: "DEMO-work-1001",
    farmerId: demoFarmers[0].id,
    invoiceNumber: "KMM-000001",
    sequence: 1,
    lifecycle: "ISSUED",
    issuedAt: "2026-11-19T09:00:00.000Z",
    workDate: "2026-11-18",
    farmerSnapshot: {
      name: demoFarmers[0].name,
      mobile: demoFarmers[0].mobile,
      village: demoFarmers[0].village,
    },
    ownerSnapshot: {
      name: demoSession.business.name,
      address: demoSession.business.village,
    },
    lines: [
      {
        lineId: "DEMO-line-1",
        serviceId: "DEMO-service-1",
        equipmentIds: ["DEMO-tractor", "DEMO-rotavator"],
        serviceName: "DEMO Field preparation",
        unit: "ACRE",
        quantity: "3.5",
        ratePaise: 170000,
        amountPaise: 595000,
      },
    ],
    totalPaise: 595000,
    paidPaise: 0,
    duePaise: 595000,
    status: "UNPAID",
    version: 1,
  },
];
const demo: InvoiceClient = {
  async list(query) {
    const found = demoInvoices.filter(
      (item) =>
        (!query.q ||
          item.invoiceNumber.toLowerCase().includes(query.q.toLowerCase()) ||
          item.farmerSnapshot.name
            .toLowerCase()
            .includes(query.q.toLowerCase())) &&
        (!query.status || item.status === query.status),
    );
    return {
      items: found.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize,
      ),
      total: found.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async get(id) {
    const found = demoInvoices.find(
      (item) => item.id === id || item.invoiceNumber === id,
    );
    if (found) return found;
    if (id.startsWith("ACT") || id.startsWith("KMM")) {
      return { ...demoInvoices[0], id, invoiceNumber: id };
    }
    return null;
  },
  async issue(jobId) {
    const existing = demoInvoices.find((item) => item.jobId === jobId);
    if (existing) return existing;
    const job = demoJobs.find(
      (item) => item.id === jobId && item.state === "COMPLETED",
    );
    if (!job) throw new Error("Completed job unavailable");
    const farmer = demoFarmers.find((item) => item.id === job.farmerId);
    if (!farmer) throw new Error("Farmer unavailable");
    const sequence = demoInvoices.length + 1;
    const invoice: Invoice = {
      id: `DEMO-invoice-${sequence}`,
      jobId,
      farmerId: job.farmerId,
      invoiceNumber: `KMM-${String(sequence).padStart(6, "0")}`,
      sequence,
      lifecycle: "ISSUED",
      issuedAt: new Date().toISOString(),
      workDate: job.workDate,
      farmerSnapshot: { name: farmer.name, village: farmer.village },
      ownerSnapshot: {
        name: demoSession.business.name,
        address: demoSession.business.village,
      },
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
    demoInvoices.push(invoice);
    job.state = "BILLED";
    job.invoiceId = invoice.id;
    return invoice;
  },
  async void(id, reason) {
    const invoice = demoInvoices.find(
      (item) =>
        item.id === id && item.lifecycle === "ISSUED" && item.paidPaise === 0,
    );
    if (!invoice) throw new Error("Cannot void invoice");
    invoice.lifecycle = "VOID";
    invoice.status = "VOID";
    invoice.voidReason = reason;
    invoice.version++;
    return invoice;
  },
  async pdf() {
    throw new Error("PDF requires the live API");
  },
};
export const invoiceClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demo
    : http;
