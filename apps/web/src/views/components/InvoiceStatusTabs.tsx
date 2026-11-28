import React from "react";
import { Plus } from "lucide-react";
import type { InvoiceTab, InvoiceTabCounts } from "../../services/invoices";

export interface InvoiceStatusTabsProps {
  activeTab: InvoiceTab;
  onTabChange: (tab: InvoiceTab) => void;
  counts: InvoiceTabCounts;
  onCreateBill: () => void;
}

export function InvoiceStatusTabs({
  activeTab,
  onTabChange,
  counts,
  onCreateBill,
}: InvoiceStatusTabsProps) {
  const tabs: { key: InvoiceTab; label: string; count: number }[] = [
    { key: "ALL", label: "All Bills", count: counts.all },
    { key: "PAID", label: "Paid", count: counts.paid },
    { key: "PENDING", label: "Pending", count: counts.pending },
    { key: "PARTIAL", label: "Partially Paid", count: counts.partial },
  ];

  return (
    <div className="flex items-center justify-between border-b border-gray-200/80 mb-4 pb-0">
      {/* Horizontal Status Tabs */}
      <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`pb-2.5 text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer relative ${
                isActive
                  ? "text-[#087A32] font-bold border-b-2 border-[#087A32]"
                  : "text-gray-600 hover:text-gray-900 font-medium"
              }`}
            >
              <span>{tab.label}</span>{" "}
              <span className={isActive ? "text-[#087A32]" : "text-gray-500"}>
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Far Right: + Create Bill Button matching bills.jpeg */}
      <div className="pb-2">
        <button
          type="button"
          onClick={onCreateBill}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#087A32] hover:bg-[#066529] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} className="stroke-[3]" />
          <span>Create Bill</span>
        </button>
      </div>
    </div>
  );
}
