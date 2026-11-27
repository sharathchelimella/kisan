import {
  Coins,
  CheckCircle2,
  Clock,
  Tractor,
  Wallet,
  Hourglass,
  Users,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export function formatInr(paise: number): string {
  const rupees = Math.round(paise / 100);
  return "₹" + new Intl.NumberFormat("en-IN").format(rupees);
}

export interface KpiCardProps {
  title: string;
  value: string;
  growth: number;
  comparisonText?: string;
  type: "workValue" | "collections" | "pending" | "utilization";
}

export function KpiCard({
  title,
  value,
  growth,
  comparisonText = "vs last month",
  type,
}: KpiCardProps) {
  const isPositive = growth >= 0;

  const cardConfig = {
    workValue: {
      cardBg: "bg-[#E8F7E6] border-[#D7EED4]",
      iconBg: "bg-[#C8EFC7]",
      iconColor: "text-[#15803D]",
      icon: Coins,
    },
    collections: {
      cardBg: "bg-[#E5F8F2] border-[#D2F0E6]",
      iconBg: "bg-[#C2F2E3]",
      iconColor: "text-[#0D9488]",
      icon: Wallet,
    },
    pending: {
      cardBg: "bg-[#FFF4E4] border-[#FCE6CA]",
      iconBg: "bg-[#FFE2BA]",
      iconColor: "text-[#D97706]",
      icon: Clock,
    },
    utilization: {
      cardBg: "bg-[#E2F4FC] border-[#CCEAF7]",
      iconBg: "bg-[#BAE6FD]",
      iconColor: "text-[#0284C7]",
      icon: Tractor,
    },
  }[type];

  const Icon = cardConfig.icon;

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 shadow-xs transition-all duration-200 flex items-center gap-3.5 md:gap-4 min-h-[110px] ${cardConfig.cardBg}`}
    >
      {/* Circular Pastel Icon Container on Left */}
      <div
        className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${cardConfig.iconBg} ${cardConfig.iconColor} shadow-xs`}
      >
        <Icon size={21} className="stroke-[2.2]" />
      </div>

      {/* Content on Right matching Reference Image */}
      <div className="flex-1 min-w-0">
        <span className="text-xs md:text-[13px] font-medium text-[#647067] tracking-tight block truncate">
          {title}
        </span>

        <span className="text-2xl md:text-[26px] font-extrabold text-[#17251C] tracking-tight leading-tight my-0.5 block truncate">
          {value}
        </span>

        {/* Growth vs Previous Period */}
        <div className="flex items-center gap-1 text-[11px] md:text-xs">
          <span
            className={`font-bold flex items-center ${
              type === "pending"
                ? isPositive
                  ? "text-[#DC2626]"
                  : "text-[#DC2626]"
                : isPositive
                ? "text-[#16883D]"
                : "text-[#DC2626]"
            }`}
          >
            {isPositive ? (
              <span className="mr-0.5">↑ +{growth}%</span>
            ) : (
              <span className="mr-0.5">↓ {growth}%</span>
            )}
          </span>
          <span className="text-[#647067] font-medium">{comparisonText}</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardKpiRow({
  workValuePaise = 48200000,
  collectionsPaise = 32600000,
  pendingPaise = 15600000,
  utilizationPct = 78,
  workValueGrowth = 18,
  collectionsGrowth = 22,
  pendingGrowth = -4,
  utilizationGrowth = 6,
}: {
  workValuePaise?: number;
  collectionsPaise?: number;
  pendingPaise?: number;
  utilizationPct?: number;
  workValueGrowth?: number;
  collectionsGrowth?: number;
  pendingGrowth?: number;
  utilizationGrowth?: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
      {/* 1. Total Work Value */}
      <KpiCard
        title="Total Work Value"
        value={formatInr(workValuePaise)}
        growth={workValueGrowth}
        type="workValue"
      />

      {/* 2. Collections (Paid) */}
      <KpiCard
        title="Collections (Paid)"
        value={formatInr(collectionsPaise)}
        growth={collectionsGrowth}
        type="collections"
      />

      {/* 3. Pending Payments */}
      <KpiCard
        title="Pending Payments"
        value={formatInr(pendingPaise)}
        growth={pendingGrowth}
        type="pending"
      />

      {/* 4. Machinery Utilization */}
      <KpiCard
        title="Machinery Utilization"
        value={`${utilizationPct}%`}
        growth={utilizationGrowth}
        type="utilization"
      />
    </div>
  );
}

// Preserve backwards compatibility for ReportsPage
export function KpiSummaryRow({
  revenuePaise = 48500000,
  collectedPaise = 37200000,
  pendingPaise = 11300000,
  worksCount = 124,
  farmersCount = 87,
  revenueGrowthPct = 18.4,
  collectedPct = 76.7,
  pendingPct = 23.3,
  worksGrowthPct = 12.7,
  farmersGrowthPct = 6.1,
}: {
  revenuePaise?: number;
  collectedPaise?: number;
  pendingPaise?: number;
  worksCount?: number;
  farmersCount?: number;
  revenueGrowthPct?: number;
  collectedPct?: number;
  pendingPct?: number;
  worksGrowthPct?: number;
  farmersGrowthPct?: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 md:gap-4">
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-4 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-[#64748B]">Total Revenue</span>
        <span className="text-xl font-bold text-[#14251C] mt-1">{formatInr(revenuePaise)}</span>
        <span className="text-[11px] text-[#16A34A] font-medium mt-1">↑ +{revenueGrowthPct}% vs last period</span>
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-4 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-[#64748B]">Collected</span>
        <span className="text-xl font-bold text-[#14251C] mt-1">{formatInr(collectedPaise)}</span>
        <span className="text-[11px] text-[#64748B] mt-1">{collectedPct}% of revenue</span>
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-4 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-[#64748B]">Pending</span>
        <span className="text-xl font-bold text-[#14251C] mt-1">{formatInr(pendingPaise)}</span>
        <span className="text-[11px] text-[#64748B] mt-1">{pendingPct}% of revenue</span>
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-4 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-[#64748B]">Total Works</span>
        <span className="text-xl font-bold text-[#14251C] mt-1">{worksCount}</span>
        <span className="text-[11px] text-[#16A34A] font-medium mt-1">↑ +{worksGrowthPct}%</span>
      </div>
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-4 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-[#64748B]">Active Farmers</span>
        <span className="text-xl font-bold text-[#14251C] mt-1">{farmersCount}</span>
        <span className="text-[11px] text-[#16A34A] font-medium mt-1">↑ +{farmersGrowthPct}%</span>
      </div>
    </div>
  );
}
