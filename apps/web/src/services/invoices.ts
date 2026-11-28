import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  invoiceSchema,
  type Invoice,
} from "@kisan/contracts";
import { demoJobs } from "../mocks/jobs";
import { demoFarmers } from "../mocks/fixtures";
import { demoSession } from "../mocks/auth";
import { INITIAL_INVOICES, type ExtendedInvoice } from "../mocks/invoice-dataset";

export type { ExtendedInvoice };

export type InvoiceTab = "ALL" | "PAID" | "PENDING" | "PARTIAL";

export type InvoiceTabCounts = {
  all: number;
  paid: number;
  pending: number;
  partial: number;
};

export type InvoicePage = {
  items: (Invoice | ExtendedInvoice)[];
  total: number;
  page: number;
  pageSize: number;
  counts?: InvoiceTabCounts;
};

export type InvoiceQuery = {
  tab?: InvoiceTab;
  q?: string;
  status?: string;
  dateRange?: string;
  machinery?: string;
  village?: string;
  page: number;
  pageSize: number;
};

export interface UnbilledWorkItem {
  id: string;
  farmerId: string;
  farmerName: string;
  village: string;
  workDate: string;
  serviceName: string;
  machineryName: string;
  unit: string;
  quantity: string;
  ratePaise: number;
  totalPaise: number;
}

export interface CreateBillInput {
  farmerId: string;
  farmerName: string;
  village: string;
  phone?: string;
  workDate: string;
  billDate: string;
  lines: {
    serviceName: string;
    unit: string;
    quantity: string;
    ratePaise: number;
    amountPaise: number;
  }[];
  notes?: string;
}

export interface InvoiceClient {
  list(query: InvoiceQuery): Promise<InvoicePage>;
  get(id: string): Promise<(Invoice | ExtendedInvoice) | null>;
  issue(jobId: string): Promise<Invoice | ExtendedInvoice>;
  createBill?(input: CreateBillInput): Promise<ExtendedInvoice>;
  unbilledWork?(farmerId?: string): Promise<UnbilledWorkItem[]>;
  void(id: string, reason: string): Promise<Invoice | ExtendedInvoice>;
  pdf(id: string): Promise<Blob>;
}

const http: InvoiceClient = {
  async list(query) {
    const url = new URLSearchParams({
      page: String(query.page),
      pageSize: String(query.pageSize),
      ...(query.tab && { tab: query.tab }),
      ...(query.q && { q: query.q }),
      ...(query.status && { status: query.status }),
      ...(query.machinery && { machinery: query.machinery }),
      ...(query.village && { village: query.village }),
      ...(query.dateRange && { dateRange: query.dateRange }),
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

// Mutable in-memory store initialized with the full 42-bill reconciled dataset
export const demoInvoices: ExtendedInvoice[] = [...INITIAL_INVOICES];

// Unbilled completed work fixture for the Create Bill workflow
export const demoUnbilledWork: UnbilledWorkItem[] = [
  {
    id: "UNBILLED-101",
    farmerId: "FARM-001",
    farmerName: "Ramesh Reddy",
    village: "Vempalli",
    workDate: "Jan 22, 2025",
    serviceName: "Rotavator (Fine Tilling)",
    machineryName: "Tractor + Rotavator",
    unit: "ACRE",
    quantity: "2.5",
    ratePaise: 100000,
    totalPaise: 250000,
  },
  {
    id: "UNBILLED-102",
    farmerId: "FARM-001",
    farmerName: "Ramesh Reddy",
    village: "Vempalli",
    workDate: "Jan 24, 2025",
    serviceName: "Ploughing (Field Prep)",
    machineryName: "Tractor + Plough",
    unit: "ACRE",
    quantity: "3.0",
    ratePaise: 120000,
    totalPaise: 360000,
  },
  {
    id: "UNBILLED-103",
    farmerId: "FARM-002",
    farmerName: "Suresh Naik",
    village: "Kottur",
    workDate: "Jan 21, 2025",
    serviceName: "Tractor Trolley (Mud)",
    machineryName: "Tractor + Trolley",
    unit: "TRIP",
    quantity: "3",
    ratePaise: 150000,
    totalPaise: 450000,
  },
  {
    id: "UNBILLED-104",
    farmerId: "FARM-003",
    farmerName: "Lakshmi Prasad",
    village: "Chintalapudi",
    workDate: "Jan 20, 2025",
    serviceName: "Cultivator Service",
    machineryName: "Tractor + Cultivator",
    unit: "ACRE",
    quantity: "4.0",
    ratePaise: 80000,
    totalPaise: 320000,
  },
  {
    id: "UNBILLED-105",
    farmerId: "FARM-004",
    farmerName: "Mohan Reddy",
    village: "Vempalli",
    workDate: "Jan 23, 2025",
    serviceName: "Rotavator",
    machineryName: "Tractor + Rotavator",
    unit: "ACRE",
    quantity: "2.0",
    ratePaise: 90000,
    totalPaise: 180000,
  },
];

const demo: InvoiceClient = {
  async list(query) {
    const qLower = (query.q || "").trim().toLowerCase();

    // 1. Non-tab filtering (Search, Village, Machinery, Date Range)
    const filteredBase = demoInvoices.filter((item) => {
      // Search
      if (qLower) {
        const match =
          item.invoiceNumber.toLowerCase().includes(qLower) ||
          item.farmerSnapshot.name.toLowerCase().includes(qLower) ||
          (item.farmerSnapshot.mobile && item.farmerSnapshot.mobile.toLowerCase().includes(qLower)) ||
          item.farmerSnapshot.village.toLowerCase().includes(qLower) ||
          item.workSummary.toLowerCase().includes(qLower) ||
          item.lines.some((l) => l.serviceName.toLowerCase().includes(qLower));
        if (!match) return false;
      }

      // Village filter
      if (query.village && query.village !== "ALL") {
        if (!item.farmerSnapshot.village.toLowerCase().includes(query.village.toLowerCase())) {
          return false;
        }
      }

      // Machinery filter
      if (query.machinery && query.machinery !== "ALL") {
        const machLower = query.machinery.toLowerCase();
        const matchesMachinery =
          item.machineryType.toLowerCase().includes(machLower) ||
          item.workSummary.toLowerCase().includes(machLower) ||
          item.lines.some((l) => l.serviceName.toLowerCase().includes(machLower));
        if (!matchesMachinery) return false;
      }

      return true;
    });

    // 2. Tab counts calculated dynamically from filteredBase
    const counts: InvoiceTabCounts = {
      all: filteredBase.length,
      paid: filteredBase.filter((i) => i.status === "PAID").length,
      pending: filteredBase.filter((i) => i.status === "UNPAID").length,
      partial: filteredBase.filter((i) => i.status === "PARTIAL").length,
    };

    // 3. Apply Tab or Status Filter
    let tabFiltered = filteredBase;
    if (query.tab && query.tab !== "ALL") {
      if (query.tab === "PAID") {
        tabFiltered = filteredBase.filter((i) => i.status === "PAID");
      } else if (query.tab === "PENDING") {
        tabFiltered = filteredBase.filter((i) => i.status === "UNPAID");
      } else if (query.tab === "PARTIAL") {
        tabFiltered = filteredBase.filter((i) => i.status === "PARTIAL");
      }
    } else if (query.status && query.status !== "ALL") {
      if (query.status === "PAID") {
        tabFiltered = filteredBase.filter((i) => i.status === "PAID");
      } else if (query.status === "PENDING" || query.status === "UNPAID") {
        tabFiltered = filteredBase.filter((i) => i.status === "UNPAID");
      } else if (query.status === "PARTIAL") {
        tabFiltered = filteredBase.filter((i) => i.status === "PARTIAL");
      }
    }

    const pageSize = query.pageSize || 8;
    const page = query.page || 1;
    const paginatedItems = tabFiltered.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paginatedItems,
      total: tabFiltered.length,
      page,
      pageSize,
      counts,
    };
  },

  async get(id) {
    const found = demoInvoices.find(
      (item) => item.id === id || item.invoiceNumber === id,
    );
    if (found) return found;
    return null;
  },

  async unbilledWork(farmerId) {
    if (farmerId) {
      return demoUnbilledWork.filter((item) => item.farmerId === farmerId);
    }
    return demoUnbilledWork;
  },

  async createBill(input) {
    const nextSequence = 1058 + demoInvoices.length - 41;
    const invoiceNumber = `KMM-${nextSequence}`;
    const totalPaise = input.lines.reduce((acc, l) => acc + l.amountPaise, 0);

    const newInvoice: ExtendedInvoice = {
      id: `INV-${nextSequence}`,
      jobId: `JOB-${nextSequence}`,
      farmerId: input.farmerId,
      invoiceNumber,
      sequence: nextSequence,
      lifecycle: "ISSUED",
      issuedAt: new Date().toISOString(),
      workDate: input.workDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      farmerSnapshot: {
        name: input.farmerName,
        mobile: input.phone || "+91 98765 43210",
        village: input.village,
      },
      ownerSnapshot: {
        name: "Kisan Machinery Manager",
        phone: "+91 98480 12345",
        address: "Farm Machinery Services, Vempalli Road",
      },
      lines: input.lines.map((l, index) => ({
        lineId: `LINE-${nextSequence}-${index + 1}`,
        serviceId: `SERV-${index + 1}`,
        equipmentIds: ["EQ-TRACTOR-1"],
        serviceName: l.serviceName,
        unit: (l.unit as any) || "ACRE",
        quantity: l.quantity,
        ratePaise: l.ratePaise,
        amountPaise: l.amountPaise,
      })),
      totalPaise,
      paidPaise: 0,
      duePaise: totalPaise,
      status: "UNPAID",
      version: 1,
      workSummary: input.lines.map((l) => l.serviceName.split(" ")[0]).join(" + "),
      machineryType: input.lines[0]?.serviceName.includes("Rotavator") ? "Rotavator" : "Plough",
      farmerPhone: input.phone || "+91 98765 43210",
    };

    // Prepend so new bill appears at top
    demoInvoices.unshift(newInvoice);

    // Remove from unbilled work
    const idx = demoUnbilledWork.findIndex((w) => w.farmerId === input.farmerId);
    if (idx !== -1) {
      demoUnbilledWork.splice(idx, 1);
    }

    return newInvoice;
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
    const invoice: ExtendedInvoice = {
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
      workSummary: "Machinery Work",
      machineryType: "Tractor",
      farmerPhone: farmer.mobile || "+91 98765 43210",
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
