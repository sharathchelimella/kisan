import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  MoreVertical,
  Eye,
  CreditCard,
  User,
  Share2,
  Download,
  Printer,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ExtendedInvoice } from "../../services/invoices";

export interface InvoiceDataTableProps {
  invoices: ExtendedInvoice[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  selectedInvoiceId: string | null;
  onSelectInvoice: (invoice: ExtendedInvoice) => void;
  onRecordPayment: (invoice: ExtendedInvoice) => void;
  onViewFarmer: (farmerId?: string) => void;
  onShareWhatsApp: (invoice: ExtendedInvoice) => void;
  onDownloadPdf: (invoice: ExtendedInvoice) => void;
  onPrintInvoice: (invoice: ExtendedInvoice) => void;
  onVoidInvoice: (invoice: ExtendedInvoice) => void;
}

export function InvoiceDataTable({
  invoices,
  total,
  page,
  pageSize,
  onPageChange,
  selectedInvoiceId,
  onSelectInvoice,
  onRecordPayment,
  onViewFarmer,
  onShareWhatsApp,
  onDownloadPdf,
  onPrintInvoice,
  onVoidInvoice,
}: InvoiceDataTableProps) {
  // Selection checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close 3-dot menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPages = Math.ceil(total / pageSize) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const allVisibleSelected =
    invoices.length > 0 && invoices.every((i) => selectedIds.has(i.id));

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((i) => i.id)));
    }
  }

  function toggleSelectRow(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function renderStatusBadge(status: string) {
    if (status === "PAID") {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#DDF5DF] text-[#166534]">
          Paid
        </span>
      );
    }
    if (status === "PARTIAL") {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FFF0C5] text-[#A16207]">
          Partially Paid
        </span>
      );
    }
    if (status === "VOID") {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
          Voided
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FDE7E7] text-[#B91C1C]">
        Pending
      </span>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col justify-between transition-all">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-[#F8FAF9] text-gray-700 font-bold border-b border-gray-200/80">
              <th className="py-2.5 pl-3.5 pr-2 w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-[#087A32] rounded border-gray-300 focus:ring-[#087A32] accent-[#087A32] cursor-pointer"
                  aria-label="Select all invoices"
                />
              </th>
              <th className="py-2.5 px-3 whitespace-nowrap">Bill No.</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Farmer Name</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Work</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">Amount</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-center">Payment Status</th>
              <th className="py-2.5 pr-3 pl-2 w-8 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No bills found matching your current filter criteria.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const isSelected = selectedInvoiceId === inv.id;
                const formattedAmount = (inv.totalPaise / 100).toLocaleString("en-IN");

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-[#E5F6E3] hover:bg-[#d8eed6]"
                        : "hover:bg-green-50/20"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 pl-3.5 pr-2" onClick={(e) => toggleSelectRow(inv.id, e)}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(inv.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#087A32] rounded border-gray-300 focus:ring-[#087A32] accent-[#087A32] cursor-pointer"
                      />
                    </td>

                    {/* Bill No. */}
                    <td className="py-3 px-3 font-semibold text-gray-900 whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>

                    {/* Farmer Name & Village */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900 group-hover:text-[#087A32] transition-colors">
                        {inv.farmerSnapshot.name}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-0.5">
                        <MapPin size={11} className="text-gray-400" />
                        <span>{inv.farmerSnapshot.village}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-gray-700 whitespace-nowrap font-medium">
                      {inv.workDate}
                    </td>

                    {/* Work */}
                    <td className="py-3 px-3 text-gray-700 whitespace-nowrap font-medium">
                      {inv.workSummary || "Machinery Work"}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 font-bold text-gray-900 text-right whitespace-nowrap">
                      ₹{formattedAmount}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {renderStatusBadge(inv.status)}
                    </td>

                    {/* 3-Dot Action Menu */}
                    <td
                      className="py-3 pr-3 pl-2 text-center relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === inv.id ? null : inv.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === inv.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-3 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 text-xs text-left"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectInvoice(inv);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-green-50/50 hover:text-[#087A32]"
                          >
                            <Eye size={14} className="text-gray-400" />
                            <span>View Details</span>
                          </button>

                          {inv.status !== "PAID" && (
                            <button
                              type="button"
                              onClick={() => {
                                onRecordPayment(inv);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-green-50/50 hover:text-[#087A32]"
                            >
                              <CreditCard size={14} className="text-gray-400" />
                              <span>Record Payment</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onViewFarmer(inv.farmerId);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-green-50/50 hover:text-[#087A32]"
                          >
                            <User size={14} className="text-gray-400" />
                            <span>View Farmer</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onShareWhatsApp(inv);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-green-50/50 hover:text-[#087A32]"
                          >
                            <Share2 size={14} className="text-gray-400" />
                            <span>Share on WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onDownloadPdf(inv);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-green-50/50 hover:text-[#087A32]"
                          >
                            <Download size={14} className="text-gray-400" />
                            <span>Download PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onPrintInvoice(inv);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 hover:bg-green-50/50 hover:text-[#087A32]"
                          >
                            <Printer size={14} className="text-gray-400" />
                            <span>Print Invoice</span>
                          </button>

                          {inv.lifecycle === "ISSUED" && inv.paidPaise === 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                onVoidInvoice(inv);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} className="text-red-500" />
                              <span>Cancel / Void</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching bills.jpeg */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
        <span className="text-xs text-gray-500 font-medium">
          Showing {startItem} – {endItem} of {total} bills
        </span>

        {/* Pagination buttons */}
        <div className="flex items-center gap-1.5">
          {/* Previous Arrow */}
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isCurrent = page === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  isCurrent
                    ? "bg-[#087A32] text-white shadow-2xs font-bold"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Arrow */}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
