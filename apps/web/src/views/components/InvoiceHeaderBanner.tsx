import React, { useState, useRef, useEffect } from "react";
import { Globe, Bell, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { authClient } from "../../services/auth";

export function InvoiceHeaderBanner() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang =
    i18n.resolvedLanguage === "te"
      ? "తెలుగు"
      : i18n.resolvedLanguage === "hi"
      ? "हिन्दी"
      : "English";

  const handleLogout = async () => {
    try {
      await authClient.logout();
    } catch {
      // ignore
    }
    navigate("/login");
  };

  return (
    <div className="bg-[#126238] text-white px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xs mb-2">
      {/* Left: Title & Subtitle matching bills.jpeg */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
          Bills & Invoices
        </h1>
        <p className="text-xs text-emerald-100/85 font-normal mt-0.5">
          Manage all work bills, track payments and share invoices with farmers.
        </p>
      </div>

      {/* Right: Language Pill, Notification Bell, User Avatar matching bills.jpeg */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-800 bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
            aria-expanded={langMenuOpen}
            aria-haspopup="true"
          >
            <span className="text-xs">文A</span>
            <span>{currentLang}</span>
            <ChevronDown size={13} className="text-gray-500" />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  void i18n.changeLanguage("en");
                  setLangMenuOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left font-medium hover:bg-gray-50 ${
                  i18n.resolvedLanguage === "en" ? "text-[#15803D] font-bold" : "text-gray-700"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  void i18n.changeLanguage("te");
                  setLangMenuOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left font-medium hover:bg-gray-50 ${
                  i18n.resolvedLanguage === "te" ? "text-[#15803D] font-bold" : "text-gray-700"
                }`}
              >
                తెలుగు (Telugu)
              </button>
              <button
                type="button"
                onClick={() => {
                  void i18n.changeLanguage("hi");
                  setLangMenuOpen(false);
                }}
                className={`w-full px-3 py-1.5 text-left font-medium hover:bg-gray-50 ${
                  i18n.resolvedLanguage === "hi" ? "text-[#15803D] font-bold" : "text-gray-700"
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell with red badge dot */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#EA4335] rounded-full ring-2 ring-[#126238]" />
          </button>
        </div>

        {/* User Profile Avatar matching bills.jpeg */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-white/30 transition-all cursor-pointer"
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs ring-1 ring-white/40">
              <User size={16} />
            </div>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="font-semibold text-gray-900">Kisan Owner</p>
                <p className="text-[11px] text-gray-400">admin@kisanmanager.com</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                <Settings size={14} className="text-gray-400" />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-left font-medium"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
