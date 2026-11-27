import {
  moneyPaiseSchema,
  type InvoiceLifecycle,
  type InvoiceStatus,
} from "@kisan/contracts";

export function deriveStatus(
  totalPaise: number,
  paidPaise: number,
  lifecycle: InvoiceLifecycle,
): InvoiceStatus {
  moneyPaiseSchema.parse(totalPaise);
  moneyPaiseSchema.parse(paidPaise);
  if (paidPaise > totalPaise)
    throw new RangeError("Paid amount exceeds invoice total");
  if (lifecycle === "VOID") return "VOID";
  if (paidPaise === 0) return "UNPAID";
  return paidPaise === totalPaise ? "PAID" : "PARTIAL";
}
