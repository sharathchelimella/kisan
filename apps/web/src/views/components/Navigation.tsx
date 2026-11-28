import { useState } from "react";
import {
  Home,
  Users,
  PlusSquare,
  FileText,
  Tractor,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Receipt,
  Wallet,
  Briefcase,
  X,
  Menu,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation } from "react-router-dom";
import { TractorLogo, SidebarLandscape } from "./SidebarIllustration";

export function Brand({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <Link
      className="brand-header flex items-center gap-3 px-1 py-1 text-white no-underline group"
      to="/dashboard"
      onClick={onClick}
    >
      <span className="brand-logo-icon flex items-center justify-center p-1 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors flex-shrink-0">
        <TractorLogo size={34} />
      </span>
      <div className="flex flex-col">
        <span className="text-xl md:text-2xl font-bold tracking-tight text-white leading-none">
          {t("brand", "Kisan")}
        </span>
        <span className="text-xs font-medium text-emerald-100/75 tracking-wide mt-1">
          {t("product", "Machinery Manager")}
        </span>
      </div>
    </Link>
  );
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();

  // Submenu state for Bills & Payments
  const isBillingActive =
    location.pathname.startsWith("/invoices") ||
    location.pathname.startsWith("/payments") ||
    (location.pathname.startsWith("/jobs") && !location.pathname.startsWith("/jobs/new"));

  const [billingExpanded, setBillingExpanded] = useState(isBillingActive);

  return (
    <aside
      className={`sidebar-container fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between w-[260px] bg-[#064B35] text-white shadow-xl transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
      aria-label={t("navigation", "Main Navigation")}
    >
      {/* Top Branding Section */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Brand onClick={onClose} />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden text-white/70 hover:text-white p-1 rounded-lg"
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Items matching the exact Reference Image order */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {/* 1. Dashboard */}
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#2EA44F] text-white font-semibold shadow-sm"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`
          }
        >
          <Home size={19} className="flex-shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        {/* 2. Farmers */}
        <NavLink
          to="/farmers"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#2EA44F] text-white font-semibold shadow-sm"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`
          }
        >
          <Users size={19} className="flex-shrink-0" />
          <span>Farmers</span>
        </NavLink>

        {/* 3. Machinery / Tools */}
        <NavLink
          to="/machinery"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#2EA44F] text-white font-semibold shadow-sm"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`
          }
        >
          <Tractor size={19} className="flex-shrink-0" />
          <span>Machinery / Tools</span>
        </NavLink>

        {/* 4. Add Work (Service) */}
        <NavLink
          to="/jobs/new"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#2EA44F] text-white font-semibold shadow-sm"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`
          }
        >
          <PlusSquare size={19} className="flex-shrink-0" />
          <span>Add Work (Service)</span>
        </NavLink>

        {/* 5. Bills / Invoices */}
        <NavLink
          to="/invoices"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#2EA44F] text-white font-semibold shadow-sm"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`
          }
        >
          <Receipt size={19} className="flex-shrink-0" />
          <span>Bills / Invoices</span>
        </NavLink>

        {/* 6. Payments matching payments.jpeg */}
        <NavLink
          to="/payments"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#2EA44F] text-white font-semibold shadow-sm"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`
          }
        >
          <span className="w-5 text-center font-bold text-base leading-none flex-shrink-0">₹</span>
          <span>Payments</span>
        </NavLink>

        {/* 7. Reports */}
        <NavLink
          to="/reports"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#2EA44F] text-white font-semibold shadow-sm"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`
          }
        >
          <BarChart3 size={19} className="flex-shrink-0" />
          <span>Reports</span>
        </NavLink>

        {/* 8. Settings */}
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#2EA44F] text-white font-semibold shadow-sm"
                : "text-white/85 hover:text-white hover:bg-white/10"
            }`
          }
        >
          <Settings size={19} className="flex-shrink-0" />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Bottom Agricultural Illustration matching Reference Image */}
      <div className="sidebar-bottom-illustration mt-auto overflow-hidden pointer-events-none">
        <SidebarLandscape />
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const primaryMobileTabs = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/farmers", label: "Farmers", icon: Users },
    { path: "/jobs/new", label: "Add Work", icon: PlusSquare, highlight: true },
    { path: "/machinery", label: "Machinery", icon: Tractor },
    { path: "/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Bottom Bar for Mobile Devices */}
      <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden bg-white border-t border-[#E2E8E5] shadow-lg flex items-center justify-around px-2 py-1.5 safe-bottom">
        {primaryMobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                tab.highlight
                  ? "bg-[#15803D] text-white -mt-4 px-3 py-2 rounded-full shadow-md"
                  : isActive
                  ? "text-[#15803D] font-bold"
                  : "text-[#64748B] hover:text-[#14251C]"
              }`}
            >
              <Icon size={tab.highlight ? 22 : 20} aria-hidden />
              <span className={tab.highlight ? "text-[10px] mt-0.5" : "text-[11px] mt-0.5"}>
                {tab.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 text-[#64748B] hover:text-[#14251C] text-xs font-medium"
        >
          <Menu size={20} aria-hidden />
          <span className="text-[11px] mt-0.5">{t("more", "More")}</span>
        </button>
      </div>
    </>
  );
}

export function BottomNavigation() {
  return <MobileNavigation />;
}
