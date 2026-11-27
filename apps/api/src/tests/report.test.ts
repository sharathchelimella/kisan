import { expect, it } from "vitest";
import { aggregateReport, reportCsv, type ReportSource } from "@kisan/domain";
import type { ReportQuery } from "@kisan/contracts";
import { createReportService } from "../services/report.service";
import { memoryReports } from "./memory-reports";

const lines = [
  {
    serviceId: "plough",
    serviceName: "Plough",
    amountPaise: 300000,
    equipmentIds: ["tractor"],
  },
  {
    serviceId: "rotavator",
    serviceName: "Rotavator",
    amountPaise: 200000,
    equipmentIds: ["rotavator"],
  },
];
const source: ReportSource = {
  jobs: [{ id: "job-1", farmerId: "farmer-1", workDate: "2026-11-20", lines }],
  invoices: [
    {
      id: "invoice-1",
      farmerId: "farmer-1",
      issuedDate: "2026-11-21",
      lifecycle: "ISSUED",
      totalPaise: 500000,
      lines,
    },
  ],
  receipts: [
    {
      id: "receipt-1",
      invoiceId: "invoice-1",
      farmerId: "farmer-1",
      paymentDate: "2026-11-22",
      createdDate: "2026-11-22",
      amountPaise: 250000,
      method: "CASH",
      status: "POSTED",
    },
  ],
  equipmentNames: { tractor: "Tractor", rotavator: "Rotavator" },
};
const query: ReportQuery = {
  from: "2026-11-01",
  to: "2026-11-25",
  asOf: "2026-11-25",
  groupBy: "day",
};
it("keeps work, collections and due distinct across chart, tables and export", async () => {
  const report = await createReportService(memoryReports(source))(
    "business-a",
    query,
  );
  expect(report.summary).toEqual({
    workValuePaise: 500000,
    collectionsPaise: 250000,
    outstandingPaise: 250000,
    workCount: 1,
  });
  expect(
    report.series.reduce((total, point) => total + point.workValuePaise, 0),
  ).toBe(report.summary.workValuePaise);
  expect(
    report.series.reduce((total, point) => total + point.collectionsPaise, 0),
  ).toBe(report.summary.collectionsPaise);
  expect(
    report.equipment.reduce(
      (total, row) => total + row.estimatedOutstandingPaise,
      0,
    ),
  ).toBe(report.summary.outstandingPaise);
  expect(report.equipment.map((row) => row.collectionsPaise)).toEqual([
    150000, 100000,
  ]);
  const csv = reportCsv(report);
  expect(csv).toContain(
    '"summary","2026-11-01 to 2026-11-25","500000","250000","250000","1"',
  );
  expect(csv).toContain('"equipment","Tractor","300000","150000","150000"');
});
it("filters farmer and equipment without duplicating a package line", () => {
  expect(
    aggregateReport({ ...query, farmerId: "other" }, source).summary
      .workValuePaise,
  ).toBe(0);
  const tractor = aggregateReport({ ...query, equipmentId: "tractor" }, source);
  expect(tractor.summary).toMatchObject({
    workValuePaise: 300000,
    collectionsPaise: 150000,
    outstandingPaise: 150000,
  });
  const packageSource: ReportSource = {
    ...source,
    jobs: [
      {
        ...source.jobs[0],
        lines: [
          {
            ...lines[0],
            amountPaise: 500000,
            equipmentIds: ["tractor", "rotavator"],
          },
        ],
      },
    ],
    invoices: [
      {
        ...source.invoices[0],
        lines: [
          {
            ...lines[0],
            amountPaise: 500000,
            equipmentIds: ["tractor", "rotavator"],
          },
        ],
      },
    ],
  };
  const both = ["tractor", "rotavator"].map(
    (equipmentId) =>
      aggregateReport({ ...query, equipmentId }, packageSource).summary,
  );
  expect(both.reduce((total, value) => total + value.workValuePaise, 0)).toBe(
    500000,
  );
  expect(both.reduce((total, value) => total + value.outstandingPaise, 0)).toBe(
    250000,
  );
});
it("shows collections for older work in the selected payment period", () => {
  const result = aggregateReport(
    { ...query, from: "2026-11-22", groupBy: "week" },
    source,
  );
  expect(result.summary.workValuePaise).toBe(0);
  expect(result.summary.collectionsPaise).toBe(250000);
  expect(result.summary.outstandingPaise).toBe(250000);
  expect(
    result.equipment.reduce((total, row) => total + row.collectionsPaise, 0),
  ).toBe(250000);
  expect(
    result.series.reduce((total, row) => total + row.collectionsPaise, 0),
  ).toBe(250000);
});
