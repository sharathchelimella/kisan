import { randomUUID } from "node:crypto";
import type { Invoice, Receipt } from "@kisan/contracts";
import { equipmentDue } from "@kisan/domain";
import type { PaymentRepository } from "../services/payment.service";

export function memoryPayments(
  seed: { businessId: string; invoice: Invoice }[] = [],
): PaymentRepository {
  const invoices = seed.map((item) => ({
    businessId: item.businessId,
    invoice: structuredClone(item.invoice),
  }));
  const receipts: {
    businessId: string;
    key: string;
    fingerprint: string;
    receipt: Receipt;
  }[] = [];
  const locks = new Map<string, Promise<void>>();
  const balance = (invoice: Invoice) => ({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalPaise: invoice.totalPaise,
    paidPaise: invoice.paidPaise,
    duePaise: invoice.duePaise,
    status: invoice.status,
  });
  return {
    async existing(businessId, key) {
      const found = receipts.find(
        (item) => item.businessId === businessId && item.key === key,
      );
      if (!found) return null;
      const invoice = invoices.find(
        (item) =>
          item.businessId === businessId &&
          item.invoice.id === found.receipt.invoiceId,
      )!.invoice;
      return {
        fingerprint: found.fingerprint,
        result: { receipt: found.receipt, invoice: balance(invoice) },
      };
    },
    async postAtomic(businessId, _actorId, key, fingerprint, input) {
      const prior = locks.get(businessId) ?? Promise.resolve();
      let release!: () => void;
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });
      locks.set(
        businessId,
        prior.then(() => current),
      );
      await prior;
      try {
        const existing = receipts.find(
          (item) => item.businessId === businessId && item.key === key,
        );
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            throw new Error("Key conflict");
          const invoice = invoices.find(
            (item) =>
              item.businessId === businessId &&
              item.invoice.id === existing.receipt.invoiceId,
          )!.invoice;
          return { receipt: existing.receipt, invoice: balance(invoice) };
        }
        const invoice = invoices.find(
          (item) =>
            item.businessId === businessId &&
            item.invoice.id === input.invoiceId &&
            item.invoice.lifecycle === "ISSUED",
        )?.invoice;
        if (!invoice || input.amountPaise > invoice.duePaise)
          throw new Error("Overpayment");
        const receipt: Receipt = {
          ...input,
          id: randomUUID(),
          farmerId: invoice.farmerId ?? "farmer",
          status: "POSTED",
          createdAt: new Date().toISOString(),
        };
        receipts.push({ businessId, key, fingerprint, receipt });
        invoice.paidPaise += input.amountPaise;
        invoice.duePaise -= input.amountPaise;
        invoice.status = invoice.duePaise === 0 ? "PAID" : "PARTIAL";
        return { receipt, invoice: balance(invoice) };
      } finally {
        release();
      }
    },
    async reverseAtomic(businessId, _actorId, id, reason) {
      const found = receipts.find(
        (item) =>
          item.businessId === businessId &&
          item.receipt.id === id &&
          item.receipt.status === "POSTED",
      );
      if (!found) return null;
      const invoice = invoices.find(
        (item) =>
          item.businessId === businessId &&
          item.invoice.id === found.receipt.invoiceId,
      )!.invoice;
      found.receipt.status = "REVERSED";
      found.receipt.reversalReason = reason;
      found.receipt.reversedAt = new Date().toISOString();
      invoice.paidPaise -= found.receipt.amountPaise;
      invoice.duePaise += found.receipt.amountPaise;
      invoice.status = invoice.paidPaise === 0 ? "UNPAID" : "PARTIAL";
      return { receipt: found.receipt, invoice: balance(invoice) };
    },
    async receipts(businessId, query) {
      const found = receipts.filter((item) => item.businessId === businessId);
      return {
        items: found
          .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
          .map((item) => item.receipt),
        total: found.length,
        page: query.page,
        pageSize: query.pageSize,
      };
    },
    async dues(businessId, query) {
      const found = invoices
        .filter(
          (item) =>
            item.businessId === businessId &&
            item.invoice.lifecycle === "ISSUED" &&
            (!query.equipmentId ||
              equipmentDue(item.invoice, query.equipmentId) > 0),
        )
        .map(({ invoice }) => ({
          ...balance(invoice),
          farmerId: invoice.farmerId ?? "farmer",
          farmerName: invoice.farmerSnapshot.name,
          village: invoice.farmerSnapshot.village,
          workDate: invoice.workDate,
          ...(query.equipmentId && {
            estimatedEquipmentDuePaise: equipmentDue(
              invoice,
              query.equipmentId,
            ),
          }),
        }));
      return {
        items: found.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize,
        ),
        total: found.length,
        page: query.page,
        pageSize: query.pageSize,
        totalDuePaise: found.reduce(
          (sum, item) =>
            sum +
            (query.equipmentId
              ? (item.estimatedEquipmentDuePaise ?? 0)
              : item.duePaise),
          0,
        ),
      };
    },
  };
}
