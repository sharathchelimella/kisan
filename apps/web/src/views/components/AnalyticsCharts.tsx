import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import {
  Tractor,
  Disc,
  Truck,
  Grid,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { formatInr } from "./KpiCard";
import tractorImg from "../../assets/machinery/tractor.svg";
import rotavatorImg from "../../assets/machinery/rotavator.svg";
import ploughImg from "../../assets/machinery/plough.svg";

// 1. Monthly Revenue Trend Chart (Area / Smooth Curves - Used in ReportsPage)
export function MonthlyRevenueTrendChart({
  data = [
    { month: "Aug", revenuePaise: 21000000, collectedPaise: 14500000 },
    { month: "Sep", revenuePaise: 27500000, collectedPaise: 19500000 },
    { month: "Oct", revenuePaise: 32500000, collectedPaise: 24500000 },
    { month: "Nov", revenuePaise: 40500000, collectedPaise: 30000000 },
    { month: "Dec", revenuePaise: 43500000, collectedPaise: 34000000 },
    { month: "Jan", revenuePaise: 48500000, collectedPaise: 37200000 },
  ],
}: {
  data?: Array<{ month: string; revenuePaise: number; collectedPaise: number }>;
}) {
  const chartData = data.map((d) => ({
    month: d.month,
    revenue: Math.round(d.revenuePaise / 100),
    collected: Math.round(d.collectedPaise / 100),
  }));

  const formatYAxis = (val: number) => {
    if (val === 0) return "₹ 0";
    return `₹ ${new Intl.NumberFormat("en-IN").format(val)}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 md:p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
        <h2 className="text-base md:text-lg font-bold text-[#14251C] tracking-tight">
          Monthly Revenue Trend
        </h2>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-[#14251C]">
            <span className="w-3.5 h-1.5 rounded-full bg-[#15803D]" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5 text-[#64748B]">
            <span className="w-3.5 h-1.5 rounded-full bg-[#4ADE80]" />
            Collected
          </span>
        </div>
      </div>

      <div className="w-full h-[250px] md:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#15803D" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#15803D" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: "#E2E8E5" }}
              tick={{ fill: "#64748B", fontSize: 12, fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickFormatter={formatYAxis}
              domain={[0, 600000]}
              ticks={[0, 100000, 200000, 300000, 400000, 500000, 600000]}
              width={85}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white rounded-xl shadow-lg border border-[#E2E8E5] p-3 text-xs space-y-1">
                      <span className="font-bold text-[#14251C] block border-b border-[#F1F5F3] pb-1">
                        {payload[0].payload.month}
                      </span>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#15803D] font-medium">Revenue:</span>
                        <span className="font-bold text-[#14251C]">
                          ₹ {new Intl.NumberFormat("en-IN").format(Number(payload[0].value))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-emerald-600 font-medium">Collected:</span>
                        <span className="font-bold text-[#14251C]">
                          ₹ {new Intl.NumberFormat("en-IN").format(Number(payload[1].value))}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#15803D"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              dot={{ r: 4, fill: "#15803D", strokeWidth: 2, stroke: "#FFFFFF" }}
              activeDot={{ r: 6, fill: "#15803D" }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="collected"
              stroke="#4ADE80"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCollected)"
              dot={{ r: 3.5, fill: "#4ADE80", strokeWidth: 1.5, stroke: "#FFFFFF" }}
              activeDot={{ r: 5, fill: "#4ADE80" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 2. Revenue by Machinery Donut Chart (Used in ReportsPage)
export function RevenueByMachineryChart({
  data = [
    { name: "Tractor (Plough)", revenuePaise: 19200000, pct: 39.6, color: "#15803D" },
    { name: "Rotavator", revenuePaise: 11600000, pct: 23.9, color: "#22C55E" },
    { name: "Trailer (Mud)", revenuePaise: 8800000, pct: 18.1, color: "#F59E0B" },
    { name: "Cultivator", revenuePaise: 5600000, pct: 11.5, color: "#2CB89A" },
    { name: "Others", revenuePaise: 3300000, pct: 6.8, color: "#86EFAC" },
  ],
  totalRevenuePaise = 48500000,
}: {
  data?: Array<{ name: string; revenuePaise: number; pct: number; color?: string }>;
  totalRevenuePaise?: number;
}) {
  const pieData = data.map((d) => ({
    name: d.name,
    value: Math.round(d.revenuePaise / 100),
    color: d.color || "#15803D",
    pct: d.pct,
  }));

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 md:p-6 shadow-sm flex flex-col justify-between h-full">
      <h2 className="text-base md:text-lg font-bold text-[#14251C] tracking-tight pb-3">
        Revenue by Machinery
      </h2>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-1">
        <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={52}
                outerRadius={76}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-bold text-[#14251C] tracking-tight">
              {formatInr(totalRevenuePaise)}
            </span>
            <span className="text-[11px] font-medium text-[#64748B]">Total</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-2">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs py-0.5 border-b border-[#F1F5F3] last:border-none"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color || "#15803D" }}
                />
                <span className="font-medium text-[#14251C]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#14251C]">
                  {formatInr(item.revenuePaise)}
                </span>
                <span className="text-[#64748B] w-10 text-right font-medium">
                  {item.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. Equipment Utilization Card (Used in ReportsPage)
export function EquipmentUtilizationCard({
  items = [
    { name: "Tractor", utilizationPct: 86, icon: "tractor" },
    { name: "Rotavator", utilizationPct: 72, icon: "disc" },
    { name: "Trailer", utilizationPct: 68, icon: "truck" },
    { name: "Cultivator", utilizationPct: 54, icon: "grid" },
  ],
}: {
  items?: Array<{ name: string; utilizationPct: number; icon?: string }>;
}) {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "disc":
        return Disc;
      case "truck":
        return Truck;
      case "grid":
        return Grid;
      case "tractor":
      default:
        return Tractor;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 md:p-6 shadow-sm flex flex-col justify-between h-full">
      <h2 className="text-base md:text-lg font-bold text-[#14251C] tracking-tight pb-3">
        Equipment Utilization
      </h2>

      <div className="space-y-4 flex-1 flex flex-col justify-around">
        {items.map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-[#14251C]">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#15803D] flex items-center justify-center">
                    <Icon size={14} />
                  </span>
                  <span>{item.name}</span>
                </div>
                <span className="font-bold text-[#14251C]">{item.utilizationPct}%</span>
              </div>
              <div className="w-full bg-[#E8F5E9] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#15803D] h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.utilizationPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. Payment Breakdown Card (Used in ReportsPage)
export function PaymentBreakdownCard({
  collectedPaise = 37200000,
  pendingPaise = 11300000,
  collectedPct = 76.7,
  avgPaymentDays = 6,
}: {
  collectedPaise?: number;
  pendingPaise?: number;
  collectedPct?: number;
  avgPaymentDays?: number;
}) {
  const pieData = [
    { name: "Collected", value: Math.round(collectedPaise / 100), color: "#15803D" },
    { name: "Pending", value: Math.round(pendingPaise / 100), color: "#A7F3D0" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 md:p-6 shadow-sm flex flex-col justify-between h-full">
      <h2 className="text-base md:text-lg font-bold text-[#14251C] tracking-tight pb-3">
        Payment Breakdown
      </h2>

      <div className="flex items-center justify-between gap-4 flex-1">
        <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={44}
                outerRadius={64}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`pay-cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-bold text-[#14251C] leading-none">
              {collectedPct}%
            </span>
            <span className="text-[10px] font-medium text-[#64748B] mt-0.5">
              Collected
            </span>
          </div>
        </div>

        <div className="space-y-3 flex-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-[#14251C]">
              <span className="w-3 h-3 rounded-sm bg-[#15803D]" />
              Collected
            </span>
            <span className="font-bold text-[#14251C]">
              {formatInr(collectedPaise)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-[#14251C]">
              <span className="w-3 h-3 rounded-sm bg-[#A7F3D0]" />
              Pending
            </span>
            <span className="font-bold text-[#14251C]">
              {formatInr(pendingPaise)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#F1F5F3]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E8F5E9]/60 text-xs font-semibold text-[#064E3B]">
          <Calendar size={15} className="text-[#15803D]" />
          <span>Average Payment Time: {avgPaymentDays} days</span>
        </div>
      </div>
    </div>
  );
}

// 5. Works by Type Bar Chart (Used in ReportsPage)
export function WorksByTypeChart({
  data = [
    { name: "Plough", count: 42, color: "#15803D" },
    { name: "Rotavator", count: 28, color: "#22C55E" },
    { name: "Mud Trip", count: 24, color: "#4ADE80" },
    { name: "Cultivator", count: 18, color: "#86EFAC" },
    { name: "Others", count: 12, color: "#BBF7D0" },
  ],
}: {
  data?: Array<{ name: string; count: number; color?: string }>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8E5] p-5 md:p-6 shadow-sm flex flex-col justify-between h-full">
      <h2 className="text-base md:text-lg font-bold text-[#14251C] tracking-tight pb-2">
        Works by Type
      </h2>

      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: "#E2E8E5" }}
              tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
              dy={5}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              domain={[0, 50]}
              ticks={[0, 10, 20, 30, 40, 50]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white rounded-lg shadow-md border border-[#E2E8E5] p-2 text-xs">
                      <span className="font-semibold text-[#14251C]">
                        {payload[0].payload.name}:
                      </span>{" "}
                      <span className="font-bold text-[#15803D]">
                        {payload[0].value} works
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.color || "#15803D"} />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                fill="#14251C"
                fontSize={11}
                fontWeight={700}
                offset={6}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 6. Grouped Vertical Revenue Trend Bar Chart (matches exact Reference Image!)
export function RevenueTrendBarChart({
  data6 = [
    { month: "Aug", revenuePaise: 18000000, collectedPaise: 14000000 },
    { month: "Sep", revenuePaise: 22000000, collectedPaise: 17000000 },
    { month: "Oct", revenuePaise: 28000000, collectedPaise: 22000000 },
    { month: "Nov", revenuePaise: 32000000, collectedPaise: 25000000 },
    { month: "Dec", revenuePaise: 38000000, collectedPaise: 32000000 },
    { month: "Jan", revenuePaise: 46000000, collectedPaise: 38000000 },
  ],
  data12 = [
    { month: "Feb", revenuePaise: 12000000, collectedPaise: 9500000 },
    { month: "Mar", revenuePaise: 15000000, collectedPaise: 11000000 },
    { month: "Apr", revenuePaise: 14000000, collectedPaise: 10500000 },
    { month: "May", revenuePaise: 16000000, collectedPaise: 13000000 },
    { month: "Jun", revenuePaise: 19000000, collectedPaise: 15000000 },
    { month: "Jul", revenuePaise: 16500000, collectedPaise: 13500000 },
    { month: "Aug", revenuePaise: 18000000, collectedPaise: 14000000 },
    { month: "Sep", revenuePaise: 22000000, collectedPaise: 17000000 },
    { month: "Oct", revenuePaise: 28000000, collectedPaise: 22000000 },
    { month: "Nov", revenuePaise: 32000000, collectedPaise: 25000000 },
    { month: "Dec", revenuePaise: 38000000, collectedPaise: 32000000 },
    { month: "Jan", revenuePaise: 46000000, collectedPaise: 38000000 },
  ],
}: {
  data6?: Array<{ month: string; revenuePaise: number; collectedPaise: number }>;
  data12?: Array<{ month: string; revenuePaise: number; collectedPaise: number }>;
}) {
  const [period, setPeriod] = useState<"6" | "12">("6");

  const rawData = period === "6" ? data6 : data12;
  const chartData = rawData.map((d) => ({
    month: d.month,
    workValue: Math.round(d.revenuePaise / 100),
    collections: Math.round(d.collectedPaise / 100),
  }));

  const formatYAxis = (val: number) => {
    if (val === 0) return "₹0";
    return `₹${new Intl.NumberFormat("en-IN").format(val)}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E3E8E4] p-4 md:p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header + 6M / 12M Segmented Toggle matching Reference Image */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-base font-bold text-[#17251C] tracking-tight">
          Revenue Trend
        </h2>

        {/* 6 Months / 12 Months Pill Toggle */}
        <div className="flex items-center bg-[#F8FAF9] border border-[#E3E8E4] rounded-xl p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPeriod("6")}
            className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
              period === "6"
                ? "bg-[#15803D] text-white shadow-xs"
                : "text-[#647067] hover:text-[#17251C]"
            }`}
          >
            6 Months
          </button>
          <button
            type="button"
            onClick={() => setPeriod("12")}
            className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
              period === "12"
                ? "bg-[#15803D] text-white shadow-xs"
                : "text-[#647067] hover:text-[#17251C]"
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* Grouped Bar Chart Area */}
      <div className="w-full h-[195px] md:h-[205px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: "#E3E8E4" }}
              tick={{ fill: "#647067", fontSize: 11, fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#647067", fontSize: 11 }}
              tickFormatter={formatYAxis}
              domain={[0, 500000]}
              ticks={[0, 100000, 200000, 300000, 400000, 500000]}
              width={75}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white rounded-xl shadow-lg border border-[#E3E8E4] p-3 text-xs space-y-1">
                      <span className="font-bold text-[#17251C] block border-b border-[#F1F5F3] pb-1">
                        {payload[0].payload.month}
                      </span>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-[#647067]">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#269B49]" />
                          Work Value:
                        </span>
                        <span className="font-bold text-[#17251C]">
                          ₹{new Intl.NumberFormat("en-IN").format(Number(payload[0].value))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-[#647067]">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#A2E893]" />
                          Collections:
                        </span>
                        <span className="font-bold text-[#15803D]">
                          ₹{new Intl.NumberFormat("en-IN").format(Number(payload[1].value))}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Rich Agricultural Green Bar for Work Value */}
            <Bar
              dataKey="workValue"
              name="Work Value"
              fill="#269B49"
              radius={[4, 4, 0, 0]}
              barSize={18}
              isAnimationActive={false}
            />
            {/* Light Green Bar for Collections */}
            <Bar
              dataKey="collections"
              name="Collections"
              fill="#A2E893"
              radius={[4, 4, 0, 0]}
              barSize={18}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Centered Legend at Bottom matching Reference Image */}
      <div className="flex items-center justify-center gap-6 pt-3 border-t border-[#F1F5F3] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-[#269B49]" />
          <span className="font-medium text-[#17251C]">Work Value</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-[#A2E893]" />
          <span className="font-medium text-[#17251C]">Collections</span>
        </div>
      </div>
    </div>
  );
}

// 7. Machinery Utilization Section with Realistic Illustrations (matches exact Reference Image!)
export function MachineryUtilizationSection({
  items = [
    {
      name: "Tractor",
      kind: "TRACTOR",
      utilizationPct: 76,
      worksCount: 24,
      image: tractorImg,
    },
    {
      name: "Rotavator",
      kind: "ROTAVATOR",
      utilizationPct: 85,
      worksCount: 18,
      image: rotavatorImg,
    },
    {
      name: "Plough",
      kind: "PLOUGH",
      utilizationPct: 72,
      worksCount: 12,
      image: ploughImg,
    },
  ],
}: {
  items?: Array<{
    name: string;
    kind: string;
    utilizationPct: number;
    worksCount: number;
    image?: string;
  }>;
}) {
  const getImage = (kind: string, customImage?: string) => {
    if (customImage && !customImage.startsWith("/")) return customImage;
    const k = kind.toUpperCase();
    if (k.includes("ROTAVATOR")) return rotavatorImg;
    if (k.includes("PLOUGH")) return ploughImg;
    return tractorImg;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E3E8E4] p-4 md:p-5 shadow-xs flex flex-col justify-between h-full">
      {/* Header + View All Link */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-base font-bold text-[#17251C] tracking-tight">
          Machinery Utilization
        </h2>
        <Link
          to="/machinery"
          className="text-xs font-semibold text-[#15803D] hover:underline flex items-center gap-1 group no-underline"
        >
          <span>View All</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Machinery Rows matching Reference Image */}
      <div className="flex-1 flex flex-col justify-around divide-y divide-[#F1F5F3]">
        {items.map((item) => {
          const imgUrl = getImage(item.kind, item.image);

          return (
            <Link
              key={item.name}
              to={`/machinery/DEMO-${item.kind.toLowerCase()}`}
              className="py-2.5 first:pt-1 last:pb-1 flex items-center gap-3.5 md:gap-4 hover:bg-emerald-50/20 rounded-xl px-2 -mx-2 transition-colors group no-underline"
            >
              {/* Realistic Machinery Illustration on Left */}
              <div className="w-[62px] h-[44px] flex items-center justify-center flex-shrink-0 bg-[#F8FAF9] rounded-xl p-1 border border-[#E3E8E4]/60 group-hover:border-emerald-300 transition-colors">
                <img
                  src={imgUrl}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Machinery Name & Progress Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-[#17251C] group-hover:text-[#15803D] transition-colors truncate">
                    {item.name}
                  </span>
                  <span className="text-xs font-bold text-[#17251C]">
                    {item.utilizationPct}%
                  </span>
                </div>

                {/* Green Progress Bar */}
                <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#15803D] h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.utilizationPct}%` }}
                  />
                </div>
              </div>

              {/* Works Count Badge on Far Right */}
              <span className="text-xs font-semibold text-[#15803D] bg-[#E8F7E6] px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                {item.worksCount} Works
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
