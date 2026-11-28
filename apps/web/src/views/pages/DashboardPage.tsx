import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useDashboard } from "../../controllers/useDashboard";
import { DateRangePicker, type DateRange } from "../components/DateRangePicker";
import { DashboardKpiRow } from "../components/KpiCard";
import {
  RevenueTrendBarChart,
} from "../components/AnalyticsCharts";
import {
  CompactRecentActivity,
  PendingPaymentsTable,
} from "../components/DashboardSections";
import { Loading } from "../components/ui";

export function DashboardPage() {
  const { t } = useTranslation();
  const current = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  // Default to reference image period: Jan 1 - Jan 31, 2025
  const [dateRange, setDateRange] = useState<DateRange>({
    from: current.slice(0, 7) + "-01",
    to: current,
    label: "This Month",
  });

  const { data, loading, error } = useDashboard({
    from: dateRange.from,
    to: dateRange.to,
    asOf: current,
  });

  return (
    <div className="space-y-3.5 pb-1">
      {/* Dashboard Top Header & Date Range Filter matching Reference Image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold text-[#17251C] tracking-tight leading-tight">
            Dashboard
          </h1>
          <p className="text-xs text-[#647067] mt-0.5">
            Track your machinery work, income, and payments at a glance.
          </p>
        </div>

        {/* Compact Date Range Picker on Right */}
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {loading && (
        <div className="py-6 flex items-center justify-center">
          <Loading />
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          Unable to refresh live metrics.
        </div>
      )}

      {/* Row 1: Four Soft Pastel KPI Summary Cards */}
      <DashboardKpiRow
        workValuePaise={data?.workValuePaise ?? 0}
        collectionsPaise={data?.collectionsPaise ?? 0}
        pendingPaise={data?.outstandingPaise ?? 0}
        utilizationPct={data?.machineryUtilizationPct}
        workValueGrowth={data?.revenueGrowthPct}
        collectionsGrowth={data?.collectedGrowthPct}
        pendingGrowth={data?.pendingGrowthPct}
        utilizationGrowth={data?.machineryGrowthPct}
      />

      {/* Row 2: Revenue Trend Bar Chart (~58%) & Machinery Utilization (~42%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <RevenueTrendBarChart
            data6={data?.monthlyTrend ?? []}
            data12={data?.monthlyTrend12 ?? []}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-2xl border border-[#E3E8E4] p-5 h-full"><h2 className="font-bold">Machinery Utilization</h2><p className="text-sm text-[#647067] mt-3">Not enough data. Record operating and available hours for the same period to calculate utilization.</p><Link to="/machinery" className="inline-block mt-4 text-sm font-semibold text-[#15803D]">View Machinery &amp; Tools →</Link></div>
        </div>
      </div>

      {/* Row 3: Recent Activity (~46%) & Pending Payments (Top Farmers) (~54%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
          <CompactRecentActivity items={data?.recentActivity ?? []} />
        </div>
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          <PendingPaymentsTable items={data?.pendingPaymentsTopFarmers ?? []} />
        </div>
      </div>
    </div>
  );
}
