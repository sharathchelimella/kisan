import {
  FileText,
  Users,
  Phone,
  MapPin,
  Tractor,
  Calendar,
  Layers,
  IndianRupee,
  Calculator,
} from "lucide-react";

export interface AddWorkSummaryProps {
  farmer?: {
    id: string;
    name: string;
    mobile?: string;
    village: string;
  };
  machineryName?: string;
  workType?: string;
  workDate?: string;
  unit?: string;
  quantity?: string;
  rate?: number;
  totalPaise?: number;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Not set";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  } catch {
    return dateStr;
  }
}

function formatUnitLabel(unit?: string, qty?: string): string {
  const q = qty ? `${qty} ` : "";
  if (!unit) return `${q}acres`;
  switch (unit.toUpperCase()) {
    case "ACRE":
      return `${q}acres`;
    case "HOUR":
      return `${q}hours`;
    case "TRIP":
      return `${q}trips`;
    default:
      return `${q}${unit.toLowerCase()}`;
  }
}

function formatRateLabel(unit?: string): string {
  if (!unit) return "Rate per Acre";
  switch (unit.toUpperCase()) {
    case "ACRE":
      return "Rate per Acre";
    case "HOUR":
      return "Rate per Hour";
    case "TRIP":
      return "Rate per Trip";
    default:
      return "Rate";
  }
}

export function AddWorkSummary({
  farmer,
  machineryName = "Tractor + Rotavator",
  workType = "Rotavator (Cultivation)",
  workDate = "2025-01-26",
  unit = "ACRE",
  quantity = "3.50",
  rate = 1700,
  totalPaise = 595000,
}: AddWorkSummaryProps) {
  const formattedRate = rate.toLocaleString("en-IN");
  const formattedTotal = Math.round(totalPaise / 100).toLocaleString("en-IN");
  const formattedDate = formatDate(workDate);
  const formattedArea = formatUnitLabel(unit, quantity);
  const rateLabel = formatRateLabel(unit);

  return (
    <aside
      aria-label="Work Summary"
      className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden sticky top-6 transition-all"
    >
      {/* Dark Green Header */}
      <div className="bg-[#16812F] px-5 py-4 text-white flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-base leading-tight">Work Summary</h3>
          <p className="text-xs text-green-100 font-normal mt-0.5">
            Check the details before saving
          </p>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-4 text-sm">
        {/* Farmer Section */}
        <div className="flex items-start gap-3 pb-3.5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16812F] flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>Farmer:</span>
              <span className="font-bold text-gray-900 text-sm">
                {farmer ? farmer.name : "Not selected"}
              </span>
            </div>

            {farmer?.mobile && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {farmer.mobile.startsWith("+") ? farmer.mobile : `+91 ${farmer.mobile}`}
                </span>
              </div>
            )}

            {farmer?.village && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{farmer.village}</span>
              </div>
            )}
          </div>
        </div>

        {/* Machinery Section */}
        <div className="flex items-start gap-3 pb-3.5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16812F] flex items-center justify-center shrink-0 mt-0.5">
            <Tractor className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>Machinery:</span>
              <span className="font-bold text-gray-900 text-sm">{machineryName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>Work Type:</span>
              <span className="font-medium text-gray-800 text-xs">{workType}</span>
            </div>
          </div>
        </div>

        {/* Work Details Section */}
        <div className="space-y-2.5 pb-2">
          {/* Work Date */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Work Date:</span>
            </div>
            <span className="font-medium text-gray-900">{formattedDate}</span>
          </div>

          {/* Area / Duration */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Layers className="w-4 h-4 text-gray-400" />
              <span>Area:</span>
            </div>
            <span className="font-medium text-gray-900">{formattedArea}</span>
          </div>

          {/* Rate */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <IndianRupee className="w-4 h-4 text-gray-400" />
              <span>{rateLabel}:</span>
            </div>
            <span className="font-medium text-gray-900">₹ {formattedRate}</span>
          </div>
        </div>

        {/* Total Amount Highlight Card */}
        <div className="bg-[#E5F6E6] border border-[#C5ECC9] rounded-xl p-3.5 sm:p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-[#075C2D] font-semibold text-xs sm:text-sm">
            <Calculator className="w-4 h-4 text-[#16812F]" />
            <span>Total Amount</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#075C2D] tracking-tight">
            ₹ {formattedTotal}
          </div>
        </div>
      </div>
    </aside>
  );
}
