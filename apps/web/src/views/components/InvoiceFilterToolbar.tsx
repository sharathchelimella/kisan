import React from "react";
import { Search, Calendar, Tractor, MapPin, ChevronDown } from "lucide-react";

export interface InvoiceFilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  dateRange: string;
  onDateRangeChange: (val: string) => void;
  machinery: string;
  onMachineryChange: (val: string) => void;
  village: string;
  onVillageChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
}

export function InvoiceFilterToolbar({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  machinery,
  onMachineryChange,
  village,
  onVillageChange,
  status,
  onStatusChange,
}: InvoiceFilterToolbarProps) {
  const machineryOptions = [
    { value: "ALL", label: "Machinery" },
    { value: "Plough", label: "Plough" },
    { value: "Rotavator", label: "Rotavator" },
    { value: "Tractor Trolley", label: "Tractor Trolley" },
    { value: "Cultivator", label: "Cultivator" },
  ];

  const villageOptions = [
    { value: "ALL", label: "Village" },
    { value: "Vempalli", label: "Vempalli" },
    { value: "Kottur", label: "Kottur" },
    { value: "Chintalapudi", label: "Chintalapudi" },
    { value: "Narasapur", label: "Narasapur" },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      {/* Global Invoice Search Box matching bills.jpeg */}
      <div className="relative flex-1 max-w-lg">
        <Search
          size={16}
          className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by bill no., farmer name or mobile..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#087A32] focus:ring-1 focus:ring-green-100 shadow-2xs"
        />
      </div>

      {/* 4 Compact Filter Dropdowns matching bills.jpeg */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date Range Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs hover:border-gray-300 transition-all cursor-pointer">
            <Calendar size={14} className="text-[#087A32] shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="ALL">Date Range</option>
              <option value="TODAY">Today</option>
              <option value="7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="3_MONTHS">Last 3 Months</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
            <ChevronDown size={13} className="text-gray-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Machinery Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs hover:border-gray-300 transition-all cursor-pointer">
            <Tractor size={14} className="text-[#087A32] shrink-0" />
            <select
              value={machinery}
              onChange={(e) => onMachineryChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 outline-none cursor-pointer pr-4 appearance-none"
            >
              {machineryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="text-gray-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Village Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs hover:border-gray-300 transition-all cursor-pointer">
            <MapPin size={14} className="text-[#087A32] shrink-0" />
            <select
              value={village}
              onChange={(e) => onVillageChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 outline-none cursor-pointer pr-4 appearance-none"
            >
              {villageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="text-gray-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs hover:border-gray-300 transition-all cursor-pointer">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-gray-700 outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="ALL">Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partially Paid</option>
            </select>
            <ChevronDown size={13} className="text-gray-400 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
