import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, User, Phone, MapPin, AlertCircle, LoaderCircle } from "lucide-react";
import {
  farmerWriteSchema,
  type Farmer,
  type FarmerInput,
} from "@kisan/contracts";
import { farmersClient } from "../../services/farmers";

export interface FarmerModalProps {
  farmer?: Farmer | null;
  villages?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: Farmer) => void;
}

const DEFAULT_VILLAGES = [
  "Lingampalli",
  "Kothapalli",
  "Venkatapalli",
  "Chintalapalli",
  "Rangampet",
  "Peddapalli",
  "Mallampet",
  "Mancherial",
  "Hajipur",
  "Luxettipet",
  "Jannaram",
  "Dandepally",
  "Naspur",
];

export function FarmerModal({
  farmer,
  villages = DEFAULT_VILLAGES,
  isOpen,
  onClose,
  onSuccess,
}: FarmerModalProps) {
  const isEditing = Boolean(farmer?.id);
  const [duplicateWarning, setDuplicateWarning] = useState<Farmer[]>([]);
  const [pendingInput, setPendingInput] = useState<FarmerInput | null>(null);
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const form = useForm<FarmerInput>({
    resolver: zodResolver(farmerWriteSchema),
    defaultValues: {
      name: farmer?.name ?? "",
      mobile: farmer?.mobile ?? "",
      village: farmer?.village ?? (villages[0] || "Lingampalli"),
      notes: farmer?.notes ?? "",
    },
  });

  if (!isOpen) return null;

  async function executeSave(input: FarmerInput) {
    setBusy(true);
    setServerError("");
    try {
      const saved = await farmersClient.save(input, farmer?.id);
      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Failed to save farmer details",
      );
    } finally {
      setBusy(false);
    }
  }

  const onSubmit = form.handleSubmit(async (input) => {
    setServerError("");
    setDuplicateWarning([]);
    try {
      const duplicates = await farmersClient.matches({
        name: input.name,
        village: input.village,
        mobile: input.mobile,
        excludeId: farmer?.id,
      });

      if (duplicates.length > 0 && !pendingInput) {
        setDuplicateWarning(duplicates);
        setPendingInput(input);
        return;
      }

      await executeSave(input);
    } catch {
      await executeSave(input);
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8E5] w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8ECE9] bg-[#F7F9F8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#15803D] flex items-center justify-center">
              <User size={18} />
            </div>
            <h2 className="text-base font-bold text-[#17251C]">
              {isEditing ? "Edit Farmer Details" : "Add New Farmer"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#647067] hover:text-[#17251C] hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{serverError}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#17251C] block">
              Farmer Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="text"
                {...form.register("name")}
                placeholder="e.g. Ramesh Reddy"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8E5] rounded-xl text-xs md:text-sm text-[#17251C] focus:outline-none focus:border-[#15803D]"
              />
            </div>
            {form.formState.errors.name && (
              <p className="text-[11px] text-red-600 font-medium">
                {form.formState.errors.name.message || "Name is required"}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#17251C] block">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="tel"
                {...form.register("mobile")}
                placeholder="e.g. 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8E5] rounded-xl text-xs md:text-sm text-[#17251C] focus:outline-none focus:border-[#15803D]"
              />
            </div>
            {form.formState.errors.mobile && (
              <p className="text-[11px] text-red-600 font-medium">
                Valid telephone format required
              </p>
            )}
          </div>

          {/* Village */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#17251C] block">
              Village <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="text"
                list="village-list"
                {...form.register("village")}
                placeholder="Select or enter village"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8E5] rounded-xl text-xs md:text-sm text-[#17251C] focus:outline-none focus:border-[#15803D]"
              />
              <datalist id="village-list">
                {villages.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#17251C] block">
              Notes (Optional)
            </label>
            <textarea
              {...form.register("notes")}
              rows={2}
              placeholder="Land details, crop cycle, special machinery preferences..."
              className="w-full p-3 bg-white border border-[#E2E8E5] rounded-xl text-xs md:text-sm text-[#17251C] focus:outline-none focus:border-[#15803D]"
            />
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning.length > 0 && pendingInput && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle size={15} />
                <span>Possible duplicate farmer detected:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {duplicateWarning.map((d) => (
                  <li key={d.id}>
                    {d.name} ({d.village}) — Phone: {d.mobile || "Not given"}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void executeSave(pendingInput)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs cursor-pointer"
              >
                Save Anyway
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8ECE9]">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#647067] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#087A32] hover:bg-[#066127] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              {busy && <LoaderCircle size={14} className="animate-spin" />}
              <span>{isEditing ? "Save Changes" : "Create Farmer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
