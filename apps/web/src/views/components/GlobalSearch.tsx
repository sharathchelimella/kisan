import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Receipt,
  Briefcase,
  Tractor,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { farmersClient } from "../../services/farmers";
import { invoiceClient } from "../../services/invoices";
import { jobReadClient } from "../../services/job-records";
import { catalogClient } from "../../services/catalog";

interface SearchResultItem {
  id: string;
  category: "Farmer" | "Invoice" | "Work" | "Machinery";
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim().toLowerCase();
        const [farmers, invoices, jobs, equipment] = await Promise.allSettled([
          farmersClient.list({ q, page: 1, pageSize: 4, archived: "false" }),
          invoiceClient.list({ q, page: 1, pageSize: 4 }),
          jobReadClient.list({ q, page: 1, pageSize: 4, sort: "newest" }),
          catalogClient.equipment({ active: "all", page: 1, pageSize: 4 }),
        ]);

        const combined: SearchResultItem[] = [];

        // 1. Farmers
        if (farmers.status === "fulfilled" && farmers.value?.items) {
          for (const f of farmers.value.items) {
            combined.push({
              id: f.id,
              category: "Farmer",
              title: f.name,
              subtitle: `Village: ${f.village || "Madhapur"} · Mobile: ${f.mobile || "—"}`,
              url: `/farmers/${f.id}`,
            });
          }
        }

        // 2. Invoices / Bills
        if (invoices.status === "fulfilled" && invoices.value?.items) {
          for (const inv of invoices.value.items) {
            combined.push({
              id: inv.id,
              category: "Invoice",
              title: `Bill ${inv.invoiceNumber}`,
              subtitle: `Farmer: ${inv.farmerSnapshot?.name || "Farmer"} · Due: ₹${(inv.duePaise || 0) / 100}`,
              url: `/invoices/${inv.id}`,
            });
          }
        }

        // 3. Work Records
        if (jobs.status === "fulfilled" && jobs.value?.items) {
          for (const j of jobs.value.items) {
            combined.push({
              id: j.id,
              category: "Work",
              title: `Work #${j.id.slice(-6)} · ${j.services?.[0] || "Ploughing"}`,
              subtitle: `Farmer: ${j.farmerName || "Farmer"} · ${j.workDate} · ₹${(j.totalPaise || 0) / 100}`,
              url: `/jobs/${j.id}`,
            });
          }
        }

        // 4. Machinery
        if (equipment.status === "fulfilled" && equipment.value?.items) {
          for (const eq of equipment.value.items) {
            if (eq.name.toLowerCase().includes(q) || eq.kind.toLowerCase().includes(q)) {
              combined.push({
                id: eq.id,
                category: "Machinery",
                title: eq.name,
                subtitle: `Kind: ${eq.kind} · Reg: ${eq.serialOrRegistration || "TS-19-TR-1001"}`,
                url: `/machinery/${eq.id}`,
              });
            }
          }
        }

        setResults(combined);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = (item: SearchResultItem) => {
    setOpen(false);
    setQuery("");
    navigate(item.url);
  };

  const getCategoryIcon = (cat: SearchResultItem["category"]) => {
    switch (cat) {
      case "Farmer":
        return <User size={13} className="text-purple-600" />;
      case "Invoice":
        return <Receipt size={13} className="text-blue-600" />;
      case "Work":
        return <Briefcase size={13} className="text-emerald-600" />;
      case "Machinery":
        return <Tractor size={13} className="text-amber-600" />;
    }
  };

  return (
    <div className="relative w-full max-w-[420px]" ref={containerRef}>
      {/* Search Input Box matching Reference Image */}
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3.5 text-[#647067] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search farmer, bill, or work..."
          className="w-full pl-9 pr-9 py-2 text-xs md:text-sm rounded-xl border border-[#E3E8E4] bg-white hover:border-[#15803D]/40 focus:border-[#15803D] focus:outline-none focus:ring-1 focus:ring-[#15803D]/20 text-[#17251C] transition-all placeholder:text-[#647067]/70"
          aria-label="Global search"
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3 text-[#15803D] animate-spin"
          />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-2.5 p-1 text-[#647067] hover:text-[#17251C] rounded-md"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-[#E3E8E4] py-2 z-50 overflow-hidden max-h-[380px] overflow-y-auto custom-scrollbar animate-scale-in">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-center text-xs text-[#647067]">
              No records found for "<span className="font-semibold">{query}</span>"
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F3]">
              {results.map((item, idx) => (
                <button
                  key={`${item.category}-${item.id}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                    selectedIndex === idx ? "bg-emerald-50/70" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#F8FAF9] border border-[#E3E8E4] flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(item.category)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#17251C] truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-gray-100 text-[#647067]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#647067] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={13} className="text-[#647067] flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
