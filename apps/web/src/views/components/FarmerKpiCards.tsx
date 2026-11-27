import { Users, Tractor, IndianRupee, Clock } from "lucide-react";

export interface FarmerKpiSummaryProps {
  totalFarmers: number;
  totalWork: number;
  totalAmountPaise: number;
  pendingAmountPaise: number;
}

export function formatFarmerCurrency(paise: number): string {
  const rupees = Math.round(paise / 100);
  return "₹ " + new Intl.NumberFormat("en-IN").format(rupees);
}

export function FarmerKpiCards({
  totalFarmers,
  totalWork,
  totalAmountPaise,
  pendingAmountPaise,
}: FarmerKpiSummaryProps) {
  const cards = [
    {
      title: "Total Farmers",
      value: new Intl.NumberFormat("en-IN").format(totalFarmers),
      icon: Users,
      cardBg: "bg-[#E8F5E5] border-[#D4ECD2]",
      iconBg: "bg-[#D4EFDF]",
      iconColor: "text-[#064B35]",
      valueColor: "text-[#17251C]",
    },
    {
      title: "Total Work",
      value: new Intl.NumberFormat("en-IN").format(totalWork),
      icon: Tractor,
      cardBg: "bg-[#E3F0FC] border-[#D0E5F8]",
      iconBg: "bg-[#CFE6FA]",
      iconColor: "text-[#0284C7]",
      valueColor: "text-[#17251C]",
    },
    {
      title: "Total Amount",
      value: formatFarmerCurrency(totalAmountPaise),
      icon: IndianRupee,
      cardBg: "bg-[#E8F5E5] border-[#D4ECD2]",
      iconBg: "bg-[#D4EFDF]",
      iconColor: "text-[#064B35]",
      valueColor: "text-[#17251C]",
    },
    {
      title: "Pending Amount",
      value: formatFarmerCurrency(pendingAmountPaise),
      icon: Clock,
      cardBg: "bg-[#FDEBEC] border-[#FBD4D7]",
      iconBg: "bg-[#FCD8DA]",
      iconColor: "text-[#B91C1C]",
      valueColor: "text-[#B91C1C]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-3.5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className={`px-4 py-3 rounded-2xl border ${c.cardBg} flex items-center gap-3 shadow-none transition-all duration-200 min-h-[82px]`}
          >
            {/* Circular icon container on the left */}
            <div
              className={`w-10 h-10 md:w-11 md:h-11 rounded-full ${c.iconBg} ${c.iconColor} flex items-center justify-center flex-shrink-0 shadow-none`}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>

            {/* Title and value on the right */}
            <div className="min-w-0 flex-1">
              <span className="text-xs md:text-sm font-medium text-[#647067] block leading-tight">
                {c.title}
              </span>
              <p
                className={`text-xl md:text-[24px] font-bold ${c.valueColor} tracking-tight mt-0.5 leading-tight truncate`}
              >
                {c.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
