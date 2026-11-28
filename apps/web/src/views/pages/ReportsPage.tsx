import { useState } from "react";
import { BarChart3, Download } from "lucide-react";
import type { ReportQuery } from "@kisan/contracts";
import { useReport } from "../../controllers/useReport";
import { useEquipmentOptions } from "../../controllers/useCatalog";
import { reportClient } from "../../services/reports";
import { DateRangePicker, type DateRange } from "../components/DateRangePicker";
import { formatInr } from "../components/KpiCard";
import { Loading } from "../components/ui";

type Tab = "overview" | "revenue" | "machinery" | "payments" | "utilization";
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export function ReportsPage() {
  const current = today();
  const [range, setRange] = useState<DateRange>({
    from: current.slice(0, 7) + "-01",
    to: current,
    label: "This Month",
  });
  const [tab, setTab] = useState<Tab>("overview");
  const [equipmentId, setEquipmentId] = useState("");
  const [groupBy, setGroupBy] = useState<ReportQuery["groupBy"]>("day");
  const [exportError, setExportError] = useState(false);
  const options = useEquipmentOptions();
  const query: ReportQuery = {
    from: range.from,
    to: range.to,
    asOf: current,
    groupBy,
    ...(equipmentId && { equipmentId }),
  };
  const { data, loading, error } = useReport(query);
  const selected = options.items.find((item) => item.id === equipmentId);
  async function exportReport() {
    try {
      const blob = await reportClient.exportCsv(query);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kisan-report-${query.from}-${query.to}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setExportError(false);
    } catch {
      setExportError(true);
    }
  }
  return (
    <section className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
          <BarChart3 />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold">Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-500">
            Saved work, collections, and equipment performance
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl bg-white border border-slate-200 overflow-x-auto">
          {(
            [
              "overview",
              "revenue",
              "machinery",
              "payments",
              "utilization",
            ] as Tab[]
          ).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={
                "px-3 py-2 rounded-lg text-sm font-semibold capitalize " +
                (tab === value ? "bg-emerald-900 text-white" : "text-slate-600")
              }
            >
              {value}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <button
            type="button"
            onClick={() => void exportReport()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-emerald-800 font-semibold text-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Equipment
          <select
            aria-label="Equipment filter"
            value={equipmentId}
            onChange={(event) => setEquipmentId(event.target.value)}
            className="min-h-10 min-w-48 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">All equipment</option>
            {options.items.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name} · {item.id.slice(-6)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Group by
          <select
            value={groupBy}
            onChange={(event) =>
              setGroupBy(event.target.value as ReportQuery["groupBy"])
            }
            className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>
        {selected && (
          <p className="text-xs text-slate-500">
            Report share for {selected.name}; jobs are counted once. Machinery
            shows full associated value.
          </p>
        )}
      </div>
      {loading && <Loading />}
      {error && (
        <p role="alert" className="text-red-700">
          Unable to load report data.
        </p>
      )}
      {exportError && (
        <p role="alert" className="text-red-700">
          Unable to export CSV.
        </p>
      )}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ["Completed Jobs", String(data.summary.workCount)],
              ["Completed Work Value", formatInr(data.summary.workValuePaise)],
              ["Collections", formatInr(data.summary.collectionsPaise)],
              ["Outstanding", formatInr(data.summary.outstandingPaise)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <strong className="block text-xl mt-1">{value}</strong>
              </div>
            ))}
          </div>
          {(tab === "overview" || tab === "revenue") && (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="font-bold mb-3">Work and Collections Trend</h2>
                {data.series.length ? (
                  <div className="space-y-2 max-h-80 overflow-auto">
                    {data.series.map((point) => (
                      <div
                        key={point.date}
                        className="grid grid-cols-[75px_1fr_auto] gap-2 items-center text-xs"
                      >
                        <span>{point.date.slice(5)}</span>
                        <div className="h-3 bg-emerald-50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600"
                            style={{
                              width:
                                Math.max(
                                  2,
                                  (100 * point.workValuePaise) /
                                    Math.max(
                                      1,
                                      ...data.series.map(
                                        (entry) => entry.workValuePaise,
                                      ),
                                    ),
                                ) + "%",
                            }}
                          />
                        </div>
                        <strong>{formatInr(point.workValuePaise)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No completed work in this period.
                  </p>
                )}
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="font-bold mb-3">Services</h2>
                {data.services.length ? (
                  <div className="space-y-2">
                    {data.services.map((service) => (
                      <div
                        key={service.serviceId}
                        className="flex justify-between gap-2 border-b border-slate-100 pb-2 text-sm"
                      >
                        <span>
                          {service.serviceName}
                          <small className="block text-slate-500">
                            {service.workCount} jobs
                          </small>
                        </span>
                        <strong>{formatInr(service.workValuePaise)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No service activity in this period.
                  </p>
                )}
              </div>
            </div>
          )}
          {tab === "machinery" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-bold mb-1">Equipment participation</h2>
              <p className="text-xs text-slate-500 mb-4">
                This report splits each service line equally across its linked
                machines. These report shares reconcile to business work value;
                Machinery cards show full associated work value.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2">Equipment</th>
                      <th>Category</th>
                      <th className="text-right">Report share (equal split)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.items
                      .filter((item) => !equipmentId || item.id === equipmentId)
                      .map((item) => {
                        const row = data.equipment.find(
                          (entry) => entry.equipmentId === item.id,
                        );
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100"
                          >
                            <td className="py-2 font-semibold">
                              {item.name}
                              <small className="block text-slate-500">
                                ID {item.id.slice(-8)} ·{" "}
                                {item.active ? "Active" : "Archived"}
                              </small>
                            </td>
                            <td>{item.kind}</td>
                            <td className="text-right font-bold">
                              {formatInr(row?.workValuePaise ?? 0)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {options.items.length === 0 && (
                  <p className="text-sm text-slate-500 py-3">
                    No equipment registered.
                  </p>
                )}
              </div>
            </div>
          )}
          {tab === "payments" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-bold mb-3">Collections by Method</h2>
              {data.collectionsByMethod.length ? (
                data.collectionsByMethod.map((row) => (
                  <div
                    key={row.method}
                    className="flex justify-between py-2 border-b border-slate-100 text-sm"
                  >
                    <span>{row.method}</span>
                    <strong>{formatInr(row.collectionsPaise)}</strong>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No collections in this period.
                </p>
              )}
            </div>
          )}
          {tab === "utilization" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-bold">Equipment Utilization</h2>
              <p className="text-sm text-slate-500 mt-2">
                Not enough data. Utilization requires actual operating and
                available hours for the same period.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
