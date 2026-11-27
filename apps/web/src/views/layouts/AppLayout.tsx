import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Sidebar, MobileNavigation } from "../components/Navigation";
import { Header } from "../components/Header";

export function LanguagePicker() {
  const { t, i18n } = useTranslation();
  return (
    <div className="language inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8E5] text-sm font-medium text-[#14251C]">
      <Languages size={16} className="text-[#15803D]" aria-hidden="true" />
      <select
        aria-label={t("language")}
        value={i18n.resolvedLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        className="bg-transparent border-none text-xs font-semibold text-[#14251C] outline-none cursor-pointer"
      >
        <option value="en" lang="en">
          English
        </option>
        <option value="te" lang="te">
          తెలుగు
        </option>
        <option value="hi" lang="hi">
          हिन्दी
        </option>
      </select>
    </div>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#14251C] flex">
      {/* Accessibility Skip Link */}
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#15803D] focus:text-white focus:rounded-lg focus:shadow-lg"
        href="#main-content"
      >
        {t("skip", "Skip to main content")}
      </a>

      {/* Desktop Sidebar (Fixed left 260px) */}
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Workspace (Offset by sidebar width on desktop) */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Global Header */}
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 md:px-7 py-3.5 focus:outline-none max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation Drawer & Bottom Bar */}
      <MobileNavigation />
    </div>
  );
}
