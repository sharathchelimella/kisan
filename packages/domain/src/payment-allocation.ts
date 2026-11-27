import type { Invoice } from "@kisan/contracts";

// Split due across invoice lines, then across the equipment in each line.
// Integer remainders go to the final line/equipment for deterministic totals.
export function equipmentDue(
  invoice: Pick<Invoice, "lifecycle" | "duePaise" | "totalPaise" | "lines">,
  equipmentId: string,
) {
  if (invoice.lifecycle === "VOID" || invoice.duePaise === 0) return 0;
  const total = BigInt(invoice.totalPaise);
  let assigned = 0;
  let result = 0;
  invoice.lines.forEach((line, index) => {
    const lineDue =
      index === invoice.lines.length - 1
        ? invoice.duePaise - assigned
        : total === 0n
          ? 0
          : Number(
              (BigInt(invoice.duePaise) * BigInt(line.amountPaise)) / total,
            );
    assigned += lineDue;
    const ids = [...new Set(line.equipmentIds)].sort();
    if (!ids.length) return;
    const each = Math.floor(lineDue / ids.length);
    ids.forEach((id, position) => {
      if (id === equipmentId)
        result +=
          position === ids.length - 1
            ? lineDue - each * (ids.length - 1)
            : each;
    });
  });
  return result;
}
