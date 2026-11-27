import {
  LayoutDashboard,
  UsersRound,
  Tractor,
  Plus,
  ClipboardList,
  FileText,
  Wallet,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";

export const pages = {
  dashboard: { path: "/dashboard", icon: LayoutDashboard },
  farmers: { path: "/farmers", icon: UsersRound },
  machinery: { path: "/machinery", icon: Tractor },
  addWork: { path: "/jobs/new", icon: Plus },
  jobs: { path: "/jobs", icon: ClipboardList },
  invoices: { path: "/invoices", icon: FileText },
  payments: { path: "/payments", icon: Wallet },
  reports: { path: "/reports", icon: ChartNoAxesCombined },
  settings: { path: "/settings", icon: Settings },
} as const;

export type PageKey = keyof typeof pages;
export const navigation = Object.keys(pages) as PageKey[];
export const mobileNavigation = [
  "dashboard",
  "farmers",
  "addWork",
  "payments",
] as const;
export const moreNavigation = [
  "machinery",
  "jobs",
  "invoices",
  "reports",
  "settings",
] as const;
