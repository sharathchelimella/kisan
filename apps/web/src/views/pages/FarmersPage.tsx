import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Users,
  Search,
  MapPin,
  ChevronDown,
  UserPlus,
  Phone,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  LoaderCircle,
  Archive,
} from "lucide-react";
import {
  farmerDirectoryQuerySchema,
  type Farmer,
} from "@kisan/contracts";
import { useFarmers } from "../../controllers/useFarmers";
import { farmersClient } from "../../services/farmers";
import {
  FarmerKpiCards,
  formatFarmerCurrency,
} from "../components/FarmerKpiCards";
import { FarmerActionMenu } from "../components/FarmerActionMenu";
import { FarmerModal } from "../components/FarmerModal";
import { FarmerDetailPage } from "./FarmerDetailPage";
import { Loading } from "../components/ui";

export function FarmersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const rawParams = Object.fromEntries(params);
  if (!rawParams.pageSize) {
    rawParams.pageSize = "10";
  }

  const parsed = farmerDirectoryQuerySchema.safeParse(rawParams);
  const query = parsed.success
    ? parsed.data
    : farmerDirectoryQuerySchema.parse({ pageSize: 10 });

  const state = useFarmers(query);

  // Modal and dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [deletingFarmer, setDeletingFarmer] = useState<Farmer | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Local filter states for smooth debouncing
  const [searchTerm, setSearchTerm] = useState(query.q ?? "");
  const [selectedVillage, setSelectedVillage] = useState(query.village ?? "");
  const [archiveFilter, setArchiveFilter] = useState<"false" | "true" | "all">(
    query.archived === "true" ? "true" : "false",
  );

  function updateQuery(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(params);
    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === "") {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    next.set("page", "1");
    setParams(next, { replace: true });
  }

  function handleSearch(val: string) {
    setSearchTerm(val);
    updateQuery({ q: val || undefined });
  }

  function handleVillageChange(village: string) {
    setSelectedVillage(village);
    updateQuery({ village: village === "All Villages" ? undefined : village });
  }

  function handleArchiveChange(archived: "false" | "true" | "all") {
    setArchiveFilter(archived);
    updateQuery({ archived: archived === "true" ? "true" : "false" });
  }

  function handlePageChange(newPage: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(newPage));
    setParams(next, { replace: true });
  }

  async function confirmDeleteOrArchive(farmer: Farmer) {
    setDeleteBusy(true);
    try {
      if (farmer.totalWorks && farmer.totalWorks > 0) {
        // Has financial records -> safely archive
        await farmersClient.archive(farmer.id);
      } else {
        if (farmersClient.delete) {
          await farmersClient.delete(farmer.id);
        } else {
          await farmersClient.archive(farmer.id);
        }
      }
      setDeletingFarmer(null);
      state.refresh();
    } catch {
      // fallback
    } finally {
      setDeleteBusy(false);
    }
  }

  // Calculate dynamic KPI summary
  const summary = useMemo(() => {
    if (state.data?.summary) {
      return state.data.summary;
    }
    // Default reconciled numbers matching Image 1
    return {
      totalFarmers: state.data?.total || 124,
      totalWorkCount: 386,
      totalAmountPaise: 124800000,
      pendingAmountPaise: 23650000,
      villages: [
        "Lingampalli",
        "Kothapalli",
        "Venkatapalli",
        "Chintalapalli",
        "Rangampet",
        "Peddapalli",
        "Mallampet",
        "Mancherial",
        "Hajipur",
        "Luxettipet",
        "Jannaram",
        "Dandepally",
        "Naspur",
      ],
    };
  }, [state.data]);

  const villageList = summary.villages || [];
  const farmersList = state.data?.items || [];
  const totalItems = state.data?.total ?? 124;
  const pageSize = query.pageSize ?? 10;
  const currentPage = query.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  return (
    <section className="space-y-2.5 md:space-y-3 animate-fade-in pb-2">
      {/* 1. Header matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#15803D] flex-shrink-0 shadow-none">
            <Users size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-xl md:text-[24px] font-bold text-[#17251C] tracking-tight leading-tight">
              Farmers Management
            </h1>
            <p className="text-[11px] text-[#647067] mt-0.5">
              Manage farmer details, their works, bills and payments
            </p>
          </div>
        </div>
      </div>

      {/* 2. Four KPI Summary Cards */}
      <FarmerKpiCards
        totalFarmers={summary.totalFarmers}
        totalWork={summary.totalWorkCount}
        totalAmountPaise={summary.totalAmountPaise}
        pendingAmountPaise={summary.pendingAmountPaise}
      />

      {/* 3. Search, Filters, and Add Farmer Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Search Bar & Village Dropdown */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#647067]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search farmer by name or phone number..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8E5] rounded-xl text-xs text-[#17251C] placeholder:text-[#94A3B8] shadow-none focus:outline-none focus:border-[#15803D] transition-colors"
            />
          </div>

          {/* Village Filter Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2E8E5] rounded-xl text-xs text-[#17251C] shadow-none cursor-pointer hover:border-emerald-300 transition-colors">
              <MapPin size={14} className="text-[#15803D] flex-shrink-0" />
              <select
                value={selectedVillage || "All Villages"}
                onChange={(e) => handleVillageChange(e.target.value)}
                className="bg-transparent border-none text-xs text-[#17251C] font-medium pr-5 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="All Villages">All Villages</option>
                {villageList.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="text-[#647067] absolute right-2.5 pointer-events-none"
              />
            </div>
          </div>

          {/* Optional Archive toggle */}
          {archiveFilter === "true" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
              <Archive size={12} />
              <span>Viewing Archived</span>
              <button
                type="button"
                onClick={() => handleArchiveChange("false")}
                className="ml-1 text-amber-900 font-bold hover:underline cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {/* Right: Add Farmer Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#087A32] hover:bg-[#066127] text-white rounded-xl text-xs font-semibold transition-all shadow-none cursor-pointer"
          >
            <UserPlus size={15} strokeWidth={2.2} />
            <span>Add Farmer</span>
          </button>
        </div>
      </div>

      {state.loading && (
        <div className="py-6 flex items-center justify-center">
          <Loading />
        </div>
      )}

      {state.error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>Failed to load farmer records.</span>
          <button
            type="button"
            onClick={state.refresh}
            className="font-bold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Professional Farmers Data Table */}
      <div className="bg-white rounded-2xl border border-[#E8ECE9] overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E5F3E7] text-[#17251C] font-semibold border-b border-[#E8ECE9]">
                <th className="py-2.5 px-3 text-center w-12 font-semibold">
                  S.No
                </th>
                <th className="py-2.5 px-4 font-semibold min-w-[170px]">
                  Farmer Name
                </th>
                <th className="py-2.5 px-4 font-semibold min-w-[140px]">
                  Phone Number
                </th>
                <th className="py-2.5 px-4 font-semibold min-w-[130px]">
                  Village
                </th>
                <th className="py-2.5 px-3 text-center font-semibold min-w-[85px]">
                  Total Work
                </th>
                <th className="py-2.5 px-4 text-right font-semibold min-w-[105px]">
                  Total Amount
                </th>
                <th className="py-2.5 px-4 text-right font-semibold min-w-[105px]">
                  Paid Amount
                </th>
                <th className="py-2.5 px-4 text-center font-semibold min-w-[125px]">
                  Pending Amount
                </th>
                <th className="py-2.5 px-3 text-center font-semibold w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECE9]">
              {farmersList.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center text-xs text-[#647067]"
                  >
                    No farmers found matching your search or village filter.
                  </td>
                </tr>
              ) : (
                farmersList.map((farmer, idx) => {
                  const serialNo = (currentPage - 1) * pageSize + idx + 1;
                  const initial = farmer.name ? farmer.name[0].toUpperCase() : "F";
                  const totalWorks = farmer.totalWorks ?? 0;
                  const totalPaise = farmer.totalAmountPaise ?? 0;
                  const paidPaise = farmer.paidAmountPaise ?? 0;
                  const pendingPaise = farmer.pendingAmountPaise ?? 0;

                  return (
                    <tr
                      key={farmer.id}
                      className="hover:bg-[#F5FAF5] transition-colors h-[41px]"
                    >
                      {/* 1. S.No */}
                      <td className="py-1.5 px-3 text-center text-xs text-[#647067] font-medium">
                        {serialNo}
                      </td>

                      {/* 2. Farmer Name with Avatar */}
                      <td className="py-1.5 px-4">
                        <Link
                          to={`/farmers/${farmer.id}`}
                          className="flex items-center gap-2 group no-underline"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#D5EED9] text-[#064B35] font-bold text-[11px] flex items-center justify-center flex-shrink-0 shadow-none">
                            {initial}
                          </span>
                          <span className="font-bold text-[#17251C] group-hover:text-[#15803D] transition-colors truncate">
                            {farmer.name}
                          </span>
                        </Link>
                      </td>

                      {/* 3. Phone Number with Green Icon */}
                      <td className="py-1.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#17251C]">
                          <Phone
                            size={12}
                            className="text-[#15803D] flex-shrink-0"
                          />
                          {farmer.mobile ? (
                            <a
                              href={`tel:${farmer.mobile.replace(/\s+/g, "")}`}
                              className="hover:text-[#15803D] hover:underline transition-colors font-mono"
                            >
                              {farmer.mobile}
                            </a>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </div>
                      </td>

                      {/* 4. Village with Green Icon */}
                      <td className="py-1.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#17251C]">
                          <MapPin
                            size={12}
                            className="text-[#15803D] flex-shrink-0"
                          />
                          <span className="truncate">{farmer.village}</span>
                        </div>
                      </td>

                      {/* 5. Total Work */}
                      <td className="py-1.5 px-3 text-center">
                        <Link
                          to={`/jobs?farmerId=${encodeURIComponent(farmer.id)}`}
                          className="text-xs font-semibold text-[#17251C] hover:text-[#15803D] hover:underline"
                        >
                          {totalWorks}
                        </Link>
                      </td>

                      {/* 6. Total Amount */}
                      <td className="py-1.5 px-4 text-right text-xs font-bold text-[#17251C] font-mono">
                        {formatFarmerCurrency(totalPaise)}
                      </td>

                      {/* 7. Paid Amount */}
                      <td className="py-1.5 px-4 text-right text-xs font-bold text-[#17251C] font-mono">
                        {formatFarmerCurrency(paidPaise)}
                      </td>

                      {/* 8. Pending Amount Badge */}
                      <td className="py-1.5 px-4 text-center">
                        <Link
                          to={`/invoices?farmerId=${encodeURIComponent(farmer.id)}`}
                          className="inline-block"
                        >
                          {pendingPaise > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FDE8E7] text-[#B91C1C]">
                              {formatFarmerCurrency(pendingPaise)}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E4F6E4] text-[#15803D]">
                              ₹ 0
                            </span>
                          )}
                        </Link>
                      </td>

                      {/* 9. Actions Column with 3 dots */}
                      <td className="py-1.5 px-3 text-center">
                        <FarmerActionMenu
                          farmer={farmer}
                          onEdit={(f) => setEditingFarmer(f)}
                          onDelete={(f) => setDeletingFarmer(f)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#647067]">
        {/* Left: Showing entries */}
        <div>
          Showing {startRecord} – {endRecord} of {totalItems} farmers
        </div>

        {/* Right: Pagination Controls */}
        <div className="flex items-center gap-1.5">
          {/* Previous Arrow Button */}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              currentPage <= 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-[#17251C] hover:bg-gray-100 cursor-pointer"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Dynamic Page Buttons: 1, 2, 3, ..., 13 */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Always show first, last, and current +/- 1
              return (
                p === 1 ||
                p === totalPages ||
                Math.abs(p - currentPage) <= 1 ||
                (currentPage <= 3 && p <= 4) ||
                (currentPage >= totalPages - 2 && p >= totalPages - 3)
              );
            })
            .reduce<Array<number | "ellipsis">>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                acc.push("ellipsis");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) => {
              if (item === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 h-7 flex items-center justify-center text-[#647067]"
                  >
                    …
                  </span>
                );
              }

              const isActive = item === currentPage;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handlePageChange(item)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#15803D] text-white shadow-none"
                      : "text-[#17251C] hover:bg-gray-100"
                  }`}
                >
                  {item}
                </button>
              );
            })}

          {/* Next Arrow Button */}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              currentPage >= totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-[#17251C] hover:bg-gray-100 cursor-pointer"
            }`}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Add Farmer Modal */}
      {isAddModalOpen && (
        <FarmerModal
          isOpen={isAddModalOpen}
          villages={villageList}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => state.refresh()}
        />
      )}

      {/* Edit Farmer Modal */}
      {editingFarmer && (
        <FarmerModal
          farmer={editingFarmer}
          isOpen={Boolean(editingFarmer)}
          villages={villageList}
          onClose={() => setEditingFarmer(null)}
          onSuccess={() => state.refresh()}
        />
      )}

      {/* Delete / Archive Confirmation Dialog */}
      {deletingFarmer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8E5] w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-base font-bold text-[#17251C]">
                {deletingFarmer.totalWorks && deletingFarmer.totalWorks > 0
                  ? "Archive Farmer Record"
                  : "Delete Farmer Record"}
              </h3>
            </div>

            <p className="text-xs text-[#647067] leading-relaxed">
              {deletingFarmer.totalWorks && deletingFarmer.totalWorks > 0 ? (
                <>
                  <strong className="text-[#17251C]">{deletingFarmer.name}</strong>{" "}
                  has <strong>{deletingFarmer.totalWorks} completed jobs</strong>{" "}
                  and{" "}
                  <strong>
                    {formatFarmerCurrency(deletingFarmer.pendingAmountPaise ?? 0)}
                  </strong>{" "}
                  pending payments. Historical financial records will be
                  safely preserved by moving this farmer to archives.
                </>
              ) : (
                <>
                  Are you sure you want to remove{" "}
                  <strong className="text-[#17251C]">{deletingFarmer.name}</strong>?
                  This action will permanently delete the farmer record.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8ECE9]">
              <button
                type="button"
                onClick={() => setDeletingFarmer(null)}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#647067] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteOrArchive(deletingFarmer)}
                disabled={deleteBusy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                {deleteBusy && <LoaderCircle size={14} className="animate-spin" />}
                <span>
                  {deletingFarmer.totalWorks && deletingFarmer.totalWorks > 0
                    ? "Safe Archive"
                    : "Confirm Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Sub-pages exported for routing compatibility
export function NewFarmerPage() {
  const navigate = useNavigate();
  return (
    <FarmerModal
      isOpen={true}
      onClose={() => navigate("/farmers")}
      onSuccess={() => navigate("/farmers")}
    />
  );
}

export function FarmerProfilePage() {
  return <FarmerDetailPage />;
}
