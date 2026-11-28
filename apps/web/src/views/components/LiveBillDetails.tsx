import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  User,
  MapPin,
  Calendar,
  Tractor,
  Layers,
  IndianRupee,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { DueItem } from "../../services/payments";

export interface LiveBillDetailsProps {
  invoice: DueItem | null;
}

export function LiveBillDetails({ invoice }: LiveBillDetailsProps) {
  if (!invoice) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 text-center text-gray-500">
        <FileText className="w-7 h-7 text-gray-300 mx-auto mb-2" />
        <p className="text-xs sm:text-sm font-medium">Select a farmer and bill to view payment details.</p>
      </div>
    );
  }

  const invoiceNum = invoice.invoiceNumber || "KB-0056";
  const farmerName = invoice.farmerName || "Ramesh Reddy";
  const village = invoice.village || "Kothapally";
  const workDate = invoice.workDate || "12 Jan 2025";
  const machineryTools = invoice.machineryTools || "Tractor (Plough), Rotavator";
  const totalArea = invoice.areaLabel || "3 Acres";
  const totalAmount = Math.round(invoice.totalPaise / 100).toLocaleString("en-IN");
  const paidAmount = Math.round(invoice.paidPaise / 100).toLocaleString("en-IN");
  const dueAmount = Math.round(invoice.duePaise / 100).toLocaleString("en-IN");

  const statusLabel =
    invoice.duePaise === 0
      ? "Paid"
      : invoice.paidPaise > 0
      ? "Pending"
      : "Pending";

  const isPaid = invoice.duePaise === 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5 transition-all">
      {/* Header with Invoice # & Status Badge */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#E8F8EC] text-[#16812F] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-gray-900 tracking-tight">
            Bill Details – #{invoiceNum}
          </h3>
        </div>

        <span
          className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
            isPaid
              ? "bg-[#E0F5E1] text-[#15803D]"
              : "bg-[#FFF2D5] text-[#B45309]"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Bill Information Rows */}
      <div className="space-y-1.5 text-xs">
        {/* Farmer */}
        <div className="flex items-center justify-between py-0.5 border-b border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>Farmer</span>
          </div>
          <span className="font-semibold text-gray-900">{farmerName}</span>
        </div>

        {/* Village */}
        <div className="flex items-center justify-between py-0.5 border-b border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>Village</span>
          </div>
          <span className="font-medium text-gray-800">{village}</span>
        </div>

        {/* Work Date */}
        <div className="flex items-center justify-between py-0.5 border-b border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>Work Date</span>
          </div>
          <span className="font-medium text-gray-800">{workDate}</span>
        </div>

        {/* Machinery / Tools */}
        <div className="flex items-center justify-between py-0.5 border-b border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Tractor className="w-3.5 h-3.5 text-gray-400" />
            <span>Machinery / Tools</span>
          </div>
          <span className="font-medium text-gray-800 text-right">{machineryTools}</span>
        </div>

        {/* Total Area */}
        <div className="flex items-center justify-between py-0.5 border-b border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Layers className="w-3.5 h-3.5 text-gray-400" />
            <span>Total Area</span>
          </div>
          <span className="font-medium text-gray-800">{totalArea}</span>
        </div>

        {/* Total Amount */}
        <div className="flex items-center justify-between py-0.5 border-b border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
            <span>Total Amount</span>
          </div>
          <span className="font-bold text-gray-900">₹ {totalAmount}</span>
        </div>

        {/* Amount Paid */}
        <div className="flex items-center justify-between py-0.5 border-b border-gray-50">
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Amount Paid</span>
          </div>
          <span className="font-bold text-[#15803D]">₹ {paidAmount}</span>
        </div>

        {/* Outstanding Balance Banner matching payments.jpeg */}
        <div className="mt-2 bg-[#FDE7E7] border border-[#FBCFE8]/40 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#B91C1C] font-bold text-xs sm:text-sm">
            <IndianRupee className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Outstanding Balance</span>
          </div>
          <span className="text-base sm:text-lg font-extrabold text-[#B91C1C]">
            ₹ {dueAmount}
          </span>
        </div>

        {/* View Full Invoice Link */}
        <div className="pt-1 text-right">
          <Link
            to={`/invoices/${invoice.invoiceId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#16812F] hover:text-[#075C2D] transition-colors"
          >
            <span>View Full Invoice</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
