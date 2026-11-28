import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  User,
  FileText,
  ChevronDown,
  Tractor,
  Banknote,
  Smartphone,
  Building2,
  MoreHorizontal,
  Check,
  AlertCircle,
} from "lucide-react";
import type { DueItem } from "../../services/payments";

export interface CollectPaymentFormProps {
  dues: DueItem[];
  selectedInvoice: DueItem | null;
  onSelectInvoice: (invoice: DueItem) => void;
  onRecordPayment: (data: {
    invoiceId: string;
    amountPaise: number;
    method: "CASH" | "UPI" | "BANK" | "OTHER";
    notes: string;
    paymentType: "Full" | "Partial";
  }) => Promise<void>;
  busy?: boolean;
}

export function CollectPaymentForm({
  dues,
  selectedInvoice,
  onSelectInvoice,
  onRecordPayment,
  busy = false,
}: CollectPaymentFormProps) {
  // Extract distinct farmers who have pending dues
  const uniqueFarmers = React.useMemo(() => {
    const map = new Map<string, { farmerId: string; farmerName: string }>();
    for (const d of dues) {
      if (!map.has(d.farmerId)) {
        map.set(d.farmerId, { farmerId: d.farmerId, farmerName: d.farmerName });
      }
    }
    return Array.from(map.values());
  }, [dues]);

  // Current selected farmer
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(() => {
    return selectedInvoice?.farmerId || (uniqueFarmers.length > 0 ? uniqueFarmers[0].farmerId : "");
  });

  // When selectedInvoice changes from outside, sync selectedFarmerId
  useEffect(() => {
    if (selectedInvoice && selectedInvoice.farmerId !== selectedFarmerId) {
      setSelectedFarmerId(selectedInvoice.farmerId);
    }
  }, [selectedInvoice]);

  // Eligible invoices for the selected farmer
  const eligibleInvoices = React.useMemo(() => {
    return dues.filter((d) => d.farmerId === selectedFarmerId && d.duePaise > 0);
  }, [dues, selectedFarmerId]);

  // Payment form states matching payments.jpeg
  const [paymentType, setPaymentType] = useState<"Full" | "Partial">("Full");
  const [amountStr, setAmountStr] = useState<string>("4500");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "BANK" | "OTHER">("CASH");
  const [notes, setNotes] = useState<string>("Paid at farm, received by owner");
  const [formError, setFormError] = useState<string>("");

  // Update amount automatically when selectedInvoice or paymentType changes
  useEffect(() => {
    if (selectedInvoice) {
      if (paymentType === "Full") {
        setAmountStr(String(Math.round(selectedInvoice.duePaise / 100)));
      }
    }
  }, [selectedInvoice, paymentType]);

  // Handle farmer selection change
  function handleFarmerChange(newFarmerId: string) {
    setSelectedFarmerId(newFarmerId);
    const firstInvoice = dues.find((d) => d.farmerId === newFarmerId && d.duePaise > 0);
    if (firstInvoice) {
      onSelectInvoice(firstInvoice);
    }
  }

  // Handle invoice selection change
  function handleInvoiceChange(invoiceId: string) {
    const inv = dues.find((d) => d.invoiceId === invoiceId);
    if (inv) {
      onSelectInvoice(inv);
    }
  }

  // Handle submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!selectedInvoice) {
      setFormError("Please select a bill to record payment.");
      return;
    }

    const cleanAmount = parseFloat(amountStr.replace(/,/g, ""));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setFormError("Please enter a valid payment amount greater than ₹ 0.");
      return;
    }

    const maxDueRupees = selectedInvoice.duePaise / 100;
    if (cleanAmount > maxDueRupees) {
      setFormError(`Payment amount cannot exceed the remaining balance of ₹ ${maxDueRupees.toLocaleString("en-IN")}.`);
      return;
    }

    try {
      await onRecordPayment({
        invoiceId: selectedInvoice.invoiceId,
        amountPaise: Math.round(cleanAmount * 100),
        method: paymentMethod,
        notes,
        paymentType,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to record payment.");
    }
  }

  const billAmount = selectedInvoice ? Math.round(selectedInvoice.totalPaise / 100) : 7500;
  const paidAmount = selectedInvoice ? Math.round(selectedInvoice.paidPaise / 100) : 3000;
  const dueAmount = selectedInvoice ? Math.round(selectedInvoice.duePaise / 100) : 4500;
  const workDesc = selectedInvoice?.workDescription || "Plough (3 Acres) + Rotavator (3 Acres)";

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5 transition-all">
      {/* Card Header */}
      <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-100">
        <div className="w-7 h-7 rounded-full bg-[#16812F] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <IndianRupee className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <h2 className="text-base font-bold text-gray-900 tracking-tight">
          Collect Payment
        </h2>
      </div>

      {formError && (
        <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Row 1: Select Farmer & Select Bill / Work */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Select Farmer */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1">
              Select Farmer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedFarmerId}
                onChange={(e) => handleFarmerChange(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#16812F] focus:ring-1 focus:ring-green-100 appearance-none cursor-pointer"
              >
                {uniqueFarmers.map((f) => (
                  <option key={f.farmerId} value={f.farmerId}>
                    {f.farmerName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Select Bill / Work */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1">
              Select Bill / Work <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedInvoice?.invoiceId || ""}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:border-[#16812F] focus:ring-1 focus:ring-green-100 appearance-none cursor-pointer"
              >
                {eligibleInvoices.map((inv) => (
                  <option key={inv.invoiceId} value={inv.invoiceId}>
                    Bill #{inv.invoiceNumber} ({inv.workDescription || "Machinery Work"})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Row 2: Selected Work Details Banner matching payments.jpeg */}
        <div className="bg-[#EAF6EB] border border-[#CDE9D2] rounded-lg p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white text-[#16812F] flex items-center justify-center shrink-0 shadow-2xs">
              <Tractor className="w-3 h-3 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-gray-900">Work Details: </span>
              <span className="text-gray-700">{workDesc}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs">
            <div>
              <span className="text-gray-500 mr-1">Bill Amount:</span>
              <span className="font-bold text-gray-900">₹ {billAmount.toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-1">Paid:</span>
              <span className="font-bold text-gray-900">₹ {paidAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-[#FEF3C7] text-[#B45309] font-bold px-2 py-0.5 rounded-md border border-[#FDE68A]">
              Balance: ₹ {dueAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Row 3: Payment Amount * & Payment Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                disabled={paymentType === "Full"}
                onChange={(e) => setAmountStr(e.target.value)}
                className={`w-full pl-7 pr-3 py-1.5 border rounded-lg text-xs sm:text-sm font-bold text-gray-900 focus:outline-none ${
                  paymentType === "Full"
                    ? "bg-gray-50/70 border-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-white border-gray-300 focus:border-[#16812F] focus:ring-1 focus:ring-green-100"
                }`}
              />
            </div>
          </div>

          {/* Payment Type Radios */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1">
              Payment Type
            </label>
            <div className="flex items-center gap-4 py-1.5">
              {/* Partial Payment */}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-800">
                <input
                  type="radio"
                  name="paymentType"
                  value="Partial"
                  checked={paymentType === "Partial"}
                  onChange={() => {
                    setPaymentType("Partial");
                    if (selectedInvoice) {
                      setAmountStr(String(Math.round(selectedInvoice.duePaise / 200)));
                    }
                  }}
                  className="w-3.5 h-3.5 text-[#16812F] focus:ring-[#16812F] accent-[#16812F]"
                />
                <span>Partial Payment</span>
              </label>

              {/* Full Payment */}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-[#16812F]">
                <input
                  type="radio"
                  name="paymentType"
                  value="Full"
                  checked={paymentType === "Full"}
                  onChange={() => {
                    setPaymentType("Full");
                    if (selectedInvoice) {
                      setAmountStr(String(Math.round(selectedInvoice.duePaise / 100)));
                    }
                  }}
                  className="w-3.5 h-3.5 text-[#16812F] focus:ring-[#16812F] accent-[#16812F]"
                />
                <span>Full Payment</span>
              </label>
            </div>
          </div>
        </div>

        {/* Row 4: Payment Method & Notes (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Payment Method buttons */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1">
              {/* Cash */}
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "CASH"
                    ? "bg-[#16803D] text-white shadow-2xs"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Banknote className="w-3 h-3" />
                <span>Cash</span>
              </button>

              {/* UPI */}
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "UPI"
                    ? "bg-[#16803D] text-white shadow-2xs"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>UPI</span>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK")}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "BANK"
                    ? "bg-[#16803D] text-white shadow-2xs"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Bank</span>
              </button>

              {/* Other */}
              <button
                type="button"
                onClick={() => setPaymentMethod("OTHER")}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "OTHER"
                    ? "bg-[#16803D] text-white shadow-2xs"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <MoreHorizontal className="w-3 h-3" />
                <span>Other</span>
              </button>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Paid at farm, received by owner"
              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#16812F] focus:ring-1 focus:ring-green-100"
            />
          </div>
        </div>

        {/* Action Button: Record Payment */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 px-4 rounded-xl bg-[#075C2D] hover:bg-[#064B25] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{busy ? "Recording Payment..." : "Record Payment"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
