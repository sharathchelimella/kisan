import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  Eye,
  Tractor,
  WalletCards,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Farmer } from "@kisan/contracts";

export interface FarmerActionMenuProps {
  farmer: Farmer;
  onEdit: (farmer: Farmer) => void;
  onDelete: (farmer: Farmer) => void;
}

export function FarmerActionMenu({
  farmer,
  onEdit,
  onDelete,
}: FarmerActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-[#647067] hover:text-[#17251C] hover:bg-emerald-50 transition-colors cursor-pointer"
        aria-label={`Actions for ${farmer.name}`}
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#E3E8E4] py-1 z-50 animate-scale-in text-xs font-medium">
          {/* 1. View Details */}
          <Link
            to={`/farmers/${farmer.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-[#17251C] hover:bg-emerald-50/50 hover:text-[#064B35] transition-colors no-underline"
          >
            <Eye size={14} className="text-[#647067]" />
            <span>View Details</span>
          </Link>

          {/* 2. Add Work */}
          <Link
            to={`/jobs/new?farmerId=${encodeURIComponent(farmer.id)}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-[#17251C] hover:bg-emerald-50/50 hover:text-[#064B35] transition-colors no-underline"
          >
            <Tractor size={14} className="text-[#647067]" />
            <span>Add Work</span>
          </Link>

          {/* 3. Record Payment */}
          <Link
            to={`/payments?farmerId=${encodeURIComponent(farmer.id)}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-[#17251C] hover:bg-emerald-50/50 hover:text-[#064B35] transition-colors no-underline"
          >
            <WalletCards size={14} className="text-[#647067]" />
            <span>Record Payment</span>
          </Link>

          {/* 4. View Bills */}
          <Link
            to={`/invoices?farmerId=${encodeURIComponent(farmer.id)}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-[#17251C] hover:bg-emerald-50/50 hover:text-[#064B35] transition-colors no-underline"
          >
            <FileText size={14} className="text-[#647067]" />
            <span>View Bills</span>
          </Link>

          {/* 5. Edit Farmer */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(farmer);
            }}
            className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-[#17251C] hover:bg-emerald-50/50 hover:text-[#064B35] transition-colors cursor-pointer"
          >
            <Pencil size={14} className="text-[#647067]" />
            <span>Edit Farmer</span>
          </button>

          {/* 6. Delete / Archive */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(farmer);
            }}
            className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-red-600 hover:bg-red-50 border-t border-[#F1F5F3] mt-1 transition-colors cursor-pointer"
          >
            <Trash2 size={14} className="text-red-600" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
