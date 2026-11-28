import React, { useState, useRef, useEffect } from "react";
import { Globe, Bell, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { authClient } from "../../services/auth";
import paymentHeaderTractor from "../../assets/payment-header-tractor.jpg";

export function PaymentHeaderBanner() {
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
    <div className="relative flex items-center justify-between pb-1 mb-3">
      {/* Left: Rupee Badge + Title + Subtitle */}
      <div className="flex items-center gap-3 z-10 shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#15803D] text-white flex items-center justify-center font-bold text-lg shadow-2xs">
          ₹
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-tight">
            Payments
          </h1>
          <p className="text-xs text-gray-500 font-normal mt-0.5">
            Collect payments, track dues and view payment history
          </p>
        </div>
      </div>

      {/* Center-Right: Realistic Agricultural Landscape Tractor in Farmland fading softly to the left */}
      <div
        className="hidden md:block absolute right-52 lg:right-64 top-0 bottom-0 w-64 lg:w-80 pointer-events-none select-none overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 35%, black 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.85) 35%, black 100%)",
        }}
      >
        <img
          src={paymentHeaderTractor}
          alt="Farmland tractor"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Right: Header Controls matching payments.jpeg (English, Bell with dot, Kisan Owner profile) */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0 z-10">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-[#17251C] border border-[#E2E8E5] bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
            aria-expanded={langMenuOpen}
            aria-haspopup="true"
          >
            <Globe size={14} className="text-[#647067]" />
            <span>{currentLang}</span>
            <ChevronDown size={13} className="text-gray-400" />
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

        {/* Notification Bell with red dot */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-1.5 text-[#647067] hover:text-[#17251C] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#EA4335] rounded-full ring-2 ring-white" />
          </button>
        </div>

        {/* User Profile Pill matching payments.jpeg */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-7 h-7 rounded-full bg-[#064B35] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              K
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-gray-800">
              Kisan Owner
            </span>
            <ChevronDown size={13} className="text-gray-400" />
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
