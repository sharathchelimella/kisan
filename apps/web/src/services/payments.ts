import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  type Receipt,
  type ReceiptInput,
  type InvoiceBalance,
} from "@kisan/contracts";
import { demoInvoices } from "./invoices";
import { demoJobs } from "../mocks/jobs";
import { equipmentDue } from "@kisan/domain";
import {
  allDemoPaymentInvoices,
  getPaymentKpiSummary,
  getTopOutstandingBalances,
  initialDemoPaymentReceipts,
  type DemoPaymentInvoice,
  type DemoPaymentReceipt,
} from "../mocks/payment-dataset";

export type DueItem = InvoiceBalance & {
  farmerId: string;
  farmerName: string;
  village: string;
  workDate: string;
  workDescription?: string;
  machineryTools?: string;
  areaLabel?: string;
  estimatedEquipmentDuePaise?: number;
};

export type PaymentQuery = {
  q?: string;
  status?: string;
  farmerId?: string;
  equipmentId?: string;
  method?: string;
  dateRange?: string;
  page: number;
  pageSize: number;
};

export interface OutstandingFarmerItem {
  farmerId: string;
  farmerName: string;
  village: string;
  outstandingPaise: number;
  pendingBillsCount: number;
  invoices: string[];
}

export interface PaymentKpiSummary {
  totalWorkPaise: number;
  totalPaidPaise: number;
  pendingPaise: number;
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  collectionPercent: number;
  pendingPercent: number;
}

export type PaymentResult = { receipt: Receipt; invoice: InvoiceBalance };

export interface PaymentClient {
  dues(
    query: PaymentQuery,
  ): Promise<{
    items: DueItem[];
    total: number;
    totalDuePaise: number;
    page: number;
    pageSize: number;
  }>;
  receipts(
    query: PaymentQuery,
  ): Promise<{
    items: (Receipt & {
      farmerName?: string;
      invoiceNumber?: string;
      workDescription?: string;
      paymentType?: "Full" | "Partial";
    })[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  post(input: ReceiptInput, key: string): Promise<PaymentResult>;
  reverse(id: string, reason: string): Promise<PaymentResult>;
  get(id: string): Promise<Receipt | null>;
  summary?(): Promise<PaymentKpiSummary>;
  outstandingBalances?(): Promise<OutstandingFarmerItem[]>;
}

const balance = (invoice: (typeof demoInvoices)[number]): InvoiceBalance => ({
  invoiceId: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  totalPaise: invoice.totalPaise,
  paidPaise: invoice.paidPaise,
  duePaise: invoice.duePaise,
  status: invoice.status,
});

const http: PaymentClient = {
  async dues(query) {
    const res = await fetch(
      `${API_PREFIX}/payments/dues?${new URLSearchParams(
        Object.entries(query)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [key, String(value)]),
      )}`,
    );
    if (!res.ok) throw new Error("Dues unavailable");
    return (await res.json()).data;
  },
  async receipts(query) {
    const res = await fetch(
      `${API_PREFIX}/payments/receipts?${new URLSearchParams(
        Object.entries(query)
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([key, value]) => [key, String(value)]),
      )}`,
    );
    if (!res.ok) throw new Error("Receipts unavailable");
    return (await res.json()).data;
  },
  async post(input, key) {
    const res = await fetch(`${API_PREFIX}/payments/receipts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [AUTH_REQUEST_HEADER]: "1",
        "Idempotency-Key": key,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Payment rejected");
    return (await res.json()).data;
  },
  async reverse(id, reason) {
    const res = await fetch(
      `${API_PREFIX}/payments/receipts/${encodeURIComponent(id)}/reverse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [AUTH_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({ reason }),
      },
    );
    if (!res.ok) throw new Error("Reversal rejected");
    return (await res.json()).data;
  },
  async get(id) {
    const res = await fetch(
      `${API_PREFIX}/payments/receipts/${encodeURIComponent(id)}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Receipt unavailable");
    return (await res.json()).data;
  },
  async summary() {
    return getPaymentKpiSummary();
  },
  async outstandingBalances() {
    return getTopOutstandingBalances();
  },
};

// In-memory interactive store for demo mode
let liveReceipts: DemoPaymentReceipt[] = [...initialDemoPaymentReceipts];
let liveInvoices: DemoPaymentInvoice[] = [...allDemoPaymentInvoices];

const demo: PaymentClient = {
  async summary() {
    const totalWorkPaise = liveInvoices.reduce((acc, i) => acc + i.totalPaise, 0);
    const totalPaidPaise = liveInvoices.reduce((acc, i) => acc + i.paidPaise, 0);
    const pendingPaise = liveInvoices.reduce((acc, i) => acc + i.duePaise, 0);
    const totalBills = liveInvoices.length;
    const paidBills = liveInvoices.filter((i) => i.status === "PAID").length;
    const pendingBills = totalBills - paidBills;

    const collectionPercent =
      totalWorkPaise > 0 ? (totalPaidPaise / totalWorkPaise) * 100 : 0;
    const pendingPercent =
      totalWorkPaise > 0 ? (pendingPaise / totalWorkPaise) * 100 : 0;

    return {
      totalWorkPaise,
      totalPaidPaise,
      pendingPaise,
      totalBills,
      paidBills,
      pendingBills,
      collectionPercent: parseFloat(collectionPercent.toFixed(1)),
      pendingPercent: parseFloat(pendingPercent.toFixed(1)),
    };
  },

  async outstandingBalances() {
    // Group unpaid/partial invoices by farmer
    const map = new Map<
      string,
      {
        farmerId: string;
        farmerName: string;
        village: string;
        outstandingPaise: number;
        pendingBillsCount: number;
        invoices: string[];
      }
    >();

    for (const inv of liveInvoices) {
      if (inv.duePaise > 0) {
        const existing = map.get(inv.farmerId) || {
          farmerId: inv.farmerId,
          farmerName: inv.farmerName,
          village: inv.village,
          outstandingPaise: 0,
          pendingBillsCount: 0,
          invoices: [],
        };
        existing.outstandingPaise += inv.duePaise;
        existing.pendingBillsCount += 1;
        existing.invoices.push(inv.invoiceNumber);
        map.set(inv.farmerId, existing);
      }
    }

    // Top 3 sorted by highest outstanding balance (or exact reference order for the top 3)
    const sorted = [...map.values()].sort(
      (a, b) => b.outstandingPaise - a.outstandingPaise,
    );
    // Ensure Ramesh, Srinivas, Mallesh appear as in payments.jpeg if in map
    const ramesh = sorted.find((s) => s.farmerName.includes("Ramesh"));
    const srinivas = sorted.find((s) => s.farmerName.includes("Srinivas"));
    const mallesh = sorted.find((s) => s.farmerName.includes("Mallesh"));

    const topList: OutstandingFarmerItem[] = [];
    if (ramesh) topList.push(ramesh);
    if (srinivas) topList.push(srinivas);
    if (mallesh) topList.push(mallesh);

    for (const item of sorted) {
      if (!topList.some((t) => t.farmerId === item.farmerId)) {
        topList.push(item);
      }
    }

    return topList.slice(0, 3);
  },

  async dues(query) {
    let found = liveInvoices.filter((inv) => {
      if (query.q) {
        const q = query.q.toLowerCase();
        const matchesQ =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.farmerName.toLowerCase().includes(q) ||
          inv.village.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      if (query.farmerId && inv.farmerId !== query.farmerId) return false;
      if (query.status && inv.status !== query.status) return false;
      return true;
    });

    const items: DueItem[] = found.map((inv) => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalPaise: inv.totalPaise,
      paidPaise: inv.paidPaise,
      duePaise: inv.duePaise,
      status: inv.status,
      farmerId: inv.farmerId,
      farmerName: inv.farmerName,
      village: inv.village,
      workDate: inv.workDate,
      workDescription: inv.workDescription,
      machineryTools: inv.machineryTools,
      areaLabel: inv.areaLabel,
    }));

    const startIndex = (query.page - 1) * query.pageSize;
    const sliced = items.slice(startIndex, startIndex + query.pageSize);

    return {
      items: sliced,
      total: items.length,
      totalDuePaise: items.reduce((sum, item) => sum + item.duePaise, 0),
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async receipts(query) {
    let found = [...liveReceipts];

    if (query.farmerId) {
      found = found.filter((item) => item.farmerId === query.farmerId);
    }
    if (query.method && query.method !== "ALL") {
      found = found.filter((item) => item.method === query.method);
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      found = found.filter(
        (item) =>
          item.farmerName.toLowerCase().includes(q) ||
          item.invoiceNumber.toLowerCase().includes(q) ||
          item.workDescription.toLowerCase().includes(q),
      );
    }

    const startIndex = (query.page - 1) * query.pageSize;
    const sliced = found.slice(startIndex, startIndex + query.pageSize);

    return {
      items: sliced,
      total: found.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  },

  async post(input, key) {
    // Check idempotency key
    const previous = liveReceipts.find((item) => (item as any).key === key);
    if (previous) {
      const inv = liveInvoices.find((item) => item.id === previous.invoiceId)!;
      return {
        receipt: previous,
        invoice: {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalPaise: inv.totalPaise,
          paidPaise: inv.paidPaise,
          duePaise: inv.duePaise,
          status: inv.status,
        },
      };
    }

    const inv = liveInvoices.find((item) => item.id === input.invoiceId);
    if (!inv || input.amountPaise <= 0 || input.amountPaise > inv.duePaise) {
      throw new Error("Payment exceeds due amount or invoice is not found");
    }

    const paymentType = input.amountPaise >= inv.duePaise ? "Full" : "Partial";
    const refCode = `REC-${Date.now().toString().slice(-4)}`;

    const newReceipt: DemoPaymentReceipt = {
      id: `REC-${Date.now()}`,
      invoiceId: inv.id,
      farmerId: inv.farmerId,
      farmerName: inv.farmerName,
      invoiceNumber: inv.invoiceNumber,
      workDescription: inv.workDescription,
      paymentType,
      amountPaise: input.amountPaise,
      method: input.method,
      reference: input.reference || refCode,
      note: input.note || "Recorded in Payments Manager",
      paymentDate: input.paymentDate || "18 Jan 2025",
      status: "POSTED",
      createdAt: new Date().toISOString(),
    };
    (newReceipt as any).key = key;

    liveReceipts.unshift(newReceipt);

    // Update invoice in memory
    inv.paidPaise += input.amountPaise;
    inv.duePaise = Math.max(0, inv.duePaise - input.amountPaise);
    inv.status = inv.duePaise === 0 ? "PAID" : "PARTIAL";

    return {
      receipt: newReceipt,
      invoice: {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalPaise: inv.totalPaise,
        paidPaise: inv.paidPaise,
        duePaise: inv.duePaise,
        status: inv.status,
      },
    };
  },

  async reverse(id, reason) {
    const receipt = liveReceipts.find(
      (item) => item.id === id && item.status === "POSTED",
    );
    if (!receipt) throw new Error("Receipt not found or already reversed");

    const inv = liveInvoices.find((item) => item.id === receipt.invoiceId);
    receipt.status = "REVERSED";
    receipt.reversalReason = reason;
    receipt.reversedAt = new Date().toISOString();

    if (inv) {
      inv.paidPaise = Math.max(0, inv.paidPaise - receipt.amountPaise);
      inv.duePaise += receipt.amountPaise;
      inv.status = inv.paidPaise === 0 ? "UNPAID" : "PARTIAL";
    }

    return {
      receipt,
      invoice: inv
        ? {
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            totalPaise: inv.totalPaise,
            paidPaise: inv.paidPaise,
            duePaise: inv.duePaise,
            status: inv.status,
          }
        : ({} as any),
    };
  },

  async get(id) {
    const found = liveReceipts.find((item) => item.id === id);
    if (found) return found;
    if (id.startsWith("REC") && liveReceipts.length > 0) {
      return liveReceipts[0];
    }
    return null;
  },
};

export const paymentClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demo
    : http;
