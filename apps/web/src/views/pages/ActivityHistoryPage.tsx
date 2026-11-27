import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  ChevronRight,
  ChevronLeft,
  History,
  Download,
} from "lucide-react";
import { useDashboard } from "../../controllers/useDashboard";
import { formatInr } from "../components/KpiCard";
import {
  getActivityMeta,
  getActivityRoute,
  type RecentActivityItem,
} from "../components/DashboardSections";
import { Loading } from "../components/ui";

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export function ActivityHistoryPage() {
  const navigate = useNavigate();
  const current = today();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState(current);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data, loading, error } = useDashboard({
    from: fromDate,
    to: toDate,
    asOf: current,
  });

  // Base activities list with comprehensive mock baseline
  const baseActivities: RecentActivityItem[] = useMemo(() => {
    if (data?.recentActivity && data.recentActivity.length > 0) {
      return data.recentActivity;
    }
    return [
      {
        id: "ACT-101",
        kind: "PAYMENT_RECEIVED",
        date: "2026-11-27",
        timestamp: "2026-11-27 14:30",
        label: "Payment received via UPI",
        amountPaise: 1500000,
        farmerName: "Mallaiah Yadav",
        reference: "REC-4902",
        status: "COMPLETED",
        entityId: "DEMO-rec-1",
        entityType: "PAYMENT",
      },
      {
        id: "ACT-102",
        kind: "WORK_COMPLETED",
        date: "2026-11-26",
        timestamp: "2026-11-26 17:15",
        label: "Rotavator 4.5 Acres tilling",
        amountPaise: 652500,
        farmerName: "Venkat Reddy",
        reference: "WRK-8921",
        status: "COMPLETED",
        entityId: "DEMO-work-1001",
        entityType: "JOB",
      },
      {
        id: "ACT-103",
        kind: "INVOICE_GENERATED",
        date: "2026-11-25",
        timestamp: "2026-11-25 11:20",
        label: "Invoice KMM-000124 generated",
        amountPaise: 920000,
        farmerName: "Srinivas Goud",
        reference: "KMM-000124",
        status: "ISSUED",
        entityId: "DEMO-invoice-1",
        entityType: "INVOICE",
      },
      {
        id: "ACT-104",
        kind: "FARMER_REGISTERED",
        date: "2026-11-25",
        timestamp: "2026-11-25 09:45",
        label: "New farmer profile created",
        amountPaise: 0,
        farmerName: "Rajesh Patel (Jannaram)",
        reference: "FARM-108",
        status: "ACTIVE",
        entityId: "DEMO-farmer-1",
        entityType: "FARMER",
      },
      {
        id: "ACT-105",
        kind: "MACHINERY_ADDED",
        date: "2026-11-24",
        timestamp: "2026-11-24 16:00",
        label: "Mahindra 575 DI (45 HP) registered",
        amountPaise: 0,
        farmerName: "Fleet Asset",
        reference: "TS-19-TR-1001",
        status: "ACTIVE",
        entityId: "DEMO-tractor",
        entityType: "EQUIPMENT",
      },
      {
        id: "ACT-106",
        kind: "WORK_SCHEDULED",
        date: "2026-11-24",
        timestamp: "2026-11-24 10:15",
        label: "Multi-crop Threshing scheduled",
        amountPaise: 440000,
        farmerName: "Balaraju Kurma",
        reference: "WRK-8924",
        status: "SCHEDULED",
        entityId: "DEMO-work-1003",
        entityType: "JOB",
      },
      {
        id: "ACT-107",
        kind: "WORK_UPDATED",
        date: "2026-11-23",
        timestamp: "2026-11-23 15:40",
        label: "Job rate adjusted and revised",
        amountPaise: 600000,
        farmerName: "Kishan Rao",
        reference: "WRK-8919",
        status: "COMPLETED",
        entityId: "DEMO-work-1001",
        entityType: "JOB",
      },
      {
        id: "ACT-108",
        kind: "PAYMENT_RECEIVED",
        date: "2026-11-22",
        timestamp: "2026-11-22 11:10",
        label: "Advance cash payment collected",
        amountPaise: 500000,
        farmerName: "Chandra Shekar",
        reference: "REC-4901",
        status: "COMPLETED",
        entityId: "DEMO-rec-1",
        entityType: "PAYMENT",
      },
    ];
  }, [data]);

  // Filtered & Sorted Activities
  const filteredActivities = useMemo(() => {
    let result = [...baseActivities];

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          (item.farmerName && item.farmerName.toLowerCase().includes(q)) ||
          (item.label && item.label.toLowerCase().includes(q)) ||
          (item.reference && item.reference.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (typeFilter !== "ALL") {
      result = result.filter((item) => {
        const k = (item.kind || item.entityType || "").toUpperCase();
        return k.includes(typeFilter);
      });
    }

    // Date range filter
    if (fromDate) {
      result = result.filter((item) => item.date >= fromDate);
    }
    if (toDate) {
      result = result.filter((item) => item.date <= toDate);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = a.timestamp || a.date;
      const dateB = b.timestamp || b.date;
      return sortOrder === "desc"
        ? dateB.localeCompare(dateA)
        : dateA.localeCompare(dateB);
    });

    return result;
  }, [baseActivities, search, typeFilter, fromDate, toDate, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
  const paginatedActivities = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, page, pageSize]);

  const handleExportCsv = () => {
    const headers = "Activity ID,Type,Farmer/Asset,Description,Reference,Date,Timestamp,Amount (INR),Status\n";
    const rows = filteredActivities
      .map(
        (a) =>
          `"${a.id}","${a.kind}","${a.farmerName || ""}","${a.label.replace(/"/g, '""')}","${a.reference || ""}","${a.date}","${a.timestamp || ""}","${(a.amountPaise || 0) / 100}","${a.status || ""}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kisan-activity-history-${fromDate}-to-${toDate}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="space-y-6" aria-labelledby="activity-history-heading">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/" className="hover:text-[#15803D] transition-colors">
              Dashboard
            </Link>
            <ChevronRight size={13} />
            <span className="font-semibold text-[#14251C]">Activity History</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-[#15803D] flex items-center justify-center">
              <History size={18} />
            </span>
            <div>
              <h1 id="activity-history-heading" className="text-xl md:text-2xl font-bold text-[#14251C] tracking-tight">
                Activity History & Audit Log
              </h1>
              <p className="text-xs text-[#64748B]">
                Complete chronological log of all machinery operations, billing, payments, and fleet events
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E2E8E5] bg-white text-xs font-semibold text-[#64748B] hover:text-[#14251C] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8E5] bg-white text-xs font-semibold text-[#15803D] hover:bg-emerald-50/50 transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by farmer, machinery, or reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#15803D] transition-colors"
            />
          </div>

          {/* Activity Type Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#15803D] transition-colors text-[#14251C] font-medium"
            >
              <option value="ALL">All Activity Types</option>
              <option value="WORK">Work Records (Completed / Scheduled)</option>
              <option value="INVOICE">Invoices Issued</option>
              <option value="PAYMENT">Payments Received</option>
              <option value="FARMER">Farmer Registrations</option>
              <option value="MACHINERY">Machinery Fleet</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-2.5 py-2 text-xs rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#15803D]"
            />
            <span className="text-[#64748B] text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-2.5 py-2 text-xs rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#15803D]"
            />
          </div>

          {/* Sort Order Toggle */}
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] hover:bg-gray-100 font-semibold text-[#14251C] transition-colors cursor-pointer"
            >
              <ArrowUpDown size={13} />
              <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
            </button>
          </div>
        </div>

        {/* Counter & Active Filter Pills */}
        <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
          <span>
            Showing <strong className="text-[#14251C]">{filteredActivities.length}</strong> matching activities
          </span>
          {(search || typeFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("ALL");
              }}
              className="text-[#15803D] font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="py-12 flex items-center justify-center">
          <Loading />
        </div>
      )}

      {/* Main Activities Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8E5] text-[#64748B] font-semibold bg-[#F7F9F8]">
                <th className="py-3 px-3.5 rounded-l-lg">Activity</th>
                <th className="py-3 px-3.5">Farmer / Asset</th>
                <th className="py-3 px-3.5">Description / Service</th>
                <th className="py-3 px-3.5">Date & Time</th>
                <th className="py-3 px-3.5 text-right">Amount</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E5]/70">
              {paginatedActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    No activities found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedActivities.map((row) => {
                  const meta = getActivityMeta(row.kind);
                  const Icon = meta.icon;
                  const detailsUrl = getActivityRoute(row);

                  return (
                    <tr key={row.id} className="hover:bg-emerald-50/20 transition-colors">
                      {/* Activity Type Badge & Icon */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.iconColor}`}
                          >
                            <Icon size={14} />
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                      </td>

                      {/* Farmer / Machinery Name */}
                      <td className="py-3 px-3.5 font-semibold text-[#14251C]">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#15803D] font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {(row.farmerName || "K")[0]}
                          </span>
                          <span className="truncate max-w-[170px]">
                            {row.farmerName || "Fleet Asset"}
                          </span>
                        </div>
                      </td>

                      {/* Description / Reference */}
                      <td className="py-3 px-3.5 text-[#14251C]">
                        <span className="font-medium block leading-tight">
                          {row.label}
                        </span>
                        {row.reference && (
                          <span className="text-[#64748B] text-[10px] font-mono mt-0.5 block">
                            Ref: {row.reference}
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">
                        <span className="block font-medium text-[#14251C]">
                          {row.date}
                        </span>
                        {row.timestamp && (
                          <span className="text-[10px] text-[#64748B] block">
                            {row.timestamp.includes(" ") ? row.timestamp.split(" ")[1] : ""}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 text-right font-bold text-[#14251C] whitespace-nowrap">
                        {row.amountPaise && row.amountPaise > 0
                          ? formatInr(row.amountPaise)
                          : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.status === "COMPLETED" || row.status === "ACTIVE"
                              ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                              : row.status === "SCHEDULED"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {row.status || "Active"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <Link
                          to={detailsUrl}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-[#15803D] hover:bg-[#15803D] hover:text-white font-semibold text-xs transition-colors no-underline"
                        >
                          <span>View Details</span>
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E2E8E5] text-xs">
            <span className="text-[#64748B]">
              Page <strong className="text-[#14251C]">{page}</strong> of{" "}
              <strong className="text-[#14251C]">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E2E8E5] bg-white font-semibold text-[#64748B] hover:text-[#14251C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E2E8E5] bg-white font-semibold text-[#64748B] hover:text-[#14251C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
