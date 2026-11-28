import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  IndianRupee,
  Calendar,
  AlertCircle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { paymentClient, type DueItem } from "../../services/payments";
import { Loading } from "../components/ui";

export function OutstandingBalancesPage() {
  const navigate = useNavigate();
  const [dues, setDues] = useState<DueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [villageFilter, setVillageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let active = true;
    paymentClient
      .dues({ page: 1, pageSize: 200 })
      .then((res) => {
        if (!active) return;
        setDues(res.items.filter((item) => item.duePaise > 0));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Aggregated summary by farmer
  const farmerSummaryMap = useMemo(() => {
    interface FarmerDuesGroup {
      farmerId: string;
      farmerName: string;
      village: string;
      mobile?: string;
      pendingInvoices: DueItem[];
      totalBilledPaise: number;
      totalPaidPaise: number;
      totalDuePaise: number;
      oldestDate: string;
    }

    const map = new Map<string, FarmerDuesGroup>();

    for (const d of dues) {
      const existing: FarmerDuesGroup = map.get(d.farmerId) || {
        farmerId: d.farmerId,
        farmerName: d.farmerName,
        village: d.village,
        mobile: (d as any).mobile || "98765 43210",
        pendingInvoices: [],
        totalBilledPaise: 0,
        totalPaidPaise: 0,
        totalDuePaise: 0,
        oldestDate: d.workDate,
      };

      existing.pendingInvoices.push(d);
      existing.totalBilledPaise += d.totalPaise;
      existing.totalPaidPaise += d.paidPaise;
      existing.totalDuePaise += d.duePaise;
      if (d.workDate < existing.oldestDate) {
        existing.oldestDate = d.workDate;
      }

      map.set(d.farmerId, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.totalDuePaise - a.totalDuePaise);
  }, [dues]);

  // Distinct villages
  const distinctVillages = useMemo(() => {
    const s = new Set<string>();
    dues.forEach((d) => s.add(d.village));
    return Array.from(s);
  }, [dues]);

  // Overall metric totals
  const totalOutstandingPaise = useMemo(() => {
    return dues.reduce((sum, d) => sum + d.duePaise, 0);
  }, [dues]);

  const unpaidCount = useMemo(() => {
    return dues.filter((d) => d.paidPaise === 0).length;
  }, [dues]);

  const partialCount = useMemo(() => {
    return dues.filter((d) => d.paidPaise > 0 && d.duePaise > 0).length;
  }, [dues]);

  // Filtered farmers
  const filteredFarmers = useMemo(() => {
    return farmerSummaryMap.filter((f) => {
      if (villageFilter !== "ALL" && f.village !== villageFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          f.farmerName.toLowerCase().includes(q) ||
          f.village.toLowerCase().includes(q) ||
          (f.mobile && f.mobile.includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [farmerSummaryMap, search, villageFilter]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3.5 mb-6">
        <button
          type="button"
          onClick={() => navigate("/payments")}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 shadow-2xs transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight">
            Outstanding Balances
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
            Full ledger of farmers with pending dues and unpaid invoices
          </p>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Outstanding */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4.5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Total Outstanding
          </span>
          <div className="text-2xl font-extrabold text-[#B91C1C] mt-1">
            ₹ {Math.round(totalOutstandingPaise / 100).toLocaleString("en-IN")}
          </div>
          <span className="text-xs text-red-600/80 mt-1 block font-medium">
            Across {dues.length} pending bills
          </span>
        </div>

        {/* Farmers with Dues */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4.5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Farmers with Dues
          </span>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            {farmerSummaryMap.length}
          </div>
          <span className="text-xs text-gray-400 mt-1 block font-medium">
            Active credit accounts
          </span>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4.5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Unpaid Invoices
          </span>
          <div className="text-2xl font-extrabold text-[#B91C1C] mt-1">
            {unpaidCount}
          </div>
          <span className="text-xs text-red-600/80 mt-1 block font-medium">
            Zero payments received yet
          </span>
        </div>

        {/* Partially Paid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4.5 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Partially Paid
          </span>
          <div className="text-2xl font-extrabold text-[#D97706] mt-1">
            {partialCount}
          </div>
          <span className="text-xs text-amber-600/80 mt-1 block font-medium">
            Installments in progress
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by farmer name, phone or village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#16812F] focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="pl-3 pr-8 py-2 text-xs sm:text-sm font-semibold bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-gray-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">All Villages</option>
              {distinctVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#E4F1E6] text-gray-700 font-bold border-b border-gray-200">
                <th className="py-3 px-4">Farmer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4 text-center">Pending Bills</th>
                <th className="py-3 px-4 text-right">Total Billed</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Outstanding Amount</th>
                <th className="py-3 px-4">Oldest Invoice</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFarmers.map((f) => {
                const firstInvoice = f.pendingInvoices[0];
                return (
                  <tr key={f.farmerId} className="hover:bg-green-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {f.farmerName}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      +91 {f.mobile}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">
                      {f.village}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {f.pendingInvoices.length} {f.pendingInvoices.length === 1 ? "Bill" : "Bills"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700 text-right">
                      ₹ {Math.round(f.totalBilledPaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700 text-right">
                      ₹ {Math.round(f.totalPaidPaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#B91C1C] text-right">
                      ₹ {Math.round(f.totalDuePaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {f.oldestDate}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (firstInvoice) {
                            navigate(`/payments?invoiceId=${firstInvoice.invoiceId}&farmerId=${f.farmerId}`);
                          } else {
                            navigate(`/payments?farmerId=${f.farmerId}`);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#075C2D] hover:bg-[#064B24] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Collect Payment</span>
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
