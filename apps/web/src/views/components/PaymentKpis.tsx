import React from "react";
import { Wallet, CheckCircle2, Hourglass, FileText, Sprout } from "lucide-react";
import type { PaymentKpiSummary } from "../../services/payments";

interface PaymentKpisProps {
  summary: PaymentKpiSummary;
}

export function PaymentKpis({ summary }: PaymentKpisProps) {
  const formattedWorkAmount = Math.round(summary.totalWorkPaise / 100).toLocaleString("en-IN");
  const formattedPaidAmount = Math.round(summary.totalPaidPaise / 100).toLocaleString("en-IN");
  const formattedPendingAmount = Math.round(summary.pendingPaise / 100).toLocaleString("en-IN");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
      {/* CARD 1: Total Work Amount */}
      <div className="relative bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3.5 sm:px-4 sm:py-3 overflow-hidden transition-all hover:shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#E8F8EC] text-[#16812F] flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-medium text-gray-500">
            Total Work Amount
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            ₹ {formattedWorkAmount}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
          (This Season)
        </p>

        {/* Decorative mini sprout/leaf in bottom-right corner as seen in payments.jpeg */}
        <div className="absolute right-3 bottom-2 pointer-events-none opacity-40 text-emerald-600">
          <Sprout className="w-6 h-6 stroke-[1.5]" />
        </div>
      </div>

      {/* CARD 2: Total Paid */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3.5 sm:px-4 sm:py-3 overflow-hidden transition-all hover:shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#E0F5E1] text-[#15803D] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-medium text-gray-500">
            Total Paid
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-[#15803D] tracking-tight">
            ₹ {formattedPaidAmount}
          </span>
        </div>
        <p className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">
          ({summary.collectionPercent}%)
        </p>
      </div>

      {/* CARD 3: Pending Amount */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3.5 sm:px-4 sm:py-3 overflow-hidden transition-all hover:shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Hourglass className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-medium text-gray-500">
            Pending Amount
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-[#B91C1C] tracking-tight">
            ₹ {formattedPendingAmount}
          </span>
        </div>
        <p className="text-[11px] text-red-600/80 mt-0.5 font-medium">
          ({summary.pendingPercent}%)
        </p>
      </div>

      {/* CARD 4: Total Bills */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-3.5 sm:px-4 sm:py-3 overflow-hidden transition-all hover:shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#E2E8FF] text-[#315BC8] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="text-xs font-medium text-gray-500">
            Total Bills
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            {summary.totalBills}
          </span>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
          {summary.paidBills} Paid &nbsp;|&nbsp; {summary.pendingBills} Pending
        </p>
      </div>
    </div>
  );
}
