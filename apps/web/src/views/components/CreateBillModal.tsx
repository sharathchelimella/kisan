import React, { useState, useEffect } from "react";
import {
  X,
  User,
  CheckCircle,
  FileText,
  Calendar,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Tractor,
} from "lucide-react";
import {
  invoiceClient,
  type UnbilledWorkItem,
  type ExtendedInvoice,
} from "../../services/invoices";

export interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInvoice: ExtendedInvoice) => void;
}

export function CreateBillModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBillModalProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Unbilled work items
  const [unbilledItems, setUnbilledItems] = useState<UnbilledWorkItem[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("");
  const [selectedWorkIds, setSelectedWorkIds] = useState<Set<string>>(new Set());

  // Bill metadata
  const [billDate, setBillDate] = useState<string>(
    new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  );
  const [notes, setNotes] = useState<string>("Standard tractor machinery work completed.");

  // Load unbilled work on mount / open
  useEffect(() => {
    if (isOpen && invoiceClient.unbilledWork) {
      invoiceClient.unbilledWork().then((items) => {
        setUnbilledItems(items);
        if (items.length > 0 && !selectedFarmerId) {
          setSelectedFarmerId(items[0].farmerId);
          setSelectedWorkIds(new Set([items[0].id]));
        }
      });
    }
  }, [isOpen, selectedFarmerId]);

  if (!isOpen) return null;

  // Distinct farmers with unbilled work
  const uniqueFarmers = Array.from(
    new Map(unbilledItems.map((item) => [item.farmerId, item])).values(),
  );

  const selectedFarmer = unbilledItems.find((i) => i.farmerId === selectedFarmerId);
  const farmerUnbilledItems = unbilledItems.filter((i) => i.farmerId === selectedFarmerId);

  const selectedItems = farmerUnbilledItems.filter((i) => selectedWorkIds.has(i.id));
  const totalAmountPaise = selectedItems.reduce((acc, i) => acc + i.totalPaise, 0);

  function toggleWorkItem(id: string) {
    const next = new Set(selectedWorkIds);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedWorkIds(next);
  }

  async function handleGenerateInvoice() {
    if (!selectedFarmer || selectedItems.length === 0) {
      setError("Please select at least one completed work record.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (invoiceClient.createBill) {
        const created = await invoiceClient.createBill({
          farmerId: selectedFarmer.farmerId,
          farmerName: selectedFarmer.farmerName,
          village: selectedFarmer.village,
          billDate,
          workDate: selectedItems[0]?.workDate || billDate,
          lines: selectedItems.map((item) => ({
            serviceName: item.serviceName,
            unit: item.unit,
            quantity: item.quantity,
            ratePaise: item.ratePaise,
            amountPaise: item.totalPaise,
          })),
          notes,
        });

        onSuccess(created);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bill.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8FAF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F8EC] text-[#087A32] flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 leading-tight">Create New Bill</h3>
              <p className="text-xs text-gray-500">Step {step} of 3: {step === 1 ? "Select Farmer" : step === 2 ? "Select Work Records" : "Review & Issue"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Farmer */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <label className="block text-xs font-bold text-gray-800">
              Select Farmer with Unbilled Work
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uniqueFarmers.map((f) => {
                const isSelected = selectedFarmerId === f.farmerId;
                return (
                  <div
                    key={f.farmerId}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedFarmerId(f.farmerId);
                      const fItems = unbilledItems.filter((i) => i.farmerId === f.farmerId);
                      setSelectedWorkIds(new Set(fItems.map((i) => i.id)));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedFarmerId(f.farmerId);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#087A32] bg-[#E8F8EC]/40"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8F8EC] text-[#087A32] flex items-center justify-center font-bold text-xs">
                        {f.farmerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900">{f.farmerName}</div>
                        <div className="text-xs text-gray-500">{f.village} Village</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle size={18} className="text-[#087A32]" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Work Records */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800">
                Completed Work for {selectedFarmer?.farmerName}
              </label>
              <span className="text-xs text-gray-500">
                {selectedWorkIds.size} of {farmerUnbilledItems.length} selected
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {farmerUnbilledItems.map((item) => {
                const isChecked = selectedWorkIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleWorkItem(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? "border-[#087A32] bg-[#E8F8EC]/40"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#087A32] accent-[#087A32] cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-gray-900">{item.serviceName}</div>
                        <div className="text-xs text-gray-500">
                          {item.quantity} {item.unit} · {item.workDate}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-gray-900">
                      ₹{(item.totalPaise / 100).toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bill Date
              </label>
              <input
                type="text"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review & Generate */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div className="bg-[#F8FAF9] p-4 rounded-xl border border-gray-200/80 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Farmer:</span>
                <span className="font-bold text-gray-900">{selectedFarmer?.farmerName} ({selectedFarmer?.village})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bill Date:</span>
                <span className="font-semibold text-gray-900">{billDate}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
                <span className="text-gray-800">Total Billed:</span>
                <span className="text-[#087A32] text-base">₹{(totalAmountPaise / 100).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Invoice Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-900"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-[#087A32] hover:bg-[#066529] text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerateInvoice}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-[#087A32] hover:bg-[#066529] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle size={15} />
              <span>{loading ? "Generating..." : "Generate Invoice"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
