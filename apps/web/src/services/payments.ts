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

export type DueItem = InvoiceBalance & {
  farmerId: string;
  farmerName: string;
  village: string;
  workDate: string;
  estimatedEquipmentDuePaise?: number;
};
export type PaymentQuery = {
  q?: string;
  status?: string;
  farmerId?: string;
  equipmentId?: string;
  page: number;
  pageSize: number;
};
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
    items: Receipt[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  post(input: ReceiptInput, key: string): Promise<PaymentResult>;
  reverse(id: string, reason: string): Promise<PaymentResult>;
  get(id: string): Promise<Receipt | null>;
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
};
const demoReceipts: (Receipt & { key?: string })[] = [
  {
    id: "DEMO-rec-1",
    invoiceId: "DEMO-invoice-1",
    farmerId: "DEMO-farmer-1",
    amountPaise: 1500000,
    method: "UPI",
    reference: "REC-4902",
    note: "Settled via UPI phone transaction",
    paymentDate: "2026-11-27",
    status: "POSTED",
    createdAt: "2026-11-27T14:30:00.000Z",
  },
];
const demo: PaymentClient = {
  async dues(query) {
    const found = demoInvoices.filter(
      (invoice) =>
        invoice.lifecycle === "ISSUED" &&
        (!query.q ||
          invoice.invoiceNumber.toLowerCase().includes(query.q.toLowerCase()) ||
          invoice.farmerSnapshot.name
            .toLowerCase()
            .includes(query.q.toLowerCase())) &&
        (!query.status || invoice.status === query.status) &&
        (!query.farmerId || invoice.farmerId === query.farmerId) &&
        (!query.equipmentId || equipmentDue(invoice, query.equipmentId) > 0),
    );
    const items = found.map((invoice) => ({
      ...balance(invoice),
      farmerId:
        invoice.farmerId ??
        demoJobs.find((job) => job.id === invoice.jobId)?.farmerId ??
        "",
      farmerName: invoice.farmerSnapshot.name,
      village: invoice.farmerSnapshot.village,
      workDate: invoice.workDate,
      ...(query.equipmentId && {
        estimatedEquipmentDuePaise: equipmentDue(invoice, query.equipmentId),
      }),
    }));
    return {
      items: items.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize,
      ),
      total: items.length,
      totalDuePaise: items.reduce(
        (sum, item) =>
          sum +
          (query.equipmentId
            ? (item.estimatedEquipmentDuePaise ?? 0)
            : item.duePaise),
        0,
      ),
      page: query.page,
      pageSize: query.pageSize,
    };
  },
  async receipts(query) {
    const found = demoReceipts.filter(
      (item) => !query.farmerId || item.farmerId === query.farmerId,
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
  async post(input, key) {
    const previous = demoReceipts.find((item) => item.key === key);
    if (previous) {
      const invoice = demoInvoices.find(
        (item) => item.id === previous.invoiceId,
      )!;
      return { receipt: previous, invoice: balance(invoice) };
    }
    const invoice = demoInvoices.find(
      (item) => item.id === input.invoiceId && item.lifecycle === "ISSUED",
    );
    if (
      !invoice ||
      input.amountPaise <= 0 ||
      input.amountPaise > invoice.duePaise
    )
      throw new Error("Payment exceeds due");
    const receipt: Receipt & { key: string } = {
      ...input,
      id: crypto.randomUUID(),
      farmerId: invoice.farmerId ?? "",
      status: "POSTED",
      createdAt: new Date().toISOString(),
      key,
    };
    demoReceipts.unshift(receipt);
    invoice.paidPaise += input.amountPaise;
    invoice.duePaise -= input.amountPaise;
    invoice.status = invoice.duePaise === 0 ? "PAID" : "PARTIAL";
    return { receipt, invoice: balance(invoice) };
  },
  async reverse(id, reason) {
    const receipt = demoReceipts.find(
      (item) => item.id === id && item.status === "POSTED",
    );
    if (!receipt) throw new Error("Receipt unavailable");
    const invoice = demoInvoices.find((item) => item.id === receipt.invoiceId)!;
    receipt.status = "REVERSED";
    receipt.reversalReason = reason;
    receipt.reversedAt = new Date().toISOString();
    invoice.paidPaise -= receipt.amountPaise;
    invoice.duePaise += receipt.amountPaise;
    invoice.status = invoice.paidPaise === 0 ? "UNPAID" : "PARTIAL";
    return { receipt, invoice: balance(invoice) };
  },
  async get(id) {
    const found = demoReceipts.find((item) => item.id === id);
    if (found) return found;
    if (id === "DEMO-rec-1") return demoReceipts[0];
    return null;
  },
};
export const paymentClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demo
    : http;
