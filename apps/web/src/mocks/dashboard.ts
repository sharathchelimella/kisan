import type { Dashboard } from "@kisan/contracts";
import type { DashboardClient } from "../models/dashboard";

const sample: Omit<Dashboard, "from" | "to" | "asOf"> = {
  // KPI Target Metrics from Reference Image
  workValuePaise: 48200000, // ₹4,82,000 Total Work Value
  collectionsPaise: 32600000, // ₹3,26,000 Collections (Paid)
  outstandingPaise: 15600000, // ₹1,56,000 Pending Payments
  machineryUtilizationPct: 78, // 78% Machinery Utilization

  // KPI Growth Rates vs Last Month from Reference Image
  revenueGrowthPct: 18, // +18% vs last month
  collectedGrowthPct: 22, // +22% vs last month
  pendingGrowthPct: -4, // -4% vs last month
  machineryGrowthPct: 6, // +6% vs last month

  farmerCount: 100,
  completedJobCount: 124,
  todayWorkPaise: 1850000,
  todayCollectionsPaise: 1200000,
  activeFarmerCount: 87,
  collectedPct: 67.6,
  pendingPct: 32.4,

  // 6-Month Grouped Revenue Trend (Aug to Jan) from Reference Image
  monthlyTrend: [
    { month: "Aug", revenuePaise: 18000000, collectedPaise: 14000000 },
    { month: "Sep", revenuePaise: 22000000, collectedPaise: 17000000 },
    { month: "Oct", revenuePaise: 28000000, collectedPaise: 22000000 },
    { month: "Nov", revenuePaise: 32000000, collectedPaise: 25000000 },
    { month: "Dec", revenuePaise: 38000000, collectedPaise: 32000000 },
    { month: "Jan", revenuePaise: 46000000, collectedPaise: 38000000 },
  ],

  // 12-Month Historical Data for 12M Toggle
  monthlyTrend12: [
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

  // Machinery Utilization (3 primary machines matching Reference Image)
  machineryStats: [
    {
      name: "Tractor",
      kind: "TRACTOR",
      utilizationPct: 76,
      worksCount: 24,
      image: "/src/assets/machinery/tractor.svg",
    },
    {
      name: "Rotavator",
      kind: "ROTAVATOR",
      utilizationPct: 85,
      worksCount: 18,
      image: "/src/assets/machinery/rotavator.svg",
    },
    {
      name: "Plough",
      kind: "PLOUGH",
      utilizationPct: 72,
      worksCount: 12,
      image: "/src/assets/machinery/plough.svg",
    },
  ],

  // Recent Activities (Exact 4 matching Reference Image)
  recentActivity: [
    {
      id: "ACT-01",
      kind: "WORK_COMPLETED",
      date: "Today",
      timestamp: "Today, 10:24 AM",
      label: "Work added for Ramesh (Ploughing - 3 acres)",
      amountPaise: 600000, // ₹6,000
      farmerName: "Ramesh",
      reference: "WRK-8921",
      status: "COMPLETED",
      entityId: "DEMO-work-1001",
      entityType: "JOB",
    },
    {
      id: "ACT-02",
      kind: "PAYMENT_RECEIVED",
      date: "Today",
      timestamp: "Today, 09:18 AM",
      label: "Payment received from Suresh",
      amountPaise: 1000000, // ₹10,000
      farmerName: "Suresh",
      reference: "REC-4902",
      status: "COMPLETED",
      entityId: "DEMO-rec-1",
      entityType: "PAYMENT",
    },
    {
      id: "ACT-03",
      kind: "INVOICE_GENERATED",
      date: "Yesterday",
      timestamp: "Yesterday, 06:42 PM",
      label: "Bill created for Lakshmi Narayana",
      amountPaise: 1800000, // ₹18,000
      farmerName: "Lakshmi Narayana",
      reference: "KMM-000124",
      status: "ISSUED",
      entityId: "DEMO-invoice-1",
      entityType: "INVOICE",
    },
    {
      id: "ACT-04",
      kind: "WORK_COMPLETED",
      date: "Yesterday",
      timestamp: "Yesterday, 04:10 PM",
      label: "Work added for Anil (Rotavator - 2.5 acres)",
      amountPaise: 500000, // ₹5,000
      farmerName: "Anil",
      reference: "WRK-8922",
      status: "COMPLETED",
      entityId: "DEMO-work-1002",
      entityType: "JOB",
    },
  ],

  // Pending Payments (Top Farmers) from Reference Image
  pendingPaymentsTopFarmers: [
    {
      farmerName: "Ramesh",
      works: "Tractor, Rotavator",
      totalPaise: 4800000, // ₹48,000
      paidPaise: 3000000, // ₹30,000
      pendingPaise: 1800000, // ₹18,000
      farmerId: "DEMO-farmer-1",
    },
    {
      farmerName: "Suresh",
      works: "Plough",
      totalPaise: 3200000, // ₹32,000
      paidPaise: 1000000, // ₹10,000
      pendingPaise: 2200000, // ₹22,000
      farmerId: "DEMO-farmer-2",
    },
    {
      farmerName: "Lakshmi Narayana",
      works: "Rotavator",
      totalPaise: 1800000, // ₹18,000
      paidPaise: 0, // ₹0
      pendingPaise: 1800000, // ₹18,000
      farmerId: "DEMO-farmer-1",
    },
    {
      farmerName: "Anil",
      works: "Tractor",
      totalPaise: 1200000, // ₹12,000
      paidPaise: 500000, // ₹5,000
      pendingPaise: 700000, // ₹7,000
      farmerId: "DEMO-farmer-2",
    },
  ],

  // Preserve Reports & Analytics items
  revenueByMachinery: [
    { name: "Tractor (Plough)", revenuePaise: 19200000, pct: 39.6, color: "#15803D" },
    { name: "Rotavator", revenuePaise: 11600000, pct: 23.9, color: "#22C55E" },
    { name: "Trailer (Mud)", revenuePaise: 8800000, pct: 18.1, color: "#F59E0B" },
    { name: "Cultivator", revenuePaise: 5600000, pct: 11.5, color: "#2CB89A" },
    { name: "Others", revenuePaise: 3300000, pct: 6.8, color: "#86EFAC" },
  ],

  equipmentUtilization: [
    { name: "Tractor", utilizationPct: 76, icon: "tractor", status: "Operational" },
    { name: "Rotavator", utilizationPct: 85, icon: "disc", status: "Operational" },
    { name: "Plough", utilizationPct: 72, icon: "grid", status: "Operational" },
  ],

  paymentBreakdown: {
    collectedPaise: 32600000,
    pendingPaise: 15600000,
    collectedPct: 67.6,
    avgPaymentDays: 6,
  },

  worksByType: [
    { name: "Plough", count: 42, color: "#15803D" },
    { name: "Rotavator", count: 28, color: "#22C55E" },
    { name: "Mud Trip", count: 24, color: "#4ADE80" },
    { name: "Cultivator", count: 18, color: "#86EFAC" },
    { name: "Others", count: 12, color: "#BBF7D0" },
  ],
};

export const demoDashboard: DashboardClient = {
  async summary(query) {
    return { ...query, ...sample };
  },
};
