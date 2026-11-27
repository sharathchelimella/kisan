export type LedgerInvoice = {
  id: string;
  totalPaise: number;
  paidPaise: number;
  duePaise: number;
  lifecycle: "ISSUED" | "VOID";
  status: "UNPAID" | "PARTIAL" | "PAID" | "VOID";
  lineAmountsPaise: number[];
};
export type LedgerReceipt = {
  id: string;
  invoiceId: string;
  amountPaise: number;
  status: "POSTED" | "REVERSED";
};
export type LedgerAllocation = {
  id: string;
  invoiceId: string;
  receiptId: string;
  amountPaise: number;
  reversed: boolean;
};
export type ReconciliationIssue = {
  code: string;
  invoiceId?: string;
  receiptId?: string;
  allocationId?: string;
};

export function reconcileLedger(
  invoices: LedgerInvoice[],
  receipts: LedgerReceipt[],
  allocations: LedgerAllocation[],
): ReconciliationIssue[] {
  const issues: ReconciliationIssue[] = [];
  const byInvoice = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const byReceipt = new Map(receipts.map((receipt) => [receipt.id, receipt]));
  const byReceiptAllocation = new Map(
    allocations.map((allocation) => [allocation.receiptId, allocation]),
  );
  const paidByInvoice = new Map<string, number>();
  for (const allocation of allocations) {
    const receipt = byReceipt.get(allocation.receiptId);
    if (!byInvoice.has(allocation.invoiceId) || !receipt) {
      issues.push({ code: "ORPHAN_ALLOCATION", allocationId: allocation.id });
      continue;
    }
    if (
      receipt.invoiceId !== allocation.invoiceId ||
      receipt.amountPaise !== allocation.amountPaise
    )
      issues.push({
        code: "ALLOCATION_MISMATCH",
        allocationId: allocation.id,
        receiptId: receipt.id,
      });
    if ((receipt.status === "REVERSED") !== allocation.reversed)
      issues.push({
        code: "REVERSAL_MISMATCH",
        allocationId: allocation.id,
        receiptId: receipt.id,
      });
    if (!allocation.reversed && receipt.status === "POSTED")
      paidByInvoice.set(
        allocation.invoiceId,
        (paidByInvoice.get(allocation.invoiceId) ?? 0) + allocation.amountPaise,
      );
  }
  for (const receipt of receipts) {
    if (
      !byInvoice.has(receipt.invoiceId) ||
      !byReceiptAllocation.has(receipt.id)
    )
      issues.push({
        code: "RECEIPT_ALLOCATION_MISSING",
        receiptId: receipt.id,
      });
  }
  for (const invoice of invoices) {
    const total = invoice.lineAmountsPaise.reduce(
      (sum, amount) => sum + amount,
      0,
    );
    if (!Number.isSafeInteger(total) || total !== invoice.totalPaise)
      issues.push({ code: "INVOICE_LINE_TOTAL", invoiceId: invoice.id });
    const paid = paidByInvoice.get(invoice.id) ?? 0;
    if (
      !Number.isSafeInteger(paid) ||
      paid !== invoice.paidPaise ||
      invoice.duePaise !== invoice.totalPaise - paid ||
      paid < 0 ||
      paid > invoice.totalPaise
    )
      issues.push({ code: "INVOICE_BALANCE", invoiceId: invoice.id });
    const expectedStatus =
      invoice.lifecycle === "VOID"
        ? "VOID"
        : paid === 0
          ? "UNPAID"
          : paid === invoice.totalPaise
            ? "PAID"
            : "PARTIAL";
    if (
      invoice.status !== expectedStatus ||
      (invoice.lifecycle === "VOID" && paid !== 0)
    )
      issues.push({ code: "INVOICE_STATUS", invoiceId: invoice.id });
  }
  return issues;
}
