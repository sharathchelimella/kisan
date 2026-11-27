import { Link } from "react-router-dom";
import {
  PlusCircle,
  UserPlus,
  Receipt,
  CreditCard,
  Tractor,
  ArrowRight,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Briefcase,
  FileText,
  UserCheck,
  ChevronRight,
  User,
} from "lucide-react";
import { formatInr } from "./KpiCard";

export interface RecentActivityItem {
  id: string;
  kind: string;
  date: string;
  timestamp?: string;
  label: string;
  amountPaise?: number;
  farmerName?: string;
  reference?: string;
  status?: string;
  entityId?: string;
  entityType?: string;
}

export interface PendingPaymentFarmerItem {
  farmerName: string;
  works: string;
  totalPaise: number;
  paidPaise: number;
  pendingPaise: number;
  farmerId?: string;
}

export function getActivityRoute(item: {
  id: string;
  kind?: string;
  entityId?: string;
  entityType?: string;
}): string {
  const targetId = item.entityId || item.id;
  const k = (item.kind || item.entityType || "").toUpperCase();

  if (k.includes("INVOICE")) {
    return `/invoices/${targetId}`;
  }
  if (k.includes("PAYMENT") || k.includes("RECEIPT")) {
    return `/payments/${targetId}`;
  }
  if (k.includes("FARMER")) {
    return `/farmers/${targetId}`;
  }
  if (k.includes("MACHINERY") || k.includes("EQUIPMENT")) {
    return `/machinery/${targetId}`;
  }
  return `/jobs/${targetId}`;
}

export function getActivityMeta(kind?: string) {
  const k = (kind || "").toUpperCase();

  if (k.includes("PAYMENT") || k.includes("RECEIPT")) {
    return {
      label: "Payment",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-100 text-[#064E3B] border-emerald-200",
      iconColor: "text-[#15803D] bg-emerald-50",
    };
  }
  if (k.includes("INVOICE")) {
    return {
      label: "Invoice",
      icon: FileText,
      badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
      iconColor: "text-blue-700 bg-blue-50",
    };
  }
  if (k.includes("FARMER")) {
    return {
      label: "Farmer",
      icon: UserCheck,
      badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
      iconColor: "text-purple-700 bg-purple-50",
    };
  }
  if (k.includes("MACHINERY") || k.includes("EQUIPMENT")) {
    return {
      label: "Machinery",
      icon: Tractor,
      badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
      iconColor: "text-teal-700 bg-teal-50",
    };
  }
  // Default to Work
  return {
    label: "Work",
    icon: Tractor,
    badgeClass: "bg-emerald-100 text-[#15803D] border-emerald-200",
    iconColor: "text-[#15803D] bg-emerald-50",
  };
}

// 1. Compact Recent Activity Card matching Reference Image exactly!
export function CompactRecentActivity({
  items = [
    {
      id: "ACT-01",
      kind: "WORK_COMPLETED",
      date: "Today",
      timestamp: "Today, 10:24 AM",
      label: "Work added for Ramesh (Ploughing - 3 acres)",
      amountPaise: 600000,
      farmerName: "Ramesh",
      reference: "WRK-8921",
      entityId: "DEMO-work-1001",
      entityType: "JOB",
    },
    {
      id: "ACT-02",
      kind: "PAYMENT_RECEIVED",
      date: "Today",
      timestamp: "Today, 09:18 AM",
      label: "Payment received from Suresh",
      amountPaise: 1000000,
      farmerName: "Suresh",
      reference: "REC-4902",
      entityId: "DEMO-rec-1",
      entityType: "PAYMENT",
    },
    {
      id: "ACT-03",
      kind: "INVOICE_GENERATED",
      date: "Yesterday",
      timestamp: "Yesterday, 06:42 PM",
      label: "Bill created for Lakshmi Narayana",
      amountPaise: 1800000,
      farmerName: "Lakshmi Narayana",
      reference: "KMM-000124",
      entityId: "DEMO-invoice-1",
      entityType: "INVOICE",
    },
    {
      id: "ACT-04",
      kind: "WORK_COMPLETED",
      date: "Yesterday",
      timestamp: "Yesterday, 04:10 PM",
      label: "Work added for Anil (Rotavator - 2.5 acres)",
      amountPaise: 500000,
      farmerName: "Anil",
      reference: "WRK-8922",
      entityId: "DEMO-work-1002",
      entityType: "JOB",
    },
  ],
}: {
  items?: RecentActivityItem[];
}) {
  const displayItems = items.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-[#E3E8E4] p-4 md:p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header + View All Link */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-base font-bold text-[#17251C] tracking-tight">
          Recent Activity
        </h2>
        <Link
          to="/activities"
          className="text-xs font-semibold text-[#15803D] hover:underline flex items-center gap-1 group no-underline"
        >
          <span>View All</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Activity Rows matching Reference Image */}
      <div className="flex-1 flex flex-col justify-around divide-y divide-[#F1F5F3]">
        {displayItems.map((row) => {
          const meta = getActivityMeta(row.kind);
          const Icon = meta.icon;
          const url = getActivityRoute(row);

          return (
            <Link
              key={row.id}
              to={url}
              className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-emerald-50/25 rounded-xl px-2 -mx-2 transition-colors group no-underline"
            >
              {/* Circular Soft Green Icon + Description */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-full bg-[#E8F7E6] text-[#15803D] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Icon size={16} className="stroke-[2.2]" />
                </span>

                <div className="min-w-0">
                  <span className="text-xs md:text-[13px] font-semibold text-[#17251C] group-hover:text-[#15803D] transition-colors block truncate">
                    {row.label}
                  </span>
                  <span className="text-[11px] text-[#647067] block mt-0.5">
                    {row.timestamp || row.date}
                  </span>
                </div>
              </div>

              {/* Amount Badge on Right */}
              {row.amountPaise && row.amountPaise > 0 ? (
                <span className="text-xs font-bold text-[#15803D] bg-[#E8F7E6] px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                  {formatInr(row.amountPaise)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// 2. Pending Payments (Top Farmers) Table matching Reference Image exactly!
export function PendingPaymentsTable({
  items = [
    {
      farmerName: "Ramesh",
      works: "Tractor, Rotavator",
      totalPaise: 4800000,
      paidPaise: 3000000,
      pendingPaise: 1800000,
      farmerId: "DEMO-farmer-1",
    },
    {
      farmerName: "Suresh",
      works: "Plough",
      totalPaise: 3200000,
      paidPaise: 1000000,
      pendingPaise: 2200000,
      farmerId: "DEMO-farmer-2",
    },
    {
      farmerName: "Lakshmi Narayana",
      works: "Rotavator",
      totalPaise: 1800000,
      paidPaise: 0,
      pendingPaise: 1800000,
      farmerId: "DEMO-farmer-1",
    },
    {
      farmerName: "Anil",
      works: "Tractor",
      totalPaise: 1200000,
      paidPaise: 500000,
      pendingPaise: 700000,
      farmerId: "DEMO-farmer-2",
    },
  ],
}: {
  items?: PendingPaymentFarmerItem[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E3E8E4] p-4 md:p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header + View All Link */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-base font-bold text-[#17251C] tracking-tight">
          Pending Payments (Top Farmers)
        </h2>
        <Link
          to="/payments?status=UNPAID"
          className="text-xs font-semibold text-[#15803D] hover:underline flex items-center gap-1 group no-underline"
        >
          <span>View All</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Table matching Reference Image */}
      <div className="overflow-x-auto custom-scrollbar flex-1 flex flex-col justify-between">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E3E8E4] text-[#647067] font-semibold bg-[#F8FAF9]">
              <th className="py-2 px-3 rounded-l-lg">Farmer</th>
              <th className="py-2 px-3">Works</th>
              <th className="py-2 px-3">Total Amount</th>
              <th className="py-2 px-3">Paid</th>
              <th className="py-2 px-3 text-right rounded-r-lg">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F3]">
            {items.map((row) => (
              <tr
                key={row.farmerName}
                className="hover:bg-emerald-50/20 transition-colors group cursor-pointer"
              >
                {/* Farmer Name */}
                <td className="py-2.5 px-3 font-bold text-[#17251C] whitespace-nowrap">
                  <Link
                    to={`/farmers/${row.farmerId || "DEMO-farmer-1"}`}
                    className="hover:text-[#15803D] transition-colors no-underline text-[#17251C] font-bold"
                  >
                    {row.farmerName}
                  </Link>
                </td>

                {/* Works Done */}
                <td className="py-3 px-3 text-[#647067] whitespace-nowrap">
                  {row.works}
                </td>

                {/* Total Amount */}
                <td className="py-3 px-3 text-[#17251C] font-medium whitespace-nowrap">
                  {formatInr(row.totalPaise)}
                </td>

                {/* Paid Amount */}
                <td className="py-3 px-3 text-[#17251C] font-medium whitespace-nowrap">
                  {formatInr(row.paidPaise)}
                </td>

                {/* Pending Amount (Bold Red matching Reference Image!) */}
                <td className="py-3 px-3 text-right font-extrabold text-[#DC2626] whitespace-nowrap">
                  <Link
                    to="/payments?status=UNPAID"
                    className="text-[#DC2626] font-extrabold hover:underline no-underline"
                  >
                    {formatInr(row.pendingPaise)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Preserve backwards compatibility for Reports & Details
export function QuickActions() {
  const actions = [
    { title: "Add New Work", path: "/jobs/new", icon: PlusCircle, color: "text-emerald-700 bg-emerald-100" },
    { title: "Register Farmer", path: "/farmers", icon: UserPlus, color: "text-blue-700 bg-blue-100" },
    { title: "Generate Invoice", path: "/invoices", icon: Receipt, color: "text-amber-700 bg-amber-100" },
    { title: "Record Payment", path: "/payments", icon: CreditCard, color: "text-purple-700 bg-purple-100" },
    { title: "Add Machinery", path: "/machinery", icon: Tractor, color: "text-teal-700 bg-teal-100" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 md:p-6 shadow-sm">
      <h2 className="text-base md:text-lg font-bold text-[#14251C] tracking-tight pb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link key={act.title} to={act.path} className="flex flex-col items-start p-3.5 rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] hover:bg-emerald-50/40 no-underline">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${act.color} mb-2.5`}>
                <Icon size={18} />
              </span>
              <span className="text-xs font-bold text-[#14251C]">{act.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function TodayGlanceCard({
  todayWorkPaise = 1850000,
  todayCollectionsPaise = 1200000,
  scheduledJobs = 4,
  pendingJobs = 6,
}: {
  todayWorkPaise?: number;
  todayCollectionsPaise?: number;
  scheduledJobs?: number;
  pendingJobs?: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 shadow-sm">
      <h2 className="text-base font-bold text-[#14251C] pb-2">Today's Operational Glance</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#F7F9F8] border border-[#E2E8E5]">
          <span className="text-xs text-[#64748B]">Work Value</span>
          <span className="text-base font-bold block mt-1">{formatInr(todayWorkPaise)}</span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <span className="text-xs text-emerald-800">Collections</span>
          <span className="text-base font-bold text-[#15803D] block mt-1">{formatInr(todayCollectionsPaise)}</span>
        </div>
      </div>
    </div>
  );
}

export function RecentActivityTable({
  items = [],
}: {
  items: RecentActivityItem[];
}) {
  return <CompactRecentActivity items={items} />;
}
