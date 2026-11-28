import React from "react";
import { Users, ArrowRight } from "lucide-react";
import type { OutstandingFarmerItem } from "../../services/payments";

export interface OutstandingBalancesPanelProps {
  items: OutstandingFarmerItem[];
  onSelectFarmer: (farmerId: string) => void;
  onViewAllDues: () => void;
}

export function OutstandingBalancesPanel({
  items,
  onSelectFarmer,
  onViewAllDues,
}: OutstandingBalancesPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 transition-all flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 mb-1.5 border-b border-gray-100">
          <div className="w-6 h-6 rounded-md bg-[#E8F8EC] text-[#16812F] flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-gray-900 tracking-tight">
            Outstanding Balances
          </h3>
        </div>

        {/* Farmer Outstanding Rows */}
        <div className="space-y-1 divide-y divide-gray-50">
          {items.map((farmer, idx) => {
            const formattedAmount = Math.round(
              farmer.outstandingPaise / 100,
            ).toLocaleString("en-IN");
            const isRed = idx === 0 || farmer.outstandingPaise <= 500000;

            return (
              <div
                key={farmer.farmerId}
                role="button"
                tabIndex={0}
                onClick={() => onSelectFarmer(farmer.farmerId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectFarmer(farmer.farmerId);
                  }
                }}
                className="flex items-center justify-between py-1.5 px-1 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                {/* Amount Pill */}
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold shrink-0 ${
                    isRed
                      ? "bg-[#FDE8E7] text-[#B91C1C]"
                      : "bg-[#FFF2D5] text-[#B45309]"
                  }`}
                >
                  ₹ {formattedAmount}
                </span>

                {/* Farmer Name */}
                <span className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-[#16812F] transition-colors truncate px-2 flex-1">
                  {farmer.farmerName}
                </span>

                {/* Pending Bills Count */}
                <span className="text-[11px] text-gray-400 font-medium shrink-0">
                  {farmer.pendingBillsCount}{" "}
                  {farmer.pendingBillsCount === 1 ? "Bill" : "Bills"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* View All Dues Action Button matching payments.jpeg */}
      <div className="pt-2 mt-1">
        <button
          type="button"
          onClick={onViewAllDues}
          className="w-full py-2 px-3 rounded-lg bg-[#E5F6E6] hover:bg-[#d5eed7] text-[#16812F] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>View All Dues</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
