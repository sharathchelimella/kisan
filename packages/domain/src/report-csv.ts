import type { Report } from "@kisan/contracts";
const cell = (value: string | number) => {
  const raw = String(value);
  const safe =
    typeof value === "string" && /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
};
export function reportCsv(report: Report) {
  const rows: (string | number)[][] = [
    [
      "section",
      "date_or_name",
      "work_value_paise",
      "collections_paise",
      "outstanding_paise",
      "work_count",
    ],
    [
      "summary",
      `${report.query.from} to ${report.query.to}`,
      report.summary.workValuePaise,
      report.summary.collectionsPaise,
      report.summary.outstandingPaise,
      report.summary.workCount,
    ],
    ...report.series.map((row) => [
      "series",
      row.date,
      row.workValuePaise,
      row.collectionsPaise,
      "",
      "",
    ]),
    ...report.services.map((row) => [
      "service",
      row.serviceName,
      row.workValuePaise,
      "",
      row.estimatedOutstandingPaise,
      row.workCount,
    ]),
    ...report.equipment.map((row) => [
      "equipment",
      row.equipmentName ?? row.equipmentId,
      row.workValuePaise,
      row.collectionsPaise,
      row.estimatedOutstandingPaise,
      "",
    ]),
    ...report.collectionsByMethod.map((row) => [
      "method",
      row.method,
      "",
      row.collectionsPaise,
      "",
      "",
    ]),
  ];
  return (
    "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n"
  );
}
