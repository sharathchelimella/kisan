import React from "react";
import {
  X,
  Tractor,
  User,
  Phone,
  MapPin,
  Calendar,
  Share2,
  Printer,
  MessageCircle,
} from "lucide-react";
import type { ExtendedInvoice } from "../../services/invoices";

export interface LiveInvoiceDetailsPanelProps {
  invoice: ExtendedInvoice | null;
  onClose: () => void;
  onShareWhatsApp: (invoice: ExtendedInvoice) => void;
  onShare: (invoice: ExtendedInvoice) => void;
  onPrint: (invoice: ExtendedInvoice) => void;
}

export function LiveInvoiceDetailsPanel({
  invoice,
  onClose,
  onShareWhatsApp,
  onShare,
  onPrint,
}: LiveInvoiceDetailsPanelProps) {
  if (!invoice) return null;

  const totalFormatted = (invoice.totalPaise / 100).toLocaleString("en-IN");
  const paidFormatted = (invoice.paidPaise / 100).toLocaleString("en-IN");
  const dueFormatted = (invoice.duePaise / 100).toLocaleString("en-IN");

  const isPending = invoice.duePaise > 0 && invoice.paidPaise === 0;
  const isPartial = invoice.duePaise > 0 && invoice.paidPaise > 0;
  const isPaid = invoice.duePaise === 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 transition-all flex flex-col justify-between">
      <div>
        {/* Panel Header matching bills.jpeg */}
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Invoice Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close invoice details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Branding Card matching bills.jpeg */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/60 border border-gray-100 mb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8EC] text-[#087A32] flex items-center justify-center shrink-0 shadow-2xs">
              <Tractor size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-tight">
                {invoice.ownerSnapshot?.name || "Kisan Machinery Manager"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Farm Machinery Services
              </p>
            </div>
          </div>

          <div className="bg-[#DDF5DF] text-[#166534] font-bold text-xs px-2.5 py-1 rounded-lg">
            Bill No: {invoice.invoiceNumber}
          </div>
        </div>

        {/* Two Side-by-Side Cards: Farmer Details & Bill Date matching bills.jpeg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
          {/* Left Card: Farmer Details */}
          <div className="p-3 rounded-xl border border-gray-100 bg-white">
            <h4 className="text-xs font-bold text-gray-900 mb-2">Farmer Details</h4>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <User size={13} className="text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-900">{invoice.farmerSnapshot.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <span>{invoice.farmerPhone || invoice.farmerSnapshot.mobile || "+91 98765 43210"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span>{invoice.farmerSnapshot.village} Village</span>
              </div>
            </div>
          </div>

          {/* Right Card: Bill Date & Work Date */}
          <div className="p-3 rounded-xl border border-gray-100 bg-white flex flex-col justify-center">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Bill Date:</span>
                <span className="font-semibold text-gray-900">{invoice.workDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Work Date:</span>
                <span className="font-semibold text-gray-900">{invoice.workDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Work Details Table matching bills.jpeg */}
        <div className="mb-3.5">
          <h4 className="text-xs font-bold text-gray-900 mb-2">Work Details</h4>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100">
                  <th className="py-2 px-2.5 w-6">#</th>
                  <th className="py-2 px-2.5">Machinery / Work</th>
                  <th className="py-2 px-2.5">Area / Trips</th>
                  <th className="py-2 px-2.5">Rate</th>
                  <th className="py-2 px-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.lines.map((line, idx) => {
                  const lineRate = line.ratePaise ? `₹${(line.ratePaise / 100).toLocaleString("en-IN")} / ${line.unit.toLowerCase()}` : "-";
                  const lineAmount = `₹${(line.amountPaise / 100).toLocaleString("en-IN")}`;

                  return (
                    <tr key={line.lineId || idx} className="hover:bg-gray-50/40">
                      <td className="py-2 px-2.5 text-gray-500 font-medium">{idx + 1}</td>
                      <td className="py-2 px-2.5 font-semibold text-gray-900">{line.serviceName}</td>
                      <td className="py-2 px-2.5 text-gray-700">{line.quantity} {line.unit === "TRIP" ? "Trips" : "Acres"}</td>
                      <td className="py-2 px-2.5 text-gray-700">{lineRate}</td>
                      <td className="py-2 px-2.5 font-bold text-gray-900 text-right">{lineAmount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary matching bills.jpeg */}
        <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Total Amount</span>
            <span className="font-extrabold text-gray-900 text-sm">₹{totalFormatted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Amount Paid</span>
            <span className="font-bold text-[#16812F] text-xs">₹{paidFormatted}</span>
          </div>

          {/* Pending Amount Banner matching bills.jpeg */}
          <div className="p-2.5 rounded-xl bg-[#FDE7E7] border border-[#FBCFE8]/40 flex items-center justify-between">
            <span className="font-bold text-[#B91C1C]">Pending Amount</span>
            <span className="font-extrabold text-[#B91C1C] text-sm sm:text-base">₹{dueFormatted}</span>
          </div>

          {/* Payment Status Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-600 font-medium">Payment Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                isPaid
                  ? "bg-[#DDF5DF] text-[#166534]"
                  : isPartial
                  ? "bg-[#FFF0C5] text-[#A16207]"
                  : "bg-[#FDE7E7] text-[#B91C1C]"
              }`}
            >
              {isPaid ? "Paid" : isPartial ? "Partially Paid" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons at bottom matching bills.jpeg */}
      <div className="flex items-center gap-2 pt-4 mt-2">
        {/* Share on WhatsApp */}
        <button
          type="button"
          onClick={() => onShareWhatsApp(invoice)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#087A32] hover:bg-[#066529] text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
        >
          <MessageCircle size={15} className="fill-white" />
          <span>Share on WhatsApp</span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={() => onShare(invoice)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200/90 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>

        {/* Print / PDF */}
        <button
          type="button"
          onClick={() => onPrint(invoice)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200/90 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
        >
          <Printer size={14} />
          <span>Print / PDF</span>
        </button>
      </div>
    </div>
  );
}
