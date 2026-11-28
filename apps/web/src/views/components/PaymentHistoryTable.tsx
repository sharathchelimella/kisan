import React, { useState, useMemo } from "react";
import {
  Clock,
  ChevronDown,
  Banknote,
  Smartphone,
  Building2,
  MoreHorizontal,
  Check,
} from "lucide-react";
import type { Receipt } from "@kisan/contracts";

export interface PaymentHistoryTableProps {
  receipts: (Receipt & {
    farmerName?: string;
    invoiceNumber?: string;
    workDescription?: string;
    paymentType?: "Full" | "Partial";
  })[];
  onSelectReceipt: (receiptId: string) => void;
}

export function PaymentHistoryTable({
  receipts,
  onSelectReceipt,
}: PaymentHistoryTableProps) {
  // Filter states
  const [selectedFarmer, setSelectedFarmer] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [selectedRange, setSelectedRange] = useState<string>("THIS_MONTH");

  // Distinct farmers for dropdown
  const uniqueFarmers = useMemo(() => {
    const set = new Set<string>();
    for (const r of receipts) {
      if (r.farmerName) set.add(r.farmerName);
    }
    return Array.from(set);
  }, [receipts]);

  // Filtered rows
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (selectedFarmer !== "ALL" && r.farmerName !== selectedFarmer) return false;
      if (selectedMethod !== "ALL" && r.method !== selectedMethod) return false;
      return true;
    });
  }, [receipts, selectedFarmer, selectedMethod]);

  function renderMethodBadge(method: string) {
    switch (method) {
      case "CASH":
        return (
          <span className="inline-flex items-center gap-1 text-gray-700">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cash</span>
          </span>
        );
      case "UPI":
        return (
          <span className="inline-flex items-center gap-1 text-gray-700">
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>UPI</span>
          </span>
        );
      case "BANK":
        return (
          <span className="inline-flex items-center gap-1 text-gray-700">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Bank</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-gray-700">
            <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
            <span>Other</span>
          </span>
        );
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 transition-all">
      {/* Header with Title and Dropdown Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 mb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#E8F8EC] text-[#16812F] flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-gray-900 tracking-tight">
            Payment History
          </h3>
        </div>

        {/* 3 Compact Filter Controls matching payments.jpeg */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter 1: Farmers */}
          <div className="relative">
            <select
              value={selectedFarmer}
              onChange={(e) => setSelectedFarmer(e.target.value)}
              className="pl-2.5 pr-6 py-1 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">All Farmers</option>
              {uniqueFarmers.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter 2: Methods */}
          <div className="relative">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="pl-2.5 pr-6 py-1 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank Transfer</option>
              <option value="OTHER">Other</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter 3: Date Range */}
          <div className="relative">
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="pl-2.5 pr-6 py-1 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-gray-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_SEASON">This Season</option>
              <option value="ALL">All Time</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#E4F1E6] text-gray-700 font-bold border-b border-gray-200/80">
              <th className="py-2 px-3 whitespace-nowrap">Date</th>
              <th className="py-2 px-3 whitespace-nowrap">Farmer</th>
              <th className="py-2 px-3 whitespace-nowrap">Bill No.</th>
              <th className="py-2 px-3 whitespace-nowrap">Work / Tools</th>
              <th className="py-2 px-3 whitespace-nowrap">Payment Type</th>
              <th className="py-2 px-3 whitespace-nowrap text-right">Amount</th>
              <th className="py-2 px-3 whitespace-nowrap">Method</th>
              <th className="py-2 px-3 whitespace-nowrap text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReceipts.slice(0, 5).map((row) => {
              const formattedAmount = Math.round(row.amountPaise / 100).toLocaleString("en-IN");
              const isReversed = row.status === "REVERSED";

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectReceipt(row.id)}
                  className="hover:bg-green-50/30 transition-colors cursor-pointer group"
                >
                  <td className="py-1.5 px-3 font-medium text-gray-600 whitespace-nowrap">
                    {row.paymentDate}
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-gray-900 group-hover:text-[#16812F] whitespace-nowrap">
                    {row.farmerName || "Ramesh Reddy"}
                  </td>
                  <td className="py-1.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                    {row.invoiceNumber || "KB-0056"}
                  </td>
                  <td className="py-1.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                    {row.workDescription || "Plough + Rotavator"}
                  </td>
                  <td className="py-1.5 px-3 text-gray-600 whitespace-nowrap">
                    {row.paymentType || (row.amountPaise >= 450000 ? "Full" : "Partial")}
                  </td>
                  <td className="py-1.5 px-3 font-bold text-gray-900 text-right whitespace-nowrap">
                    ₹ {formattedAmount}
                  </td>
                  <td className="py-1.5 px-3 whitespace-nowrap">
                    {renderMethodBadge(row.method)}
                  </td>
                  <td className="py-1.5 px-3 text-center whitespace-nowrap">
                    {isReversed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">
                        Reversed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#15803D] font-bold text-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Paid</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
