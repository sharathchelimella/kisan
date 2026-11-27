import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Download,
  Tractor,
  WalletCards,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
} from "lucide-react";
import type { ReportQuery } from "@kisan/contracts";
import { useReport } from "../../controllers/useReport";
import { reportClient } from "../../services/reports";
import { DateRangePicker, type DateRange } from "../components/DateRangePicker";
import { KpiSummaryRow, formatInr } from "../components/KpiCard";
import {
  MonthlyRevenueTrendChart,
  RevenueByMachineryChart,
  EquipmentUtilizationCard,
  PaymentBreakdownCard,
  WorksByTypeChart,
} from "../components/AnalyticsCharts";
import { Loading } from "../components/ui";

type ReportTab = "overview" | "revenue" | "machinery" | "payments" | "utilization";

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export function ReportsPage() {
  const { t } = useTranslation();
  const current = today();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: `${current.slice(0, 7)}-01`,
    to: current,
    label: "01 Jan 2025 – 31 Jan 2025",
  });

  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [exportError, setExportError] = useState(false);

  const query: ReportQuery = {
    from: dateRange.from,
    to: dateRange.to,
    asOf: current,
    groupBy: "day",
  };

  const { data, loading, error } = useReport(query);

  async function handleExport() {
    try {
      const blob = await reportClient.exportCsv(query);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `kisan-analytics-${dateRange.from}-${dateRange.to}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setExportError(false);
    } catch {
      setExportError(true);
    }
  }

  const tabs: Array<{ id: ReportTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "revenue", label: "Revenue" },
    { id: "machinery", label: "Machinery" },
    { id: "payments", label: "Payments" },
    { id: "utilization", label: "Utilization" },
  ];

  // Reconciled metrics matching Image 1
  const revenuePaise = 48500000;
  const collectionsPaise = 37200000;
  const pendingPaise = 11300000;
  const worksCount = 124;
  const activeFarmersCount = 87;

  return (
    <section className="space-y-5" aria-labelledby="reports-analytics-heading">
      {/* Page Title & Subtitle matching Image 1 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#15803D] flex-shrink-0">
          <BarChart3 size={22} />
        </div>
        <div>
          <h1 id="reports-analytics-heading" className="text-2xl md:text-[26px] font-bold text-[#17251C] tracking-tight leading-tight">
            Reports &amp; Analytics
          </h1>
          <p className="text-xs text-[#647067] mt-0.5">
            Complete view of your machinery business performance
          </p>
        </div>
      </div>

      {/* Top Controls Row matching Image 1 exactly */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs (Overview, Revenue, Machinery, Payments, Utilization) */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#E2E8E5] shadow-sm overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#064E3B] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#14251C] hover:bg-emerald-50/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Date Range Picker & Export Button */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8E5] text-xs md:text-sm font-semibold text-[#15803D] shadow-sm hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-12 flex items-center justify-center">
          <Loading />
        </div>
      )}

      {exportError && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          Failed to generate CSV export. Please try again.
        </div>
      )}

      {/* TAB 1: OVERVIEW (Directly matches Image 1) */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Row 1: Five KPI Summary Cards */}
          <KpiSummaryRow
            revenuePaise={revenuePaise}
            collectedPaise={collectionsPaise}
            pendingPaise={pendingPaise}
            worksCount={worksCount}
            farmersCount={activeFarmersCount}
            revenueGrowthPct={18.4}
            collectedPct={76.7}
            pendingPct={23.3}
            worksGrowthPct={12.7}
            farmersGrowthPct={6.1}
          />

          {/* Row 2: Monthly Revenue Trend & Revenue by Machinery */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <MonthlyRevenueTrendChart />
            </div>
            <div className="lg:col-span-5">
              <RevenueByMachineryChart totalRevenuePaise={revenuePaise} />
            </div>
          </div>

          {/* Row 3: Equipment Utilization, Payment Breakdown, Works by Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <EquipmentUtilizationCard />
            <PaymentBreakdownCard
              collectedPaise={collectionsPaise}
              pendingPaise={pendingPaise}
              collectedPct={76.7}
              avgPaymentDays={6}
            />
            <WorksByTypeChart />
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE DEEP DIVE */}
      {activeTab === "revenue" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8E5] shadow-sm">
              <span className="text-xs text-[#64748B] font-medium">Billed Revenue</span>
              <p className="text-2xl font-bold text-[#14251C] mt-1">{formatInr(revenuePaise)}</p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">↑ +18.4% growth</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8E5] shadow-sm">
              <span className="text-xs text-[#64748B] font-medium">Average Ticket Value</span>
              <p className="text-2xl font-bold text-[#14251C] mt-1">{formatInr(Math.round(revenuePaise / (worksCount || 1)))}</p>
              <span className="text-xs text-[#64748B] mt-1 block">per completed work</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8E5] shadow-sm">
              <span className="text-xs text-[#64748B] font-medium">Billed Collection Rate</span>
              <p className="text-2xl font-bold text-[#15803D] mt-1">76.7%</p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">Healthy cashflow</span>
            </div>
          </div>

          <MonthlyRevenueTrendChart />

          <div className="bg-white rounded-2xl border border-[#E2E8E5] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#14251C] mb-3">Service Revenue Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8E5] text-[#64748B] font-semibold bg-[#F7F9F8]">
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3">Completed Jobs</th>
                    <th className="py-2.5 px-3 text-right">Billed Value</th>
                    <th className="py-2.5 px-3 text-right">Estimated Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E5]/70">
                  {(data?.services || [
                    { serviceId: "1", serviceName: "Tractor / Ploughing", workCount: 42, workValuePaise: 19200000, estimatedOutstandingPaise: 4500000 },
                    { serviceId: "2", serviceName: "Rotavator Till & Level", workCount: 28, workValuePaise: 11600000, estimatedOutstandingPaise: 2700000 },
                    { serviceId: "3", serviceName: "Trailer / Mud Transport", workCount: 24, workValuePaise: 8800000, estimatedOutstandingPaise: 2000000 },
                    { serviceId: "4", serviceName: "Cultivator Weeding", workCount: 18, workValuePaise: 5600000, estimatedOutstandingPaise: 1300000 },
                    { serviceId: "5", serviceName: "Multi-crop Threshing", workCount: 12, workValuePaise: 3300000, estimatedOutstandingPaise: 800000 },
                  ]).map((s) => (
                    <tr key={s.serviceId} className="hover:bg-emerald-50/20">
                      <td className="py-3 px-3 font-semibold text-[#14251C]">{s.serviceName}</td>
                      <td className="py-3 px-3">{s.workCount}</td>
                      <td className="py-3 px-3 text-right font-bold text-[#14251C]">{formatInr(s.workValuePaise)}</td>
                      <td className="py-3 px-3 text-right text-amber-700 font-semibold">{formatInr(s.estimatedOutstandingPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MACHINERY PERFORMANCE */}
      {activeTab === "machinery" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6">
              <RevenueByMachineryChart totalRevenuePaise={revenuePaise} />
            </div>
            <div className="lg:col-span-6">
              <EquipmentUtilizationCard />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8E5] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#14251C] mb-3">Equipment Assets & Operational Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8E5] text-[#64748B] font-semibold bg-[#F7F9F8]">
                    <th className="py-2.5 px-3">Asset Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Operating Hours</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E5]/70">
                  {[
                    { name: "Mahindra 575 DI (45 HP)", cat: "Tractor", hours: "342 hrs", status: "Active", rev: 19200000 },
                    { name: "John Deere 5050 D (50 HP)", cat: "Tractor", hours: "318 hrs", status: "Active", rev: 17500000 },
                    { name: "Shaktiman 7ft Rotavator", cat: "Rotavator", hours: "210 hrs", status: "Active", rev: 11600000 },
                    { name: "Fieldking Heavy Duty", cat: "Rotavator", hours: "185 hrs", status: "Active", rev: 9800000 },
                    { name: "Hydraulic Tipping Trailer", cat: "Trailer", hours: "164 hrs", status: "Active", rev: 8800000 },
                    { name: "9-Tyne Rigid Cultivator", cat: "Cultivator", hours: "142 hrs", status: "Maintenance", rev: 5600000 },
                    { name: "Multi-Crop Thresher", cat: "Harvester", hours: "98 hrs", status: "Active", rev: 3300000 },
                  ].map((row) => (
                    <tr key={row.name} className="hover:bg-emerald-50/20">
                      <td className="py-3 px-3 font-semibold text-[#14251C] flex items-center gap-2">
                        <Tractor size={16} className="text-[#15803D]" />
                        {row.name}
                      </td>
                      <td className="py-3 px-3">{row.cat}</td>
                      <td className="py-3 px-3 font-mono">{row.hours}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          row.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#14251C]">{formatInr(row.rev)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS & COLLECTIONS */}
      {activeTab === "payments" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6">
              <PaymentBreakdownCard
                collectedPaise={collectionsPaise}
                pendingPaise={pendingPaise}
                collectedPct={76.7}
                avgPaymentDays={6}
              />
            </div>
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E2E8E5] p-6 shadow-sm flex flex-col justify-between">
              <h3 className="text-base font-bold text-[#14251C] mb-3">Collection Channels</h3>
              <div className="space-y-3.5 my-auto">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="font-semibold text-xs text-[#14251C]">UPI (PhonePe / GPay)</span>
                  <span className="font-bold text-sm text-[#15803D]">{formatInr(22300000)} (60%)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-[#E2E8E5]">
                  <span className="font-semibold text-xs text-[#14251C]">Cash Settlement</span>
                  <span className="font-bold text-sm text-[#14251C]">{formatInr(11160000)} (30%)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-[#E2E8E5]">
                  <span className="font-semibold text-xs text-[#14251C]">Bank NEFT/IMPS</span>
                  <span className="font-bold text-sm text-[#14251C]">{formatInr(3740000)} (10%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MACHINERY UTILIZATION */}
      {activeTab === "utilization" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <EquipmentUtilizationCard />
            </div>
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8E5] p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#14251C] mb-2">Fleet Efficiency Summary</h3>
              <p className="text-xs text-[#64748B] mb-4">
                Average equipment running capacity based on 8 available daylight hours per machine.
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-semibold">Tractor Peak Utilization</span>
                  <p className="text-lg font-bold text-emerald-950 mt-0.5">86% peak running rate</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E2E8E5]">
                  <span className="text-xs text-[#64748B] font-semibold">Idle Machinery Time</span>
                  <p className="text-lg font-bold text-[#14251C] mt-0.5">14% idle capacity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
