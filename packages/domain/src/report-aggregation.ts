import type { Report, ReportQuery, PaymentMethod } from "@kisan/contracts";

export type ReportLine = {
  serviceId: string;
  serviceName: string;
  amountPaise: number;
  equipmentIds: string[];
};
export type ReportJob = {
  id: string;
  farmerId: string;
  workDate: string;
  lines: ReportLine[];
};
export type ReportInvoice = {
  id: string;
  farmerId: string;
  issuedDate: string;
  lifecycle: "ISSUED" | "VOID";
  totalPaise: number;
  lines: ReportLine[];
};
export type ReportReceipt = {
  id: string;
  invoiceId: string;
  farmerId: string;
  paymentDate: string;
  createdDate: string;
  amountPaise: number;
  method: PaymentMethod;
  status: "POSTED" | "REVERSED";
  reversedDate?: string;
};
export type ReportSource = {
  jobs: ReportJob[];
  invoices: ReportInvoice[];
  receipts: ReportReceipt[];
  equipmentNames?: Record<string, string>;
};

const sum = (numbers: number[]) =>
  numbers.reduce((total, number) => total + number, 0);
function split(amount: number, weights: number[]) {
  const total = sum(weights);
  let assigned = 0;
  return weights.map((weight, index) => {
    const share =
      index === weights.length - 1
        ? amount - assigned
        : total
          ? Number((BigInt(amount) * BigInt(weight)) / BigInt(total))
          : 0;
    assigned += share;
    return share;
  });
}
export function lineShares(amount: number, lines: ReportLine[]) {
  return split(
    amount,
    lines.map((line) => line.amountPaise),
  );
}
export function equipmentShare(
  amount: number,
  lines: ReportLine[],
  equipmentId: string,
) {
  return sum(
    lines.map((line, index) => {
      const ids = [...new Set(line.equipmentIds)].sort();
      if (!ids.includes(equipmentId)) return 0;
      const shares = split(
        lineShares(amount, lines)[index],
        ids.map(() => 1),
      );
      return shares[ids.indexOf(equipmentId)];
    }),
  );
}
function selectedAmount(
  amount: number,
  lines: ReportLine[],
  serviceId?: string,
  equipmentId?: string,
) {
  const shares = lineShares(amount, lines);
  return sum(
    lines.map((line, index) => {
      if (serviceId && line.serviceId !== serviceId) return 0;
      return equipmentId
        ? equipmentShare(shares[index], [line], equipmentId)
        : shares[index];
    }),
  );
}
function bucket(date: string, groupBy: ReportQuery["groupBy"]) {
  if (groupBy === "day") return date;
  if (groupBy === "month") return `${date.slice(0, 7)}-01`;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
function buckets(query: ReportQuery) {
  const result: string[] = [];
  const cursor = new Date(`${query.from}T00:00:00Z`);
  const end = new Date(`${query.to}T00:00:00Z`);
  if (query.groupBy === "month") cursor.setUTCDate(1);
  for (
    ;
    cursor <= end;
    query.groupBy === "month"
      ? cursor.setUTCMonth(cursor.getUTCMonth() + 1)
      : cursor.setUTCDate(
          cursor.getUTCDate() + (query.groupBy === "week" ? 7 : 1),
        )
  ) {
    const key = bucket(cursor.toISOString().slice(0, 10), query.groupBy);
    if (!result.includes(key)) result.push(key);
  }
  return result;
}
export function aggregateReport(
  query: ReportQuery,
  source: ReportSource,
): Report {
  const invoiceMap = new Map(
    source.invoices.map((invoice) => [invoice.id, invoice]),
  );
  const matchingJobs = source.jobs.filter(
    (job) =>
      (!query.farmerId || job.farmerId === query.farmerId) &&
      job.workDate >= query.from &&
      job.workDate <= query.to,
  );
  const workRows = matchingJobs.flatMap((job) =>
    job.lines
      .filter(
        (line) =>
          (!query.serviceId || line.serviceId === query.serviceId) &&
          (!query.equipmentId || line.equipmentIds.includes(query.equipmentId)),
      )
      .map((line) => ({
        job,
        line,
        amount: query.equipmentId
          ? equipmentShare(line.amountPaise, [line], query.equipmentId)
          : line.amountPaise,
      })),
  );
  const validReceipts = source.receipts.filter(
    (receipt) =>
      receipt.status === "POSTED" &&
      receipt.paymentDate >= query.from &&
      receipt.paymentDate <= query.to &&
      (!query.farmerId || receipt.farmerId === query.farmerId),
  );
  const receiptRows = validReceipts
    .map((receipt) => {
      const invoice = invoiceMap.get(receipt.invoiceId);
      const amount = invoice
        ? selectedAmount(
            receipt.amountPaise,
            invoice.lines,
            query.serviceId,
            query.equipmentId,
          )
        : 0;
      return { receipt, invoice, amount };
    })
    .filter((row) => row.amount > 0);
  const asOfReceipts = source.receipts.filter(
    (receipt) =>
      receipt.paymentDate <= query.asOf &&
      receipt.createdDate <= query.asOf &&
      (receipt.status === "POSTED" ||
        (receipt.status === "REVERSED" &&
          receipt.reversedDate &&
          receipt.reversedDate > query.asOf)),
  );
  const dueRows = source.invoices
    .filter(
      (invoice) =>
        invoice.lifecycle === "ISSUED" &&
        invoice.issuedDate <= query.asOf &&
        (!query.farmerId || invoice.farmerId === query.farmerId),
    )
    .map((invoice) => {
      const paid = sum(
        asOfReceipts
          .filter((receipt) => receipt.invoiceId === invoice.id)
          .map((receipt) => receipt.amountPaise),
      );
      const due = Math.max(0, invoice.totalPaise - paid);
      const amount = selectedAmount(
        due,
        invoice.lines,
        query.serviceId,
        query.equipmentId,
      );
      return { invoice, due, amount };
    })
    .filter((row) => row.amount > 0);
  const series = buckets(query).map((date) => ({
    date,
    workValuePaise: sum(
      workRows
        .filter((row) => bucket(row.job.workDate, query.groupBy) === date)
        .map((row) => row.amount),
    ),
    collectionsPaise: sum(
      receiptRows
        .filter(
          (row) => bucket(row.receipt.paymentDate, query.groupBy) === date,
        )
        .map((row) => row.amount),
    ),
  }));
  const serviceIds = [...new Set(workRows.map((row) => row.line.serviceId))];
  const services = serviceIds.map((serviceId) => {
    const rows = workRows.filter((row) => row.line.serviceId === serviceId);
    return {
      serviceId,
      serviceName: rows[0].line.serviceName,
      workValuePaise: sum(rows.map((row) => row.amount)),
      estimatedOutstandingPaise: sum(
        dueRows.map((row) =>
          selectedAmount(
            row.due,
            row.invoice.lines,
            serviceId,
            query.equipmentId,
          ),
        ),
      ),
      workCount: new Set(rows.map((row) => row.job.id)).size,
    };
  });
  const equipmentIds = [
    ...new Set([
      ...workRows.flatMap((row) => row.line.equipmentIds),
      ...receiptRows.flatMap(
        (row) =>
          row.invoice?.lines
            .filter(
              (line) => !query.serviceId || line.serviceId === query.serviceId,
            )
            .flatMap((line) => line.equipmentIds) ?? [],
      ),
      ...dueRows.flatMap((row) =>
        row.invoice.lines
          .filter(
            (line) => !query.serviceId || line.serviceId === query.serviceId,
          )
          .flatMap((line) => line.equipmentIds),
      ),
    ]),
  ];
  const equipment = equipmentIds
    .filter((id) => !query.equipmentId || id === query.equipmentId)
    .map((equipmentId) => ({
      equipmentId,
      equipmentName: source.equipmentNames?.[equipmentId],
      workValuePaise: sum(
        matchingJobs.flatMap((job) =>
          job.lines
            .filter(
              (line) => !query.serviceId || line.serviceId === query.serviceId,
            )
            .map((line) =>
              equipmentShare(line.amountPaise, [line], equipmentId),
            ),
        ),
      ),
      collectionsPaise: sum(
        receiptRows.map((row) =>
          row.invoice
            ? selectedAmount(
                row.receipt.amountPaise,
                row.invoice.lines,
                query.serviceId,
                equipmentId,
              )
            : 0,
        ),
      ),
      estimatedOutstandingPaise: sum(
        dueRows.map((row) =>
          selectedAmount(
            row.due,
            row.invoice.lines,
            query.serviceId,
            equipmentId,
          ),
        ),
      ),
    }));
  const methods: PaymentMethod[] = ["CASH", "UPI", "BANK", "OTHER"];
  const collectionsByMethod = methods.map((method) => ({
    method,
    collectionsPaise: sum(
      receiptRows
        .filter((row) => row.receipt.method === method)
        .map((row) => row.amount),
    ),
  }));
  return {
    query,
    summary: {
      workValuePaise: sum(workRows.map((row) => row.amount)),
      collectionsPaise: sum(receiptRows.map((row) => row.amount)),
      outstandingPaise: sum(dueRows.map((row) => row.amount)),
      workCount: new Set(workRows.map((row) => row.job.id)).size,
    },
    series,
    services,
    equipment,
    collectionsByMethod,
  };
}
