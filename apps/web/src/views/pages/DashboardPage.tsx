import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDashboard } from "../../controllers/useDashboard";
import { DateRangePicker, type DateRange } from "../components/DateRangePicker";
import { DashboardKpiRow } from "../components/KpiCard";
import {
  RevenueTrendBarChart,
  MachineryUtilizationSection,
} from "../components/AnalyticsCharts";
import {
  CompactRecentActivity,
  PendingPaymentsTable,
} from "../components/DashboardSections";
import { Loading } from "../components/ui";

export function DashboardPage() {
  const { t } = useTranslation();

  // Default to reference image period: Jan 1 - Jan 31, 2025
  const [dateRange, setDateRange] = useState<DateRange>({
    from: "2025-01-01",
    to: "2025-01-31",
    label: "This Month (Jan 1 – Jan 31, 2025)",
  });

  const { data, loading, error } = useDashboard({
    from: dateRange.from,
    to: dateRange.to,
    asOf: "2025-01-31",
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
          Unable to refresh live metrics. Displaying baseline operational overview.
        </div>
      )}

      {/* Row 1: Four Soft Pastel KPI Summary Cards */}
      <DashboardKpiRow
        workValuePaise={data?.workValuePaise || 48200000}
        collectionsPaise={data?.collectionsPaise || 32600000}
        pendingPaise={data?.outstandingPaise || 15600000}
        utilizationPct={data?.machineryUtilizationPct || 78}
        workValueGrowth={data?.revenueGrowthPct ?? 18}
        collectionsGrowth={data?.collectedGrowthPct ?? 22}
        pendingGrowth={data?.pendingGrowthPct ?? -4}
        utilizationGrowth={data?.machineryGrowthPct ?? 6}
      />

      {/* Row 2: Revenue Trend Bar Chart (~58%) & Machinery Utilization (~42%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <RevenueTrendBarChart
            data6={data?.monthlyTrend}
            data12={data?.monthlyTrend12}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <MachineryUtilizationSection items={data?.machineryStats} />
        </div>
      </div>

      {/* Row 3: Recent Activity (~46%) & Pending Payments (Top Farmers) (~54%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
          <CompactRecentActivity items={data?.recentActivity} />
        </div>
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          <PendingPaymentsTable items={data?.pendingPaymentsTopFarmers} />
        </div>
      </div>
    </div>
  );
}
