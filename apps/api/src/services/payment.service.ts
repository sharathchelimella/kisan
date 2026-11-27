import { createHash } from "node:crypto";
import {
  receiptInputSchema,
  type ReceiptInput,
  type Receipt,
  type Invoice,
  type InvoiceBalance,
} from "@kisan/contracts";

export type PaymentResult = { receipt: Receipt; invoice: InvoiceBalance };
export interface PaymentRepository {
  existing(
    businessId: string,
    key: string,
  ): Promise<{ fingerprint: string; result: PaymentResult } | null>;
  postAtomic(
    businessId: string,
    actorId: string,
    key: string,
    fingerprint: string,
    input: ReceiptInput,
  ): Promise<PaymentResult>;
  reverseAtomic(
    businessId: string,
    actorId: string,
    id: string,
    reason: string,
  ): Promise<PaymentResult | null>;
  receipts(
    businessId: string,
    query: PaymentQuery,
  ): Promise<{
    items: Receipt[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  dues(
    businessId: string,
    query: PaymentQuery,
  ): Promise<{
    items: DueItem[];
    total: number;
    page: number;
    pageSize: number;
    totalDuePaise: number;
  }>;
}
export type PaymentQuery = {
  q?: string;
  farmerId?: string;
  equipmentId?: string;
  status?: Invoice["status"];
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};
export type DueItem = InvoiceBalance & {
  farmerId: string;
  farmerName: string;
  village: string;
  workDate: string;
  estimatedEquipmentDuePaise?: number;
};
export class PaymentConflict extends Error {}
export class PaymentUnavailable extends Error {}
export function fingerprint(input: ReceiptInput) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}
export function createPaymentService(repository: PaymentRepository) {
  return {
    async post(businessId: string, actorId: string, key: string, raw: unknown) {
      if (!/^[A-Za-z0-9_-]{8,100}$/.test(key))
        throw new PaymentConflict("Valid Idempotency-Key required");
      const input = receiptInputSchema.parse(raw);
      const hash = fingerprint(input);
      const existing = await repository.existing(businessId, key);
      if (existing) {
        if (existing.fingerprint !== hash)
          throw new PaymentConflict(
            "Idempotency key reused with different payment",
          );
        return existing.result;
      }
      return repository.postAtomic(businessId, actorId, key, hash, input);
    },
    async reverse(
      businessId: string,
      actorId: string,
      id: string,
      reason: string,
    ) {
      const result = await repository.reverseAtomic(
        businessId,
        actorId,
        id,
        reason,
      );
      if (!result) throw new PaymentConflict("Receipt cannot be reversed");
      return result;
    },
    receipts: repository.receipts.bind(repository),
    dues: repository.dues.bind(repository),
  };
}
