import { useState, useRef, useEffect } from "react";
import {
  Globe,
  Bell,
  ChevronDown,
  Menu,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "../../services/auth";
import { GlobalSearch } from "./GlobalSearch";

export function Header({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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
    <header className="sticky top-0 z-30 bg-white border-b border-[#E3E8E4] px-4 md:px-7 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger menu & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-[480px]">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 text-[#17251C] hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="hidden md:flex p-1.5 text-[#647067] hover:text-[#17251C] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Component */}
        <GlobalSearch />
      </div>

      {/* Right Controls: Language Selector, Notification Bell, User Profile Pill */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs md:text-sm font-medium text-[#17251C] hover:bg-gray-100 transition-all cursor-pointer"
            aria-expanded={langMenuOpen}
            aria-haspopup="true"
          >
            <Globe size={16} className="text-[#647067]" />
            <span className="hidden sm:inline font-medium">{currentLang}</span>
            <ChevronDown size={14} className="text-[#647067]" />
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-[#E3E8E4] py-1.5 z-50 animate-scale-in">
              <button
                type="button"
                className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 ${
                  i18n.resolvedLanguage === "en" ? "text-[#15803D] font-bold" : "text-[#17251C]"
                }`}
                onClick={() => {
                  void i18n.changeLanguage("en");
                  setLangMenuOpen(false);
                }}
              >
                <span>English</span>
                {i18n.resolvedLanguage === "en" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                )}
              </button>
              <button
                type="button"
                className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 ${
                  i18n.resolvedLanguage === "te" ? "text-[#15803D] font-bold" : "text-[#17251C]"
                }`}
                onClick={() => {
                  void i18n.changeLanguage("te");
                  setLangMenuOpen(false);
                }}
              >
                <span>తెలుగు</span>
                {i18n.resolvedLanguage === "te" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                )}
              </button>
              <button
                type="button"
                className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 ${
                  i18n.resolvedLanguage === "hi" ? "text-[#15803D] font-bold" : "text-[#17251C]"
                }`}
                onClick={() => {
                  void i18n.changeLanguage("hi");
                  setLangMenuOpen(false);
                }}
              >
                <span>हिन्दी</span>
                {i18n.resolvedLanguage === "hi" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-2 rounded-xl text-[#647067] hover:text-[#17251C] hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell size={18} />
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-2xl shadow-xl border border-[#E3E8E4] p-3 z-50 animate-scale-in text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F3]">
                <span className="font-bold text-[#17251C]">Notifications</span>
              </div>
              <p className="py-3 text-[#647067]">No notifications.</p>
            </div>
          )}
        </div>

        {/* User Profile Pill matching Reference Image */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            aria-expanded={profileMenuOpen}
            aria-haspopup="true"
          >
            {/* Dark green circle avatar with "K" */}
            <span className="w-8 h-8 rounded-full bg-[#064B35] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
              K
            </span>
            <span className="text-xs md:text-sm font-bold text-[#17251C] hidden sm:inline">
              Kisan Owner
            </span>
            <ChevronDown size={14} className="text-[#647067]" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-[#E3E8E4] py-1.5 z-50 animate-scale-in">
              <div className="px-3.5 py-2 border-b border-[#F1F5F3]">
                <p className="text-xs font-bold text-[#17251C]">Kisan Owner</p>
                <p className="text-[11px] text-[#647067] truncate">owner@kisan.ag</p>
              </div>
              <Link
                to="/profile"
                className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-[#17251C] hover:bg-gray-50 no-underline"
                onClick={() => setProfileMenuOpen(false)}
              >
                <User size={14} className="text-[#647067]" />
                <span>My Profile</span>
              </Link>
              <Link
                to="/settings"
                className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-[#17251C] hover:bg-gray-50 no-underline"
                onClick={() => setProfileMenuOpen(false)}
              >
                <Settings size={14} className="text-[#647067]" />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50 border-t border-[#F1F5F3] mt-1"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
