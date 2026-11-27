import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check } from "lucide-react";

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCustomMode(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const presets = [
    { label: "This Month (Jan 1 – Jan 31, 2025)", from: "2025-01-01", to: "2025-01-31" },
    { label: "Today", from: "2026-11-27", to: "2026-11-27" },
    { label: "Last 7 days", from: "2026-11-20", to: "2026-11-27" },
    { label: "This Month (Nov 2026)", from: "2026-11-01", to: "2026-11-27" },
    { label: "Last Month (Oct 2026)", from: "2026-10-01", to: "2026-10-31" },
    { label: "Last 3 Months", from: "2026-09-01", to: "2026-11-27" },
    { label: "Last 6 Months", from: "2026-06-01", to: "2026-11-27" },
    { label: "This Year", from: "2026-01-01", to: "2026-11-27" },
  ];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Date Range Selector Pill matching Reference Image */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-xl bg-white border border-[#E3E8E4] text-xs md:text-sm font-medium text-[#17251C] shadow-xs hover:border-[#15803D]/40 transition-all cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Calendar size={15} className="text-[#17251C]" />
        <span className="font-medium">{value.label || `${value.from} – ${value.to}`}</span>
        <ChevronDown size={14} className="text-[#647067]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-[#E3E8E4] p-2.5 z-50 animate-scale-in">
          <p className="text-[11px] font-bold text-[#647067] uppercase tracking-wider px-2 py-1">
            Date Range Period
          </p>

          <div className="space-y-0.5">
            {presets.map((preset) => {
              const isSelected = value.label === preset.label;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChange(preset);
                    setOpen(false);
                    setCustomMode(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-emerald-50 text-[#15803D] font-bold"
                      : "text-[#17251C] hover:bg-gray-50"
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && <Check size={14} className="text-[#15803D]" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Toggle */}
          <div className="pt-2 mt-1 border-t border-[#F1F5F3]">
            {!customMode ? (
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                className="w-full text-left px-3 py-1.5 text-xs text-[#15803D] font-semibold hover:bg-emerald-50 rounded-xl"
              >
                + Custom Date Range...
              </button>
            ) : (
              <div className="p-2 space-y-2 bg-[#F8FAF9] rounded-xl border border-[#E3E8E4]">
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-1/2 p-1.5 text-xs rounded-lg border border-[#E3E8E4] bg-white"
                  />
                  <span className="text-xs text-[#647067]">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-1/2 p-1.5 text-xs rounded-lg border border-[#E3E8E4] bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      from: customFrom,
                      to: customTo,
                      label: `${customFrom} – ${customTo}`,
                    });
                    setOpen(false);
                    setCustomMode(false);
                  }}
                  className="w-full py-1.5 bg-[#15803D] hover:bg-[#16883D] text-white text-xs font-semibold rounded-lg text-center"
                >
                  Apply Custom Range
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
